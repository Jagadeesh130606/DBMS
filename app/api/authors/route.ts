import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { withApiLogging } from '@/lib/api-handler';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let sql = `
      SELECT 
        author_id,
        author_name,
        affiliation,
        email,
        total_publications,
        total_citations,
        avg_citations_per_paper,
        primary_research_areas
      FROM author_publication_view
    `;

    const params: any[] = [];
    if (search.trim()) {
      sql += ' WHERE LOWER(author_name) LIKE $1 OR LOWER(affiliation) LIKE $1';
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    sql += ' ORDER BY total_citations DESC, total_publications DESC;';

    const res = await query(sql, params);

    return NextResponse.json({
      total: res.rows.length,
      authors: res.rows,
    });
  } catch (err: any) {
    console.error('[API Authors GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiLogging(handleGet, 'Explore Authors (author_publication_view)');

