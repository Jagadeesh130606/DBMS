import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { generateEmbedding, formatVectorForPg } from '@/semantic/embedding_service/embedder';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const q = body.query || body.q || '';
    const limit = Math.max(1, Math.min(50, parseInt(body.topK || body.limit || '10', 10)));

    if (!q.trim()) {
      return NextResponse.json({ results: [], query: '', total: 0 });
    }

    const cleanQuery = q.trim();
    const user = getCurrentUser(req);
    const RRF_K = 60; // Standard Reciprocal Rank Fusion damping constant

    // 1. Run Keyword FTS Query
    const keywordSql = `
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
        ts_rank(
          to_tsvector('english', rp.title || ' ' || rp.abstract), 
          plainto_tsquery('english', $1)
        ) AS rank_score
      FROM RESEARCH_PAPER rp
      LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
      LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
      LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
      LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
      WHERE 
        to_tsvector('english', rp.title || ' ' || rp.abstract) @@ plainto_tsquery('english', $1)
        OR LOWER(rp.title) LIKE LOWER('%' || $1 || '%')
      GROUP BY rp.paper_id, rp.title, rp.abstract, rp.doi, rp.publication_date, rp.citation_count, rp.source
      ORDER BY rank_score DESC, rp.citation_count DESC
      LIMIT 25;
    `;
    const keywordRes = await query(keywordSql, [cleanQuery]);

    // 2. Run Semantic Vector Query
    const vector = await generateEmbedding(cleanQuery);
    const vectorStr = formatVectorForPg(vector);

    const semanticSql = `
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
        ROUND((1 - (pe.embedding <=> $1))::numeric, 4) AS similarity_score
      FROM PAPER_EMBEDDINGS pe
      JOIN RESEARCH_PAPER rp ON pe.paper_id = rp.paper_id
      LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
      LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
      LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
      LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
      GROUP BY rp.paper_id, rp.title, rp.abstract, rp.doi, rp.publication_date, rp.citation_count, rp.source, pe.embedding
      ORDER BY pe.embedding <=> $1 ASC
      LIMIT 25;
    `;
    const semanticRes = await query(semanticSql, [vectorStr]);

    // 3. Apply Reciprocal Rank Fusion (RRF)
    const papersMap = new Map<number, any>();

    keywordRes.rows.forEach((row, idx) => {
      const rank = idx + 1;
      const rrfScore = 1 / (RRF_K + rank);
      papersMap.set(row.paper_id, {
        ...row,
        keywordRank: rank,
        semanticRank: null,
        similarity_score: null,
        rrfScore,
        matchType: 'KEYWORD_ONLY',
      });
    });

    semanticRes.rows.forEach((row, idx) => {
      const rank = idx + 1;
      const additionalRrf = 1 / (RRF_K + rank);

      if (papersMap.has(row.paper_id)) {
        const existing = papersMap.get(row.paper_id);
        existing.semanticRank = rank;
        existing.similarity_score = row.similarity_score;
        existing.rrfScore += additionalRrf;
        existing.matchType = 'HYBRID_MATCH'; // Matched both keyword and semantic!
      } else {
        papersMap.set(row.paper_id, {
          ...row,
          keywordRank: null,
          semanticRank: rank,
          similarity_score: row.similarity_score,
          rrfScore: additionalRrf,
          matchType: 'SEMANTIC_ONLY',
        });
      }
    });

    // Sort by merged RRF score descending
    const combinedResults = Array.from(papersMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        hybridRank: index + 1,
        rrfScore: Number(item.rrfScore.toFixed(6)),
      }));

    // 4. Log search in SEARCH_HISTORY
    if (user) {
      await query(
        `INSERT INTO SEARCH_HISTORY (user_id, search_query, search_type, search_date)
         VALUES ($1, $2, 'HYBRID', CURRENT_TIMESTAMP);`,
        [user.user_id, cleanQuery]
      );
    }

    return NextResponse.json({
      query: cleanQuery,
      searchType: 'HYBRID',
      fusionAlgorithm: 'Reciprocal Rank Fusion (RRF, k=60)',
      keywordMatchesCount: keywordRes.rows.length,
      semanticMatchesCount: semanticRes.rows.length,
      total: combinedResults.length,
      results: combinedResults,
    });
  } catch (err: any) {
    console.error('[API Hybrid Search Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const topK = searchParams.get('topK') || '10';

  return POST(new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ query: q, topK }),
    headers: req.headers,
  }));
}

