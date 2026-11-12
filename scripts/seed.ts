import { query, exec, getActiveEngine } from '../lib/db/postgres';
import { connectMongoDB } from '../lib/db/mongodb';
import PaperDocument from '../database/mongodb/models/PaperDocument';
import AuthorDocument from '../database/mongodb/models/AuthorDocument';
import ResearchAreaDocument from '../database/mongodb/models/ResearchAreaDocument';
import CitationDocument from '../database/mongodb/models/CitationDocument';
import { generateEmbedding, formatVectorForPg } from '../semantic/embedding_service/embedder';
import { runMigration } from './migrate';
import { 
  JOURNALS_SEED, 
  CONFERENCES_SEED, 
  AUTHORS_SEED, 
  RESEARCH_AREAS_SEED 
} from '../database/seeds/expanded_papers_data';
import { 
  ALL_PAPERS_SEED, 
  ALL_CITATIONS_SEED 
} from '../database/seeds/expanded_papers_list';

export async function seedAll() {
  console.log('================================================================');
  console.log('MULTI-MODEL DATABASE SEEDING: 110 PAPERS, 35 AUTHORS, 4 COLLECTIONS');
  console.log('================================================================');

  // Step 1: Ensure PostgreSQL tables and columns exist
  await runMigration();
  const engine = await getActiveEngine();
  console.log(`[PostgreSQL] Engine active: ${engine.toUpperCase()}`);

  // Step 2: Seed USERS (Idempotent)
  console.log('[PostgreSQL] Seeding USERS...');
  const users = [
    { id: 1, name: 'Dr. Alice Vance', email: 'admin@research.edu', role: 'ADMIN' },
    { id: 2, name: 'Robert Sterling', email: 'system.admin@research.edu', role: 'ADMIN' },
    { id: 3, name: 'Prof. David Karger', email: 'chair.dbms@research.edu', role: 'ADMIN' },
    { id: 4, name: 'Emily Chen', email: 'student@research.edu', role: 'STUDENT' },
    { id: 5, name: 'Alex Miller', email: 'alex.miller@research.edu', role: 'STUDENT' },
    { id: 6, name: 'Sarah Jenkins', email: 'sarah.jenkins@research.edu', role: 'STUDENT' },
    { id: 7, name: 'Raj Patel', email: 'raj.patel@research.edu', role: 'STUDENT' },
    { id: 8, name: 'Maria Garcia', email: 'maria.garcia@research.edu', role: 'STUDENT' },
    { id: 9, name: 'Kenji Sato', email: 'kenji.sato@research.edu', role: 'STUDENT' },
    { id: 10, name: 'Elena Rostova', email: 'elena.rostova@research.edu', role: 'STUDENT' },
  ];
  for (const u of users) {
    await query(
      `INSERT INTO USERS (user_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role;`,
      [u.id, u.name, u.email, u.role]
    );
  }

  // Step 3: Seed AUTHORS (Idempotent)
  console.log('[PostgreSQL] Seeding 35 AUTHORS...');
  for (const a of AUTHORS_SEED) {
    await query(
      `INSERT INTO AUTHORS (author_id, name, affiliation, email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (author_id)
       DO UPDATE SET name = EXCLUDED.name, affiliation = EXCLUDED.affiliation, email = EXCLUDED.email;`,
      [a.author_id, a.name, a.affiliation, a.email]
    );
  }

  // Step 4: Seed RESEARCH_AREA (Idempotent)
  console.log('[PostgreSQL] Seeding 9 RESEARCH_AREAS...');
  for (const ra of RESEARCH_AREAS_SEED) {
    await query(
      `INSERT INTO RESEARCH_AREA (area_id, area_name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (area_id)
       DO UPDATE SET area_name = EXCLUDED.area_name, description = EXCLUDED.description;`,
      [ra.area_id, ra.area_name, ra.description]
    );
  }

  // Step 5: Seed JOURNAL (Idempotent)
  console.log('[PostgreSQL] Seeding 12 JOURNALS...');
  for (const j of JOURNALS_SEED) {
    await query(
      `INSERT INTO JOURNAL (journal_id, journal_name, publisher, issn)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (journal_id)
       DO UPDATE SET journal_name = EXCLUDED.journal_name, publisher = EXCLUDED.publisher, issn = EXCLUDED.issn;`,
      [j.journal_id, j.journal_name, j.publisher, j.issn]
    );
  }

  // Step 6: Seed CONFERENCE (Idempotent)
  console.log('[PostgreSQL] Seeding 20 CONFERENCES...');
  for (const c of CONFERENCES_SEED) {
    await query(
      `INSERT INTO CONFERENCE (conference_id, conference_name, location, year)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (conference_id)
       DO UPDATE SET conference_name = EXCLUDED.conference_name, location = EXCLUDED.location, year = EXCLUDED.year;`,
      [c.conference_id, c.conference_name, c.location, c.year]
    );
  }

  // Step 7: Seed RESEARCH_PAPER (Idempotent - 110 Papers)
  console.log('[PostgreSQL] Seeding 110 RESEARCH_PAPERS...');
  for (const p of ALL_PAPERS_SEED) {
    await query(
      `INSERT INTO RESEARCH_PAPER (
        paper_id, title, abstract, doi, publication_date, citation_count, source, source_type, journal_id, conference_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (paper_id)
       DO UPDATE SET 
        title = EXCLUDED.title,
        abstract = EXCLUDED.abstract,
        doi = EXCLUDED.doi,
        publication_date = EXCLUDED.publication_date,
        citation_count = EXCLUDED.citation_count,
        source = EXCLUDED.source,
        source_type = EXCLUDED.source_type,
        journal_id = EXCLUDED.journal_id,
        conference_id = EXCLUDED.conference_id;`,
      [
        p.paper_id,
        p.title,
        p.abstract,
        p.doi,
        p.publication_date,
        p.citation_count,
        p.source,
        p.source_type,
        p.journal_id ?? null,
        p.conference_id ?? null,
      ]
    );

    // M:N PAPER_AUTHOR
    let order = 1;
    for (const authorId of p.author_ids) {
      await query(
        `INSERT INTO PAPER_AUTHOR (paper_id, author_id, author_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (paper_id, author_id)
         DO UPDATE SET author_order = EXCLUDED.author_order;`,
        [p.paper_id, authorId, order++]
      );
    }

    // M:N PAPER_AREA
    for (const areaId of p.area_ids) {
      await query(
        `INSERT INTO PAPER_AREA (paper_id, area_id)
         VALUES ($1, $2)
         ON CONFLICT (paper_id, area_id) DO NOTHING;`,
        [p.paper_id, areaId]
      );
    }
  }

  // Step 8: Seed CITATION graph edges (176 Edges)
  console.log('[PostgreSQL] Seeding 176 directed CITATION edges...');
  for (const cit of ALL_CITATIONS_SEED) {
    if (cit.citing_paper_id !== cit.cited_paper_id) {
      await query(
        `INSERT INTO CITATION (citing_paper_id, cited_paper_id)
         VALUES ($1, $2)
         ON CONFLICT (citing_paper_id, cited_paper_id) DO NOTHING;`,
        [cit.citing_paper_id, cit.cited_paper_id]
      );
    }
  }

  // Step 9: Seed BOOKMARK and SEARCH_HISTORY
  console.log('[PostgreSQL] Synchronizing SERIAL sequences...');
  await exec(`
    SELECT setval(pg_get_serial_sequence('RESEARCH_PAPER', 'paper_id'), COALESCE((SELECT MAX(paper_id) FROM RESEARCH_PAPER), 1));
    SELECT setval(pg_get_serial_sequence('AUTHORS', 'author_id'), COALESCE((SELECT MAX(author_id) FROM AUTHORS), 1));
    SELECT setval(pg_get_serial_sequence('RESEARCH_AREA', 'area_id'), COALESCE((SELECT MAX(area_id) FROM RESEARCH_AREA), 1));
    SELECT setval(pg_get_serial_sequence('JOURNAL', 'journal_id'), COALESCE((SELECT MAX(journal_id) FROM JOURNAL), 1));
    SELECT setval(pg_get_serial_sequence('CONFERENCE', 'conference_id'), COALESCE((SELECT MAX(conference_id) FROM CONFERENCE), 1));
    SELECT setval(pg_get_serial_sequence('USERS', 'user_id'), COALESCE((SELECT MAX(user_id) FROM USERS), 1));
  `);

  console.log('[PostgreSQL] Seeding BOOKMARKS & SEARCH_HISTORY...');
  const bookmarks = [
    [4, 1], [4, 3], [4, 17], [4, 43], [4, 83],
    [5, 2], [5, 16], [5, 22], [5, 74], [5, 77],
    [6, 6], [6, 12], [6, 45], [6, 49], [6, 65],
    [7, 9], [7, 10], [7, 14], [7, 53], [7, 60],
    [8, 33], [8, 34], [8, 36], [8, 40],
    [9, 15], [9, 30], [9, 101], [9, 105],
    [10, 24], [10, 28], [10, 106], [10, 109],
  ];
  for (const [userId, paperId] of bookmarks) {
    await query(
      `INSERT INTO BOOKMARK (user_id, paper_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, paper_id) DO NOTHING;`,
      [userId, paperId]
    );
  }

  const searchHistory = [
    [4, 'transformers in natural language processing', 'KEYWORD'],
    [4, 'how do self-attention mechanisms replace recurrence?', 'SEMANTIC'],
    [4, 'retrieval-augmented generation for question answering', 'HYBRID'],
    [5, 'vision transformers for high-resolution medical segmentation', 'SEMANTIC'],
    [5, 'deep residual networks for computer vision', 'KEYWORD'],
    [6, 'distributed transactions in spanner and multi-version concurrency', 'HYBRID'],
    [6, 'vector indexing with HNSW graphs in relational databases', 'SEMANTIC'],
    [7, 'adversarial evasion attacks on network intrusion detection', 'SEMANTIC'],
    [7, 'differential privacy in stochastic gradient descent', 'KEYWORD'],
    [8, 'zero-knowledge rollups for layer-2 blockchain scalability', 'HYBRID'],
    [8, 'smart contract formal verification using SMT solvers', 'SEMANTIC'],
    [9, 'quantum error correction using distance-5 surface codes', 'SEMANTIC'],
    [10, 'alphafold and deep learning for protein structure prediction', 'HYBRID'],
  ];
  let searchId = 1;
  for (const [userId, q, type] of searchHistory) {
    await query(
      `INSERT INTO SEARCH_HISTORY (search_id, user_id, search_query, search_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (search_id) DO NOTHING;`,
      [searchId++, userId, q, type]
    );
  }

  // Step 10: Generate 384-D Vector Embeddings in PAPER_EMBEDDINGS
  console.log('[PostgreSQL pgvector] Generating & Upserting 110 Dense Vector Embeddings (384-D)...');
  for (const p of ALL_PAPERS_SEED) {
    const textToEmbed = `${p.title}. ${p.abstract}`;
    const embedding = await generateEmbedding(textToEmbed);
    const pgVectorStr = formatVectorForPg(embedding);

    await query(
      `INSERT INTO PAPER_EMBEDDINGS (paper_id, embedding, embedding_model, created_at)
       VALUES ($1, $2, 'all-MiniLM-L6-v2', CURRENT_TIMESTAMP)
       ON CONFLICT (paper_id)
       DO UPDATE SET embedding = EXCLUDED.embedding, created_at = CURRENT_TIMESTAMP;`,
      [p.paper_id, pgVectorStr]
    );
  }

  // Step 11: Connect to MongoDB and Populate All 4 Collections
  console.log('[MongoDB] Connecting to MongoDB document store...');
  await connectMongoDB();

  // Collection 1: paper_documents (110 documents)
  console.log('[MongoDB] Upserting 110 documents into paper_documents...');
  for (const p of ALL_PAPERS_SEED) {
    const fullText = `${p.title}\n\nABSTRACT:\n${p.abstract}\n\n1. INTRODUCTION\n${p.sections[0].content}\n\n2. METHODOLOGY\n${p.sections[1].content}\n\n3. RESULTS\n${p.sections[2].content}\n\n4. CONCLUSION\n${p.sections[3].content}`;

    await PaperDocument.findOneAndUpdate(
      { paper_id: p.paper_id },
      {
        $set: {
          paper_id: p.paper_id,
          full_text: fullText,
          sections: p.sections,
          references: p.references,
          keywords: p.keywords,
          metadata: {
            language: 'English',
            document_type: 'Research Article',
            publisher: p.source,
            page_count: Math.floor(Math.random() * 8) + 8,
            peer_reviewed: true,
          },
        },
      },
      { upsert: true, new: true }
    );
  }

  // Collection 2: author_documents (35 documents)
  console.log('[MongoDB] Upserting 35 documents into author_documents...');
  for (const a of AUTHORS_SEED) {
    // Find co-authors from ALL_PAPERS_SEED
    const coAuthorIds = new Set<number>();
    for (const p of ALL_PAPERS_SEED) {
      if (p.author_ids.includes(a.author_id)) {
        for (const coId of p.author_ids) {
          if (coId !== a.author_id) coAuthorIds.add(coId);
        }
      }
    }

    await AuthorDocument.findOneAndUpdate(
      { author_id: a.author_id },
      {
        $set: {
          author_id: a.author_id,
          name: a.name,
          affiliation: a.affiliation,
          email: a.email,
          bio: a.bio,
          research_interests: a.research_interests,
          co_author_ids: Array.from(coAuthorIds),
          metrics: a.metrics,
          external_profiles: a.external_profiles,
        },
      },
      { upsert: true, new: true }
    );
  }

  // Collection 3: research_area_documents (9 documents)
  console.log('[MongoDB] Upserting 9 documents into research_area_documents...');
  for (const ra of RESEARCH_AREAS_SEED) {
    const recPaperIds = ALL_PAPERS_SEED
      .filter((p) => p.area_ids.includes(ra.area_id))
      .map((p) => p.paper_id)
      .slice(0, 5);

    await ResearchAreaDocument.findOneAndUpdate(
      { area_id: ra.area_id },
      {
        $set: {
          area_id: ra.area_id,
          area_name: ra.area_name,
          description: ra.description,
          overview: ra.overview,
          sub_topics: ra.sub_topics,
          emerging_trends: ra.emerging_trends,
          top_venues: ra.top_venues,
          recommended_paper_ids: recPaperIds,
          metrics: {
            paper_count: ALL_PAPERS_SEED.filter((p) => p.area_ids.includes(ra.area_id)).length,
            active_researchers: Math.floor(Math.random() * 10) + 15,
          },
        },
      },
      { upsert: true, new: true }
    );
  }

  // Collection 4: citation_documents (110 documents)
  console.log('[MongoDB] Upserting 110 documents into citation_documents...');
  const paperTitleMap = new Map<number, { title: string; year: number }>();
  for (const p of ALL_PAPERS_SEED) {
    paperTitleMap.set(p.paper_id, {
      title: p.title,
      year: new Date(p.publication_date).getFullYear(),
    });
  }

  for (const p of ALL_PAPERS_SEED) {
    const incoming = ALL_CITATIONS_SEED.filter((c) => c.cited_paper_id === p.paper_id);
    const outgoing = ALL_CITATIONS_SEED.filter((c) => c.citing_paper_id === p.paper_id);

    const citingPapers = incoming.map((c) => {
      const meta = paperTitleMap.get(c.citing_paper_id);
      return {
        paper_id: c.citing_paper_id,
        title: meta?.title || `Paper #${c.citing_paper_id}`,
        year: meta?.year || 2023,
        context: `Cited as foundational prior work evaluating theoretical properties and empirical scaling in ${p.title.substring(0, 30)}...`,
      };
    });

    const citedPapers = outgoing.map((c) => {
      const meta = paperTitleMap.get(c.cited_paper_id);
      return {
        paper_id: c.cited_paper_id,
        title: meta?.title || `Paper #${c.cited_paper_id}`,
        year: meta?.year || 2017,
        context: `Builds upon and extends core algorithms and baseline comparison metrics from cited study.`,
      };
    });

    await CitationDocument.findOneAndUpdate(
      { paper_id: p.paper_id },
      {
        $set: {
          paper_id: p.paper_id,
          incoming_citation_count: incoming.length,
          outgoing_citation_count: outgoing.length,
          citing_papers: citingPapers,
          cited_papers: citedPapers,
          influence_metrics: {
            direct_citations: incoming.length,
            second_degree_citations: incoming.length * 3 + Math.floor(Math.random() * 8),
            pagerank_score: Number((0.005 + incoming.length * 0.0025).toFixed(4)),
          },
        },
      },
      { upsert: true, new: true }
    );
  }

  // Step 12: Print Final System Verification Report
  const pgPapersCount = parseInt((await query('SELECT COUNT(*) AS c FROM RESEARCH_PAPER;')).rows[0].c, 10);
  const pgAuthorsCount = parseInt((await query('SELECT COUNT(*) AS c FROM AUTHORS;')).rows[0].c, 10);
  const pgAreasCount = parseInt((await query('SELECT COUNT(*) AS c FROM RESEARCH_AREA;')).rows[0].c, 10);
  const pgJournalsCount = parseInt((await query('SELECT COUNT(*) AS c FROM JOURNAL;')).rows[0].c, 10);
  const pgConfsCount = parseInt((await query('SELECT COUNT(*) AS c FROM CONFERENCE;')).rows[0].c, 10);
  const pgCitsCount = parseInt((await query('SELECT COUNT(*) AS c FROM CITATION;')).rows[0].c, 10);
  const pgEmbedsCount = parseInt((await query('SELECT COUNT(*) AS c FROM PAPER_EMBEDDINGS;')).rows[0].c, 10);

  const mPaperCount = await PaperDocument.countDocuments();
  const mAuthorCount = await AuthorDocument.countDocuments();
  const mAreaCount = await ResearchAreaDocument.countDocuments();
  const mCitCount = await CitationDocument.countDocuments();

  console.log('================================================================');
  console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY AND VERIFIED:');
  console.log(`[PostgreSQL Tables]`);
  console.log(`  - RESEARCH_PAPER:    ${pgPapersCount}`);
  console.log(`  - AUTHORS:           ${pgAuthorsCount}`);
  console.log(`  - RESEARCH_AREA:     ${pgAreasCount}`);
  console.log(`  - JOURNAL:           ${pgJournalsCount}`);
  console.log(`  - CONFERENCE:        ${pgConfsCount}`);
  console.log(`  - CITATION:          ${pgCitsCount}`);
  console.log(`  - PAPER_EMBEDDINGS:  ${pgEmbedsCount}`);
  console.log(`[MongoDB Collections]`);
  console.log(`  - paper_documents:          ${mPaperCount}`);
  console.log(`  - author_documents:         ${mAuthorCount}`);
  console.log(`  - research_area_documents:  ${mAreaCount}`);
  console.log(`  - citation_documents:       ${mCitCount}`);
  console.log('================================================================');
}

if (require.main === module) {
  seedAll()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Pipeline Error]:', err);
      process.exit(1);
    });
}
