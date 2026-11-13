import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { generateEmbedding, formatVectorForPg } from '@/semantic/embedding_service/embedder';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-handler';

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json();
    const q = body.query || body.q || '';
    const limit = Math.max(1, Math.min(50, parseInt(body.topK || body.limit || '10', 10)));

    if (!q.trim()) {
      return NextResponse.json({ results: [], query: '', total: 0 });
    }

    const cleanQuery = q.trim();
    const user = getCurrentUser(req);

    // 1. Generate dense vector using all-MiniLM-L6-v2 embedding model
    const vector = await generateEmbedding(cleanQuery);
    const vectorStr = formatVectorForPg(vector);

    // 2. Query pgvector using cosine distance (<=>)
    // Note: similarity = 1 - cosine_distance
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
        ROUND((1 - (pe.embedding <=> $1))::numeric, 4) AS similarity_score
      FROM PAPER_EMBEDDINGS pe
      JOIN RESEARCH_PAPER rp ON pe.paper_id = rp.paper_id
      LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
      LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
      LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
      LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
      GROUP BY rp.paper_id, rp.title, rp.abstract, rp.doi, rp.publication_date, rp.citation_count, rp.source, pe.embedding
      ORDER BY pe.embedding <=> $1 ASC
      LIMIT $2;
    `;

    const res = await query(sql, [vectorStr, limit]);

    // 3. Log search query in SEARCH_HISTORY
    if (user) {
      await query(
        `INSERT INTO SEARCH_HISTORY (user_id, search_query, search_type, search_date)
         VALUES ($1, $2, 'SEMANTIC', CURRENT_TIMESTAMP);`,
        [user.user_id, cleanQuery]
      );
    }

    return NextResponse.json({
      query: cleanQuery,
      searchType: 'SEMANTIC',
      model: 'all-MiniLM-L6-v2',
      dimension: 384,
      metric: 'Cosine Similarity (1 - cosine_distance)',
      total: res.rows.length,
      results: res.rows,
    });
  } catch (err: any) {
    console.error('[API Semantic Search Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

async function handleGet(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const topK = searchParams.get('topK') || '10';

  return handlePost(new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ query: q, topK }),
    headers: req.headers,
  }));
}

export const POST = withApiLogging(handlePost, 'Semantic Search (pgvector 384-D Cosine)');
export const GET = withApiLogging(handleGet, 'Semantic Search (pgvector 384-D Cosine)');

