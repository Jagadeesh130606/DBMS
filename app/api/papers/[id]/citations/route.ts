import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { withApiLogging } from '@/lib/api-handler';

async function handleGet(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paperId = parseInt(params.id, 10);
    if (isNaN(paperId)) {
      return NextResponse.json({ error: 'Invalid paper ID' }, { status: 400 });
    }

    // 1. Direct Cited Papers (Papers this paper cites as references)
    const citedPapers = await query(
      `SELECT 
        rp.paper_id,
        rp.title,
        rp.doi,
        rp.publication_date,
        rp.citation_count,
        rp.source,
        COALESCE(string_agg(DISTINCT a.name, ', ' ORDER BY a.name), 'Unknown Author') AS authors
      FROM CITATION c
      JOIN RESEARCH_PAPER rp ON c.cited_paper_id = rp.paper_id
      LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
      LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
      WHERE c.citing_paper_id = $1
      GROUP BY rp.paper_id, rp.title, rp.doi, rp.publication_date, rp.citation_count, rp.source
      ORDER BY rp.citation_count DESC;`,
      [paperId]
    );

    // 2. Direct Citing Papers (Papers citing this paper)
    const citingPapers = await query(
      `SELECT 
        rp.paper_id,
        rp.title,
        rp.doi,
        rp.publication_date,
        rp.citation_count,
        rp.source,
        COALESCE(string_agg(DISTINCT a.name, ', ' ORDER BY a.name), 'Unknown Author') AS authors
      FROM CITATION c
      JOIN RESEARCH_PAPER rp ON c.citing_paper_id = rp.paper_id
      LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
      LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
      WHERE c.cited_paper_id = $1
      GROUP BY rp.paper_id, rp.title, rp.doi, rp.publication_date, rp.citation_count, rp.source
      ORDER BY rp.citation_count DESC;`,
      [paperId]
    );

    // 3. Stored Function: Citation Statistics
    const statsRes = await query(
      'SELECT * FROM get_citation_stats($1);',
      [paperId]
    );

    // 4. Recursive CTE: Multi-Level Citation Network (Depth 1 to 3)
    const recursiveNetwork = await query(
      `WITH RECURSIVE citation_network AS (
        -- Anchor member: direct citations
        SELECT 
          c.citing_paper_id,
          c.cited_paper_id,
          1 AS depth,
          ARRAY[c.citing_paper_id, c.cited_paper_id] AS path
        FROM CITATION c
        WHERE c.cited_paper_id = $1

        UNION ALL

        -- Recursive member: citations of citing papers
        SELECT 
          c2.citing_paper_id,
          c2.cited_paper_id,
          cn.depth + 1,
          cn.path || c2.citing_paper_id
        FROM CITATION c2
        JOIN citation_network cn ON c2.cited_paper_id = cn.citing_paper_id
        WHERE cn.depth < 3 AND NOT (c2.citing_paper_id = ANY(cn.path))
      )
      SELECT 
        cn.citing_paper_id,
        rp1.title AS citing_title,
        cn.cited_paper_id,
        rp2.title AS cited_title,
        cn.depth
      FROM citation_network cn
      JOIN RESEARCH_PAPER rp1 ON cn.citing_paper_id = rp1.paper_id
      JOIN RESEARCH_PAPER rp2 ON cn.cited_paper_id = rp2.paper_id
      ORDER BY cn.depth ASC, cn.citing_paper_id ASC
      LIMIT 25;`,
      [paperId]
    );

    return NextResponse.json({
      paperId,
      stats: statsRes.rows[0] || {
        total_references_cited: citedPapers.rows.length,
        total_citations_received: citingPapers.rows.length,
        second_degree_citations: 0,
      },
      citedPapers: citedPapers.rows,
      citingPapers: citingPapers.rows,
      recursiveNetwork: recursiveNetwork.rows,
    });
  } catch (err: any) {
    console.error('[API Paper Citations Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiLogging(handleGet, 'Explore Citation Graph (Recursive CTE)');

