import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

export async function GET(req: NextRequest) {
  try {
    const res = await query(`
      SELECT 
        ra.area_id,
        ra.area_name,
        ra.description,
        COUNT(par.paper_id) AS paper_count,
        COALESCE(SUM(rp.citation_count), 0) AS total_citations
      FROM RESEARCH_AREA ra
      LEFT JOIN PAPER_AREA par ON ra.area_id = par.area_id
      LEFT JOIN RESEARCH_PAPER rp ON par.paper_id = rp.paper_id
      GROUP BY ra.area_id, ra.area_name, ra.description
      ORDER BY paper_count DESC, ra.area_name ASC;
    `);

    return NextResponse.json({
      total: res.rows.length,
      areas: res.rows,
    });
  } catch (err: any) {
    console.error('[API Areas GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

