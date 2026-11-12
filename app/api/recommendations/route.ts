import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth';
import { formatVectorForPg } from '@/semantic/embedding_service/embedder';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetPaperId = searchParams.get('paperId');
    const limit = Math.max(1, Math.min(20, parseInt(searchParams.get('limit') || '6', 10)));
    const user = getCurrentUser(req);

    // Scenario A: Similar papers for a specific paper_id
    if (targetPaperId) {
      const pId = parseInt(targetPaperId, 10);
      const similarSql = `
        SELECT 
          rp.paper_id,
          rp.title,
          rp.abstract,
          rp.doi,
          rp.publication_date,
          rp.citation_count,
          rp.source,
          COALESCE(string_agg(DISTINCT a.name, ', ' ORDER BY a.name), 'Unknown Author') AS authors,
          COALESCE(string_agg(DISTINCT ra.area_name, ', ' ORDER BY ra.area_name), 'General') AS research_areas,
          ROUND((1 - (pe.embedding <=> target.embedding))::numeric, 4) AS similarity_score
        FROM PAPER_EMBEDDINGS target
        CROSS JOIN PAPER_EMBEDDINGS pe
        JOIN RESEARCH_PAPER rp ON pe.paper_id = rp.paper_id
        LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
        LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
        LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
        LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
        WHERE target.paper_id = $1 AND pe.paper_id <> $1
        GROUP BY rp.paper_id, rp.title, rp.abstract, rp.doi, rp.publication_date, rp.citation_count, rp.source, pe.embedding, target.embedding
        ORDER BY pe.embedding <=> target.embedding ASC
        LIMIT $2;
      `;
      const similarRes = await query(similarSql, [pId, limit]);
      return NextResponse.json({
        type: 'SIMILAR_PAPERS',
        targetPaperId: pId,
        recommendations: similarRes.rows,
      });
    }

    // Scenario B: Personalized recommendations based on Bookmarks & History
    let bookmarkRecommendations: any[] = [];
    let historyRecommendations: any[] = [];
    const bookmarkedIds: number[] = [];

    if (user) {
      // 1. Fetch user's bookmarked papers
      const bmRes = await query('SELECT paper_id FROM BOOKMARK WHERE user_id = $1;', [user.user_id]);
      bmRes.rows.forEach(r => bookmarkedIds.push(r.paper_id));

      if (bookmarkedIds.length > 0) {
        // Find nearest neighbors to bookmarked papers
        const placeholders = bookmarkedIds.map((_, i) => `$${i + 2}`).join(',');
        const recSql = `
          WITH user_bookmarks AS (
            SELECT embedding FROM PAPER_EMBEDDINGS WHERE paper_id IN (${bookmarkedIds.join(',')})
          )
          SELECT 
            rp.paper_id,
            rp.title,
            rp.abstract,
            rp.doi,
            rp.publication_date,
            rp.citation_count,
            rp.source,
            COALESCE(string_agg(DISTINCT a.name, ', ' ORDER BY a.name), 'Unknown Author') AS authors,
            COALESCE(string_agg(DISTINCT ra.area_name, ', ' ORDER BY ra.area_name), 'General') AS research_areas,
            MIN(pe.embedding <=> ub.embedding) AS min_dist,
            ROUND((1 - MIN(pe.embedding <=> ub.embedding))::numeric, 4) AS similarity_score
          FROM PAPER_EMBEDDINGS pe
          CROSS JOIN user_bookmarks ub
          JOIN RESEARCH_PAPER rp ON pe.paper_id = rp.paper_id
          LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
          LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
          LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
          LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
          WHERE pe.paper_id NOT IN (${bookmarkedIds.join(',')})
          GROUP BY rp.paper_id, rp.title, rp.abstract, rp.doi, rp.publication_date, rp.citation_count, rp.source
          ORDER BY min_dist ASC
          LIMIT $1;
        `;
        const recRes = await query(recSql, [limit]);
        bookmarkRecommendations = recRes.rows;
      }

      // 2. Recommendations based on recent search history
      const histRes = await query(
        `SELECT search_query FROM SEARCH_HISTORY 
         WHERE user_id = $1 
         ORDER BY search_date DESC LIMIT 3;`,
        [user.user_id]
      );
      if (histRes.rows.length > 0) {
        const topQuery = histRes.rows[0].search_query;
        const histSql = `
          SELECT 
            rp.paper_id,
            rp.title,
            rp.abstract,
            rp.doi,
            rp.publication_date,
            rp.citation_count,
            rp.source,
            COALESCE(string_agg(DISTINCT a.name, ', ' ORDER BY a.name), 'Unknown Author') AS authors,
            COALESCE(string_agg(DISTINCT ra.area_name, ', ' ORDER BY ra.area_name), 'General') AS research_areas
          FROM RESEARCH_PAPER rp
          LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
          LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
          LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
          LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
          WHERE to_tsvector('english', rp.title || ' ' || rp.abstract) @@ plainto_tsquery('english', $1)
             OR LOWER(rp.title) LIKE LOWER('%' || $1 || '%')
          GROUP BY rp.paper_id, rp.title, rp.abstract, rp.doi, rp.publication_date, rp.citation_count, rp.source
          ORDER BY rp.citation_count DESC
          LIMIT 4;
        `;
        const hRes = await query(histSql, [topQuery]);
        historyRecommendations = hRes.rows;
      }
    }

    // 3. Fallback: Popular Trending Papers from popular_papers_view
    const popularRes = await query(`
      SELECT 
        ppv.paper_id, 
        ppv.title, 
        ppv.doi, 
        ppv.source, 
        ppv.citation_count, 
        ppv.total_bookmarks, 
        ppv.popularity_score,
        ppv.popularity_rank,
        pdv.authors,
        pdv.research_areas,
        pdv.abstract
      FROM popular_papers_view ppv
      JOIN paper_details_view pdv ON ppv.paper_id = pdv.paper_id
      ORDER BY ppv.popularity_rank ASC
      LIMIT $1;
    `, [limit]);

    return NextResponse.json({
      type: 'PERSONALIZED_RECOMMENDATIONS',
      basedOnBookmarks: bookmarkRecommendations,
      basedOnSearchHistory: historyRecommendations,
      trendingPapers: popularRes.rows,
    });
  } catch (err: any) {
    console.error('[API Recommendations Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

