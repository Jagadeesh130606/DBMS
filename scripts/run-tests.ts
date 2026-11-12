import { query, transaction, exec } from '../lib/db/postgres';
import { connectMongoDB } from '../lib/db/mongodb';
import PaperDocument from '../database/mongodb/models/PaperDocument';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../lib/auth';
import { generateEmbedding, formatVectorForPg, cosineSimilarity } from '../semantic/embedding_service/embedder';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('COMPREHENSIVE TEST SUITE: LEVEL-3 DBMS & SEMANTIC SEARCH ENGINE');
  console.log('===============================================================');

  // TEST 1: Authentication & Hashing
  console.log('\n--- 1. AUTHENTICATION & CRYPTOGRAPHIC TESTS ---');
  const password = 'TestSecurePassword!2026';
  const hashed = hashPassword(password);
  assert(hashed !== password, 'Password hashing transforms plaintext');
  assert(comparePassword(password, hashed), 'Password comparison with correct hash succeeds');
  assert(!comparePassword('WrongPassword', hashed), 'Password comparison with incorrect password fails');

  const testUser = { user_id: 999, name: 'Test User', email: 'test@unit.edu', role: 'STUDENT' as const };
  const token = generateToken(testUser);
  const decoded = verifyToken(token);
  assert(decoded?.email === 'test@unit.edu', 'JWT Token generation and verification matches payload');

  // TEST 2: PostgreSQL Relational Tables & Row Counts
  console.log('\n--- 2. POSTGRESQL RELATIONAL ENTITIES & SCHEMA VERIFICATION ---');
  const tables = ['USERS', 'AUTHORS', 'RESEARCH_PAPER', 'RESEARCH_AREA', 'PAPER_AUTHOR', 'PAPER_AREA', 'BOOKMARK', 'SEARCH_HISTORY', 'CITATION', 'PAPER_EMBEDDINGS'];
  for (const table of tables) {
    const res = await query(`SELECT COUNT(*) AS count FROM ${table};`);
    const count = parseInt(res.rows[0].count, 10);
    assert(count >= 0, `Table ${table} exists and is queryable (Rows: ${count})`);
  }

  // TEST 3: Foreign Key Constraints & Cascading Behavior
  console.log('\n--- 3. RELATIONAL INTEGRITY & CONSTRAINTS ---');
  // Unique DOI constraint
  try {
    await query(
      `INSERT INTO RESEARCH_PAPER (title, abstract, doi, publication_date, source)
       VALUES ('Dup DOI Test', 'Abstract', '10.1145/transformer.2017.001', '2024-01-01', 'Source');`
    );
    assert(false, 'Unique DOI constraint should reject duplicate DOI');
  } catch (err: any) {
    assert(true, 'Unique DOI constraint successfully rejected duplicate DOI');
  }

  // Self citation check constraint: citing_paper_id <> cited_paper_id
  try {
    await query(
      `INSERT INTO CITATION (citing_paper_id, cited_paper_id)
       VALUES (1, 1);`
    );
    assert(false, 'Self-citation constraint should reject paper citing itself');
  } catch (err: any) {
    assert(true, 'Self-citation constraint / trigger successfully prevented paper citing itself');
  }

  // TEST 4: Database Views
  console.log('\n--- 4. DATABASE VIEWS VERIFICATION ---');
  const pdvRes = await query('SELECT * FROM paper_details_view LIMIT 3;');
  assert(pdvRes.rows.length === 3 && pdvRes.rows[0].authors, 'paper_details_view returns aggregated authors and areas');

  const ppvRes = await query('SELECT * FROM popular_papers_view LIMIT 3;');
  assert(ppvRes.rows.length === 3 && ppvRes.rows[0].popularity_score !== undefined, 'popular_papers_view computes popularity rank');

  const apvRes = await query('SELECT * FROM author_publication_view LIMIT 3;');
  assert(apvRes.rows.length === 3 && apvRes.rows[0].total_publications !== undefined, 'author_publication_view computes author statistics');

  const ubvRes = await query('SELECT * FROM user_bookmark_view LIMIT 3;');
  assert(ubvRes.rows !== undefined, 'user_bookmark_view successfully queryable');

  // TEST 5: Transactions & ACID Rollback
  console.log('\n--- 5. TRANSACTIONS & ACID ISOLATION ---');
  const beforeCountRes = await query('SELECT COUNT(*) AS count FROM RESEARCH_PAPER;');
  const countBefore = parseInt(beforeCountRes.rows[0].count, 10);

  try {
    await transaction(async (client) => {
      await client.query(
        `INSERT INTO RESEARCH_PAPER (title, abstract, doi, publication_date, source)
         VALUES ('Tx Rollback Test', 'Abstract text', '10.test.rollback.001', '2024-01-01', 'Test Conf');`
      );
      // Intentionally force error to trigger ROLLBACK
      throw new Error('Simulated transaction failure to test ROLLBACK');
    });
  } catch (err: any) {
    // Expected error
  }

  const afterCountRes = await query('SELECT COUNT(*) AS count FROM RESEARCH_PAPER;');
  const countAfter = parseInt(afterCountRes.rows[0].count, 10);
  assert(countBefore === countAfter, 'Transaction ROLLBACK successfully restored state on error (Atomicity verified)');

  // TEST 6: Stored Functions & Triggers
  console.log('\n--- 6. STORED PROCEDURES, FUNCTIONS & TRIGGERS ---');
  const fnAreaRes = await query("SELECT * FROM get_papers_by_area('Machine Learning & Deep Learning');");
  assert(fnAreaRes.rows.length > 0, 'Stored function get_papers_by_area returned categorized papers');

  const fnPopularRes = await query('SELECT * FROM calculate_popular_papers(5);');
  assert(fnPopularRes.rows.length === 5, 'Stored function calculate_popular_papers returned top 5 papers');

  const fnCitationStats = await query('SELECT * FROM get_citation_stats(1);');
  assert(fnCitationStats.rows.length === 1 && fnCitationStats.rows[0].total_citations_received !== undefined, 'Stored function get_citation_stats returned citation metrics');

  // TEST 7: Recursive Common Table Expression (CTE)
  console.log('\n--- 7. RECURSIVE COMMON TABLE EXPRESSION (CTE) ---');
  const recursiveCteRes = await query(`
    WITH RECURSIVE CitationGraph AS (
      SELECT citing_paper_id, cited_paper_id, 1 AS depth
      FROM CITATION WHERE cited_paper_id = 1
      UNION ALL
      SELECT c.citing_paper_id, c.cited_paper_id, cg.depth + 1
      FROM CITATION c
      JOIN CitationGraph cg ON c.cited_paper_id = cg.citing_paper_id
      WHERE cg.depth < 3
    )
    SELECT COUNT(*) AS total_transitive_citations FROM CitationGraph;
  `);
  const transitiveCount = parseInt(recursiveCteRes.rows[0].total_transitive_citations, 10);
  assert(transitiveCount > 0, `Recursive CTE executed successfully across citation graph (Transitive paths: ${transitiveCount})`);

  // TEST 8: Full-Text Search (tsvector, tsquery, GIN)
  console.log('\n--- 8. POSTGRESQL FULL-TEXT SEARCH (GIN Index & ts_rank) ---');
  const ftsRes = await query(`
    SELECT paper_id, title, ts_rank(to_tsvector('english', title || ' ' || abstract), plainto_tsquery('english', 'transformer sequence modeling')) AS rank
    FROM RESEARCH_PAPER
    WHERE to_tsvector('english', title || ' ' || abstract) @@ plainto_tsquery('english', 'transformer sequence modeling')
    ORDER BY rank DESC;
  `);
  assert(ftsRes.rows.length > 0, `FTS successfully found and ranked ${ftsRes.rows.length} papers matching 'transformer sequence modeling'`);

  // TEST 9: pgvector Cosine Similarity Search
  console.log('\n--- 9. PGVECTOR SEMANTIC SIMILARITY SEARCH ---');
  const queryText = 'How can machine learning detect network intrusion attacks?';
  const queryVec = await generateEmbedding(queryText);
  const queryVecStr = formatVectorForPg(queryVec);

  const vecRes = await query(`
    SELECT rp.paper_id, rp.title, 1 - (pe.embedding <=> $1) AS similarity_score
    FROM PAPER_EMBEDDINGS pe
    JOIN RESEARCH_PAPER rp ON pe.paper_id = rp.paper_id
    ORDER BY pe.embedding <=> $1 ASC
    LIMIT 3;
  `, [queryVecStr]);

  assert(vecRes.rows.length === 3, 'pgvector cosine similarity query executed successfully');
  assert(vecRes.rows[0].similarity_score > 0, `Top semantic match "${vecRes.rows[0].title.substring(0, 35)}..." has valid similarity score: ${Number(vecRes.rows[0].similarity_score).toFixed(4)}`);

  // TEST 10: MongoDB Document Storage & Aggregation
  console.log('\n--- 10. MONGODB DOCUMENT STORAGE & AGGREGATION PIPELINES ---');
  await connectMongoDB();
  const mongoPaperDoc = await PaperDocument.findOne({ paper_id: 1 });
  assert(mongoPaperDoc !== null, 'MongoDB document retrieved for Paper #1');
  assert(mongoPaperDoc?.sections?.length === 4, 'MongoDB document contains structured 4 sections (Intro, Method, Results, Conclusion)');
  assert((mongoPaperDoc?.references?.length ?? 0) > 0, 'MongoDB document contains array of references');

  // Aggregation Pipeline: Keywords grouping
  const kwAgg = await PaperDocument.aggregate([
    { $unwind: '$keywords' },
    { $group: { _id: '$keywords', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  assert(kwAgg.length > 0, `MongoDB Aggregation Pipeline extracted top ${kwAgg.length} keywords across corpus`);

  // TEST 11: Cross-Database Consistency
  console.log('\n--- 11. CROSS-DATABASE SYNCHRONIZATION ---');
  const pgCount = parseInt((await query('SELECT COUNT(*) AS c FROM RESEARCH_PAPER;')).rows[0].c, 10);
  const embedCount = parseInt((await query('SELECT COUNT(*) AS c FROM PAPER_EMBEDDINGS;')).rows[0].c, 10);
  const mongoCount = await PaperDocument.countDocuments();

  assert(pgCount === mongoCount, `PostgreSQL paper count (${pgCount}) matches MongoDB document count (${mongoCount})`);
  assert(pgCount === embedCount, `PostgreSQL paper count (${pgCount}) matches pgvector embedding count (${embedCount})`);

  console.log('\n===============================================================');
  console.log(`TEST RESULTS SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===============================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('[Fatal Test Error]:', err);
  process.exit(1);
});
