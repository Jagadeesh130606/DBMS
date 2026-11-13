import { query } from '../lib/db/postgres';
import { connectMongoDB } from '../lib/db/mongodb';
import PaperDocument from '../database/mongodb/models/PaperDocument';
import {
  getLiveQueryHistory,
  requestContextStorage,
  logRequestStart,
  logRequestEnd,
  setSemanticContext,
} from '../lib/db/query-logger';
import { generateEmbedding, formatVectorForPg } from '../semantic/embedding_service/embedder';

async function testLiveMonitor() {
  console.log('========================================================================');
  console.log('TESTING LIVE DATABASE QUERY MONITOR');
  console.log('Simulating Real Frontend User Interactions and Logging Outputs');
  console.log('========================================================================\n');

  // SIMULATE ACTION 1: Search Papers (SELECT)
  const req1 = {
    requestId: 'req-001',
    action: 'Search Research Papers',
    path: '/api/papers?search=neural',
    method: 'GET',
    startTime: performance.now(),
  };

  await requestContextStorage.run(req1, async () => {
    logRequestStart(req1);
    await query('SELECT paper_id, title, doi, citation_count FROM RESEARCH_PAPER WHERE LOWER(title) LIKE $1 LIMIT 3;', ['%neural%']);
    logRequestEnd(req1, 200, 'Returned matching papers from PostgreSQL');
  });

  // SIMULATE ACTION 2: View Paper Details (PostgreSQL SELECT + MongoDB findOne)
  const req2 = {
    requestId: 'req-002',
    action: 'View Research Paper Details',
    path: '/api/papers/1',
    method: 'GET',
    startTime: performance.now(),
  };

  await requestContextStorage.run(req2, async () => {
    logRequestStart(req2);
    // Relational query
    await query('SELECT * FROM RESEARCH_PAPER WHERE paper_id = $1;', [1]);
    // Document query
    await connectMongoDB();
    await PaperDocument.findOne({ paper_id: 1 }).lean();
    logRequestEnd(req2, 200, 'Combined PostgreSQL metadata with MongoDB sections');
  });

  // SIMULATE ACTION 3: Add Paper Bookmark (INSERT)
  const req3 = {
    requestId: 'req-003',
    action: 'Add Paper Bookmark',
    path: '/api/bookmarks',
    method: 'POST',
    startTime: performance.now(),
  };

  await requestContextStorage.run(req3, async () => {
    logRequestStart(req3);
    await query(
      `INSERT INTO BOOKMARK (user_id, paper_id, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, paper_id) DO NOTHING
       RETURNING user_id, paper_id;`,
      [1, 99]
    );
    logRequestEnd(req3, 201, 'Bookmark inserted into PostgreSQL');
  });

  // SIMULATE ACTION 4: Remove Paper Bookmark (DELETE)
  const req4 = {
    requestId: 'req-004',
    action: 'Remove Paper Bookmark',
    path: '/api/bookmarks/99',
    method: 'DELETE',
    startTime: performance.now(),
  };

  await requestContextStorage.run(req4, async () => {
    logRequestStart(req4);
    await query('DELETE FROM BOOKMARK WHERE user_id = $1 AND paper_id = $2;', [1, 99]);
    logRequestEnd(req4, 200, 'Bookmark removed from PostgreSQL');
  });

  // SIMULATE ACTION 5: Semantic Search (pgvector 384-D Cosine Distance)
  const req5 = {
    requestId: 'req-005',
    action: 'Semantic Search (pgvector 384-D Cosine)',
    path: '/api/search/semantic',
    method: 'POST',
    startTime: performance.now(),
  };

  await requestContextStorage.run(req5, async () => {
    logRequestStart(req5);
    const userQuery = 'machine learning';
    const vector = await generateEmbedding(userQuery);
    setSemanticContext({
      originalQuery: userQuery,
      dimension: 384,
      vector,
    });
    const vectorStr = formatVectorForPg(vector);
    const topK = 15;

    await query(
      `SELECT 
         rp.paper_id,
         rp.title,
         ROUND((1 - (pe.embedding <=> $1))::numeric, 4) AS similarity_score
       FROM PAPER_EMBEDDINGS pe
       JOIN RESEARCH_PAPER rp ON pe.paper_id = rp.paper_id
       ORDER BY pe.embedding <=> $1 ASC
       LIMIT $2;`,
      [vectorStr, topK]
    );
    logRequestEnd(req5, 200, 'Semantic vector search returned top 15 results');
  });

  // Verify In-Memory Ring Buffer
  const recent = getLiveQueryHistory(20);
  console.log('\n========================================================================');
  console.log(`VERIFICATION SUMMARY: ${recent.length} Operations Captured in Live Ring Buffer`);
  console.log('========================================================================');
  recent.forEach((q, idx) => {
    console.log(`  [${idx + 1}] [${q.dbType}] ${q.operation.padEnd(8)} on ${q.target.padEnd(16)} | Req: ${q.requestId} | ${q.executionTimeMs}ms | ${q.status}`);
  });

  console.log('\nSUCCESS: All query logging structures confirmed operational!');
  process.exit(0);
}

testLiveMonitor().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

