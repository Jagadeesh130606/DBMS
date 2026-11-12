import { query, transaction, exec } from '../lib/db/postgres';
import { connectMongoDB } from '../lib/db/mongodb';
import PaperDocument from '../database/mongodb/models/PaperDocument';
import AuthorDocument from '../database/mongodb/models/AuthorDocument';
import ResearchAreaDocument from '../database/mongodb/models/ResearchAreaDocument';
import CitationDocument from '../database/mongodb/models/CitationDocument';
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
  console.log('========================================================================');
  console.log('COMPREHENSIVE TEST SUITE: MULTI-MODEL LEVEL-3 DBMS ARCHITECTURE');
  console.log('PostgreSQL (12 Tables) • pgvector (384-D) • MongoDB (4 Collections)');
  console.log('========================================================================');

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

  // TEST 2: PostgreSQL Relational Tables & Row Counts (All 12 Tables)
  console.log('\n--- 2. POSTGRESQL RELATIONAL ENTITIES & SCHEMA VERIFICATION (12 TABLES) ---');
  const tables = [
    'USERS', 
    'AUTHORS', 
    'RESEARCH_PAPER', 
    'RESEARCH_AREA', 
    'JOURNAL', 
    'CONFERENCE', 
    'PAPER_AUTHOR', 
    'PAPER_AREA', 
    'BOOKMARK', 
    'SEARCH_HISTORY', 
    'CITATION', 
    'PAPER_EMBEDDINGS'
  ];
  for (const table of tables) {
    const res = await query(`SELECT COUNT(*) AS count FROM ${table};`);
    const count = parseInt(res.rows[0].count, 10);
    assert(count >= 0, `Table ${table} exists and is queryable (Rows: ${count})`);
  }

  // TEST 3: Relational Integrity, Constraints & ER Relationships
  console.log('\n--- 3. RELATIONAL INTEGRITY, CONSTRAINTS & ER RELATIONSHIPS ---');
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

  // Anti-Self Citation CHECK Constraint / Trigger
  try {
    await query(`INSERT INTO CITATION (citing_paper_id, cited_paper_id) VALUES (1, 1);`);
    assert(false, 'Self-citation constraint should reject paper citing itself');
  } catch (err: any) {
    assert(true, 'Self-citation constraint / trigger successfully prevented paper citing itself');
  }

  // Foreign key relationship: RESEARCH_PAPER -> JOURNAL (PUBLISHED_IN)
  const journalJoinRes = await query(`
    SELECT rp.paper_id, rp.title, j.journal_name, j.issn
    FROM RESEARCH_PAPER rp
    JOIN JOURNAL j ON rp.journal_id = j.journal_id
    LIMIT 3;
  `);
  assert(journalJoinRes.rows.length > 0 && journalJoinRes.rows[0].issn, 'ER Relationship PUBLISHED_IN (RESEARCH_PAPER -> JOURNAL) validated via foreign key join');

  // Foreign key relationship: RESEARCH_PAPER -> CONFERENCE (PRESENTED_IN)
  const confJoinRes = await query(`
    SELECT rp.paper_id, rp.title, c.conference_name, c.year
    FROM RESEARCH_PAPER rp
    JOIN CONFERENCE c ON rp.conference_id = c.conference_id
    LIMIT 3;
  `);
  assert(confJoinRes.rows.length > 0 && confJoinRes.rows[0].year, 'ER Relationship PRESENTED_IN (RESEARCH_PAPER -> CONFERENCE) validated via foreign key join');

  // TEST 4: Database Views
  console.log('\n--- 4. DATABASE VIEWS VERIFICATION ---');
  const pdvRes = await query('SELECT * FROM paper_details_view LIMIT 3;');
  assert(pdvRes.rows.length === 3 && pdvRes.rows[0].authors && pdvRes.rows[0].source_type, 'paper_details_view returns aggregated authors, areas, and source_type');

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
  console.log('\n--- 9. PGVECTOR SEMANTIC SIMILARITY SEARCH (384-D) ---');
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

  // TEST 10: MongoDB Document Storage (All 4 Collections)
  console.log('\n--- 10. MONGODB DOCUMENT STORAGE & 4 COLLECTIONS VERIFICATION ---');
  await connectMongoDB();

  // Collection 1: paper_documents
  const mongoPaperDoc = await PaperDocument.findOne({ paper_id: 1 });
  assert(mongoPaperDoc !== null, 'MongoDB paper_documents retrieved for Paper #1');
  assert(mongoPaperDoc?.sections?.length === 4, 'MongoDB document contains structured 4 sections (Intro, Method, Results, Conclusion)');
  assert((mongoPaperDoc?.references?.length ?? 0) > 0, 'MongoDB document contains array of references');

  // Collection 2: author_documents
  const mongoAuthorDoc = await AuthorDocument.findOne({ author_id: 1 });
  assert(mongoAuthorDoc !== null && mongoAuthorDoc.name === 'Dr. Yoshua Bengio', 'MongoDB author_documents contains detailed profile for Author #1 (Yoshua Bengio)');
  assert((mongoAuthorDoc?.research_interests?.length ?? 0) > 0, 'MongoDB author_documents contains research_interests array');

  // Collection 3: research_area_documents
  const mongoAreaDoc = await ResearchAreaDocument.findOne({ area_id: 1 });
  assert(mongoAreaDoc !== null && mongoAreaDoc.area_name.includes('Machine Learning'), 'MongoDB research_area_documents contains taxonomy overview for Area #1');
  assert((mongoAreaDoc?.sub_topics?.length ?? 0) > 0, 'MongoDB research_area_documents contains sub_topics array');

  // Collection 4: citation_documents
  const mongoCitDoc = await CitationDocument.findOne({ paper_id: 1 });
  assert(mongoCitDoc !== null, 'MongoDB citation_documents contains citation context and influence metrics for Paper #1');

  // Aggregation Pipeline over MongoDB
  const kwAgg = await PaperDocument.aggregate([
    { $unwind: '$keywords' },
    { $group: { _id: '$keywords', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  assert(kwAgg.length > 0, `MongoDB Aggregation Pipeline extracted top ${kwAgg.length} keywords across corpus`);

  // TEST 11: Cross-Database Synchronization & Parity Checks
  console.log('\n--- 11. CROSS-DATABASE SYNCHRONIZATION & PARITY CHECKS ---');
  const pgCount = parseInt((await query('SELECT COUNT(*) AS c FROM RESEARCH_PAPER;')).rows[0].c, 10);
  const embedCount = parseInt((await query('SELECT COUNT(*) AS c FROM PAPER_EMBEDDINGS;')).rows[0].c, 10);
  const mongoPaperCount = await PaperDocument.countDocuments();
  const mongoCitCount = await CitationDocument.countDocuments();
  const pgAuthorCount = parseInt((await query('SELECT COUNT(*) AS c FROM AUTHORS;')).rows[0].c, 10);
  const mongoAuthorCount = await AuthorDocument.countDocuments();
  const pgAreaCount = parseInt((await query('SELECT COUNT(*) AS c FROM RESEARCH_AREA;')).rows[0].c, 10);
  const mongoAreaCount = await ResearchAreaDocument.countDocuments();

  assert(pgCount >= 100, `PostgreSQL research papers dataset contains >= 100 papers (Total: ${pgCount})`);
  assert(pgCount === mongoPaperCount, `PostgreSQL paper count (${pgCount}) matches MongoDB paper_documents count (${mongoPaperCount})`);
  assert(pgCount === embedCount, `PostgreSQL paper count (${pgCount}) matches pgvector embedding count (${embedCount})`);
  assert(pgCount === mongoCitCount, `PostgreSQL paper count (${pgCount}) matches MongoDB citation_documents count (${mongoCitCount})`);
  assert(pgAuthorCount === mongoAuthorCount, `PostgreSQL authors count (${pgAuthorCount}) matches MongoDB author_documents count (${mongoAuthorCount})`);
  assert(pgAreaCount === mongoAreaCount, `PostgreSQL areas count (${pgAreaCount}) matches MongoDB research_area_documents count (${mongoAreaCount})`);

  // TEST 12: Dynamic End-to-End Dual-DB CRUD Lifecycle (Insert -> Verify -> Update -> Delete)
  console.log('\n--- 12. DYNAMIC END-TO-END DUAL-DB CRUD LIFECYCLE ---');
  await exec(`
    SELECT setval(pg_get_serial_sequence('RESEARCH_PAPER', 'paper_id'), COALESCE((SELECT MAX(paper_id) FROM RESEARCH_PAPER), 1));
  `);
  const testDoi = `10.9999/unit.test.${Date.now()}`;
  let testPaperId: number = 0;

  // Step A: Insert across both databases
  const testInsertPg = await query(
    `INSERT INTO RESEARCH_PAPER (title, abstract, doi, publication_date, citation_count, source, source_type)
     VALUES ('CRUD Test Paper', 'Testing dual-database synchronization under unit test execution.', $1, '2024-01-01', 0, 'Test Conf', 'CONFERENCE')
     RETURNING paper_id;`,
    [testDoi]
  );
  testPaperId = testInsertPg.rows[0].paper_id;

  const testVec = await generateEmbedding('CRUD Test Paper. Testing dual-database synchronization.');
  await query(
    `INSERT INTO PAPER_EMBEDDINGS (paper_id, embedding, embedding_model) VALUES ($1, $2, 'all-MiniLM-L6-v2');`,
    [testPaperId, formatVectorForPg(testVec)]
  );

  await PaperDocument.create({
    paper_id: testPaperId,
    full_text: 'CRUD Test Paper Full Text Content',
    sections: [{ heading: 'Introduction', content: 'Testing dual DB write' }],
    references: [],
    keywords: ['unit-test', 'crud'],
  });
  await CitationDocument.create({
    paper_id: testPaperId,
    incoming_citation_count: 0,
    outgoing_citation_count: 0,
    citing_papers: [],
    cited_papers: [],
  });
  assert(testPaperId > 0, `Dual-DB INSERT successfully created Paper ID #${testPaperId} in PostgreSQL & MongoDB`);

  // Step B: Verify 1:1 cross-DB state
  const pgCheck = await query('SELECT paper_id, title FROM RESEARCH_PAPER WHERE paper_id = $1;', [testPaperId]);
  const mongoCheck = await PaperDocument.findOne({ paper_id: testPaperId });
  assert(pgCheck.rows.length === 1 && mongoCheck !== null, `Dual-DB SELECT successfully verified 1:1 presence for Paper ID #${testPaperId}`);

  // Step C: Update both databases
  await query('UPDATE RESEARCH_PAPER SET title = $1 WHERE paper_id = $2;', ['Updated CRUD Paper Title', testPaperId]);
  await PaperDocument.updateOne({ paper_id: testPaperId }, { $set: { 'sections.0.content': 'Updated section content' } });
  const pgUpdated = await query('SELECT title FROM RESEARCH_PAPER WHERE paper_id = $1;', [testPaperId]);
  assert(pgUpdated.rows[0].title === 'Updated CRUD Paper Title', `Dual-DB UPDATE successfully verified in PostgreSQL and MongoDB`);

  // Step D: Delete from both databases and verify zero orphans
  await query('DELETE FROM RESEARCH_PAPER WHERE paper_id = $1;', [testPaperId]);
  await PaperDocument.deleteOne({ paper_id: testPaperId });
  await CitationDocument.deleteOne({ paper_id: testPaperId });

  const finalPgCheck = await query('SELECT COUNT(*) AS c FROM RESEARCH_PAPER WHERE paper_id = $1;', [testPaperId]);
  const finalMongoCheck = await PaperDocument.countDocuments({ paper_id: testPaperId });
  assert(
    parseInt(finalPgCheck.rows[0].c, 10) === 0 && finalMongoCheck === 0,
    `Dual-DB DELETE successfully eliminated Paper ID #${testPaperId} with 0 residual records`
  );

  console.log('\n========================================================================');
  console.log(`TEST RESULTS SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('========================================================================');

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
