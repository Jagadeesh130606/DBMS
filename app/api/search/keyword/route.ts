import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-handler';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)));

    if (!q.trim()) {
      return NextResponse.json({ results: [], query: '', total: 0 });
    }

    const cleanQuery = q.trim();
    const user = getCurrentUser(req);

    // 1. PostgreSQL Full-Text Search using plainto_tsquery and ts_rank
    // Matches against GIN indexed tsvector of title and abstract
    const sql = `
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
      LIMIT $2;
    `;

    const res = await query(sql, [cleanQuery, limit]);

    // 2. Log search query in SEARCH_HISTORY
    if (user) {
      await query(
        `INSERT INTO SEARCH_HISTORY (user_id, search_query, search_type, search_date)
         VALUES ($1, $2, 'KEYWORD', CURRENT_TIMESTAMP);`,
        [user.user_id, cleanQuery]
      );
    }

    return NextResponse.json({
      query: cleanQuery,
      searchType: 'KEYWORD',
      total: res.rows.length,
      results: res.rows,
    });
  } catch (err: any) {
    console.error('[API Keyword Search Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiLogging(handleGet, 'Keyword Search (PostgreSQL FTS GIN)');

