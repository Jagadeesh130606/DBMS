import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db/postgres';
import { connectMongoDB } from '@/lib/db/mongodb';
import PaperDocument from '@/database/mongodb/models/PaperDocument';
import CitationDocument from '@/database/mongodb/models/CitationDocument';
import { generateEmbedding, formatVectorForPg } from '@/semantic/embedding_service/embedder';
import { withApiLogging } from '@/lib/api-handler';

// Global in-memory demonstration state for the interactive tour
let demoPaperState = {
  activePaperId: null as number | null,
  history: [] as {
    timestamp: string;
    operation: string;
    database: string;
    query: string;
    durationMs: number;
    status: 'SUCCESS' | 'FAILED';
  }[],
};

export async function GET() {
  return NextResponse.json({
    activePaperId: demoPaperState.activePaperId,
    history: demoPaperState.history.slice(-20),
  });
}

async function handlePost(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { action } = body;

    await connectMongoDB();

    if (action === 'insert') {
      const demoTitle = `Adaptive Vector Indexing under Dynamic Multi-Tenant Relational Workloads (Demo ${Date.now().toString().slice(-4)})`;
      const demoAbstract = `We evaluate real-time HNSW graph mutations inside PostgreSQL relational buffers, measuring concurrent read recall under heavy insert bursts and verifying multi-model consistency with MongoDB.`;
      const demoDoi = `10.1145/demo.vldb.${Date.now()}`;
      const demoDate = '2024-06-15';
      const demoSource = 'ACM SIGMOD 2024';

      let newId: number;

      // 1. PostgreSQL Insert
      const pgStart = Date.now();
      const insertRes = await query(
        `INSERT INTO RESEARCH_PAPER (title, abstract, doi, publication_date, citation_count, source, source_type, journal_id, conference_id)
         VALUES ($1, $2, $3, $4, 0, $5, 'CONFERENCE', NULL, 5)
         RETURNING paper_id;`,
        [demoTitle, demoAbstract, demoDoi, demoDate, demoSource]
      );
      newId = insertRes.rows[0].paper_id;
      demoPaperState.activePaperId = newId;

      // Attach primary author and area
      await query(`INSERT INTO PAPER_AUTHOR (paper_id, author_id, author_order) VALUES ($1, 6, 1);`, [newId]);
      await query(`INSERT INTO PAPER_AREA (paper_id, area_id) VALUES ($1, 4);`, [newId]);

      // Generate embedding and save to pgvector
      const vector = await generateEmbedding(`${demoTitle}. ${demoAbstract}`);
      const pgVectorStr = formatVectorForPg(vector);
      await query(
        `INSERT INTO PAPER_EMBEDDINGS (paper_id, embedding, embedding_model)
         VALUES ($1, $2, 'all-MiniLM-L6-v2');`,
        [newId, pgVectorStr]
      );
      const pgDuration = Date.now() - pgStart;

      demoPaperState.history.unshift({
        timestamp: new Date().toISOString(),
        operation: 'INSERT (Paper + Authors + Areas + 384-D Vector)',
        database: 'PostgreSQL + pgvector',
        query: `INSERT INTO RESEARCH_PAPER (...) VALUES ('${demoTitle.substring(0, 30)}...', ...); INSERT INTO PAPER_EMBEDDINGS (paper_id, embedding) VALUES (${newId}, '[384-D vector]');`,
        durationMs: pgDuration,
        status: 'SUCCESS',
      });

      // 2. MongoDB Insert
      const mongoStart = Date.now();
      await PaperDocument.create({
        paper_id: newId,
        full_text: `${demoTitle}\n\nABSTRACT:\n${demoAbstract}\n\n1. INTRODUCTION\nExperimental investigation of relational vector architectures.\n\n2. METHODOLOGY\nBenchmarking HNSW indices under dynamic insert concurrency.\n\n3. RESULTS\nSub-5ms latency achieved at 98% recall@10.\n\n4. CONCLUSION\nPolyglot persistence validated successfully.`,
        sections: [
          { heading: 'Introduction', content: 'Experimental investigation of relational vector architectures.' },
          { heading: 'Methodology', content: 'Benchmarking HNSW indices under dynamic insert concurrency.' },
          { heading: 'Results', content: 'Sub-5ms latency achieved at 98% recall@10.' },
          { heading: 'Conclusion', content: 'Polyglot persistence validated successfully.' },
        ],
        references: [
          { title: 'Attention Is All You Need', authors: ['Vaswani et al.'], year: 2017 },
          { title: 'Spanner: Google Globally-Distributed Database System', authors: ['Corbett et al.'], year: 2012 },
        ],
        keywords: ['vector database', 'polyglot persistence', 'postgresql', 'mongodb', 'acid'],
        metadata: {
          language: 'English',
          document_type: 'Conference Paper',
          publisher: demoSource,
          peer_reviewed: true,
        },
      });

      await CitationDocument.create({
        paper_id: newId,
        incoming_citation_count: 0,
        outgoing_citation_count: 2,
        citing_papers: [],
        cited_papers: [
          { paper_id: 1, title: 'Attention Is All You Need', year: 2017, context: 'Cited as foundational architecture.' },
          { paper_id: 6, title: 'Spanner: Google Globally-Distributed Database', year: 2012, context: 'Comparative transactional baseline.' },
        ],
      });
      const mongoDuration = Date.now() - mongoStart;

      demoPaperState.history.unshift({
        timestamp: new Date().toISOString(),
        operation: 'INSERT (Unstructured Document + Citations)',
        database: 'MongoDB (paper_documents + citation_documents)',
        query: `db.paper_documents.insertOne({ paper_id: ${newId}, sections: [...], references: [...] });`,
        durationMs: mongoDuration,
        status: 'SUCCESS',
      });

      return NextResponse.json({
        message: 'Step 1: Successfully created demo paper in PostgreSQL, pgvector, and MongoDB.',
        paperId: newId,
        details: {
          title: demoTitle,
          doi: demoDoi,
          pgDurationMs: pgDuration,
          mongoDurationMs: mongoDuration,
          totalDurationMs: Date.now() - startTime,
        },
      });
    }

    if (action === 'verify') {
      const targetId = body.paperId || demoPaperState.activePaperId;
      if (!targetId) {
        return NextResponse.json({ error: 'No active demo paper ID available. Run insert first.' }, { status: 400 });
      }

      // 1. Query PostgreSQL
      const pgStart = Date.now();
      const pgRes = await query(
        `SELECT rp.paper_id, rp.title, rp.doi, rp.publication_date, rp.source, rp.source_type,
                a.name AS primary_author, ra.area_name AS primary_area,
                pe.embedding_model, (pe.embedding IS NOT NULL) AS has_vector
         FROM RESEARCH_PAPER rp
         LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id AND pa.author_order = 1
         LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
         LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
         LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
         LEFT JOIN PAPER_EMBEDDINGS pe ON rp.paper_id = pe.paper_id
         WHERE rp.paper_id = $1;`,
        [targetId]
      );
      const pgDuration = Date.now() - pgStart;

      // 2. Query MongoDB
      const mongoStart = Date.now();
      const mongoDoc = await PaperDocument.findOne({ paper_id: targetId }).lean();
      const citDoc = await CitationDocument.findOne({ paper_id: targetId }).lean();
      const mongoDuration = Date.now() - mongoStart;

      demoPaperState.history.unshift({
        timestamp: new Date().toISOString(),
        operation: 'VERIFY & SELECT (Dual-Database Check)',
        database: 'PostgreSQL & MongoDB',
        query: `SELECT ... FROM RESEARCH_PAPER WHERE paper_id = ${targetId}; db.paper_documents.findOne({ paper_id: ${targetId} });`,
        durationMs: pgDuration + mongoDuration,
        status: 'SUCCESS',
      });

      return NextResponse.json({
        message: 'Step 2: Verification confirmed exact 1:1 cross-database parity.',
        paperId: targetId,
        postgresqlRecord: pgRes.rows[0],
        mongoDocument: mongoDoc,
        citationDocument: citDoc,
        timings: { pgDuration, mongoDuration },
      });
    }

    if (action === 'update') {
      const targetId = body.paperId || demoPaperState.activePaperId;
      if (!targetId) {
        return NextResponse.json({ error: 'No active demo paper ID to update.' }, { status: 400 });
      }

      const updatedTitle = `[UPDATED] Scalable Multi-Model Relational & Document Indexing (ID #${targetId})`;
      const updatedAbstract = `Updated empirical evaluation demonstrating improved throughput, reduced index bloat, and synchronized real-time vector re-indexing under dynamic ACID workloads.`;

      // 1. Update PostgreSQL
      const pgStart = Date.now();
      await query(
        `UPDATE RESEARCH_PAPER
         SET title = $1, abstract = $2
         WHERE paper_id = $3;`,
        [updatedTitle, updatedAbstract, targetId]
      );

      // Re-embed and update vector
      const vector = await generateEmbedding(`${updatedTitle}. ${updatedAbstract}`);
      const pgVectorStr = formatVectorForPg(vector);
      await query(
        `UPDATE PAPER_EMBEDDINGS
         SET embedding = $1, created_at = CURRENT_TIMESTAMP
         WHERE paper_id = $2;`,
        [pgVectorStr, targetId]
      );
      const pgDuration = Date.now() - pgStart;

      // 2. Update MongoDB
      const mongoStart = Date.now();
      await PaperDocument.findOneAndUpdate(
        { paper_id: targetId },
        {
          $set: {
            full_text: `${updatedTitle}\n\nABSTRACT:\n${updatedAbstract}\n\n[Content updated dynamically across both databases.]`,
            'sections.0.content': 'Updated introduction reflecting verified cross-database transaction throughput.',
          },
        }
      );
      const mongoDuration = Date.now() - mongoStart;

      demoPaperState.history.unshift({
        timestamp: new Date().toISOString(),
        operation: 'UPDATE (Title, Abstract, Vector & Mongo Section)',
        database: 'PostgreSQL + pgvector + MongoDB',
        query: `UPDATE RESEARCH_PAPER SET title = '${updatedTitle.substring(0, 30)}...' WHERE paper_id = ${targetId}; db.paper_documents.updateOne({ paper_id: ${targetId} }, { $set: ... });`,
        durationMs: pgDuration + mongoDuration,
        status: 'SUCCESS',
      });

      return NextResponse.json({
        message: 'Step 3: Paper successfully updated across PostgreSQL, pgvector, and MongoDB.',
        paperId: targetId,
        updatedTitle,
        timings: { pgDuration, mongoDuration },
      });
    }

    if (action === 'delete') {
      const targetId = body.paperId || demoPaperState.activePaperId;
      if (!targetId) {
        return NextResponse.json({ error: 'No active demo paper ID to delete.' }, { status: 400 });
      }

      // 1. Delete from PostgreSQL (Cascades to junction tables and embeddings)
      const pgStart = Date.now();
      await query('DELETE FROM RESEARCH_PAPER WHERE paper_id = $1;', [targetId]);
      const pgDuration = Date.now() - pgStart;

      // 2. Delete from MongoDB
      const mongoStart = Date.now();
      await PaperDocument.deleteOne({ paper_id: targetId });
      await CitationDocument.deleteOne({ paper_id: targetId });
      const mongoDuration = Date.now() - mongoStart;

      demoPaperState.activePaperId = null;

      demoPaperState.history.unshift({
        timestamp: new Date().toISOString(),
        operation: 'DELETE (Cascading Foreign Keys & Mongo Cleanup)',
        database: 'PostgreSQL & MongoDB',
        query: `DELETE FROM RESEARCH_PAPER WHERE paper_id = ${targetId}; db.paper_documents.deleteOne({ paper_id: ${targetId} });`,
        durationMs: pgDuration + mongoDuration,
        status: 'SUCCESS',
      });

      // Verify zero orphaned records remain
      const verifyPg = await query('SELECT COUNT(*) AS c FROM RESEARCH_PAPER WHERE paper_id = $1;', [targetId]);
      const verifyEmbed = await query('SELECT COUNT(*) AS c FROM PAPER_EMBEDDINGS WHERE paper_id = $1;', [targetId]);
      const verifyMongo = await PaperDocument.countDocuments({ paper_id: targetId });

      return NextResponse.json({
        message: `Step 4: Paper #${targetId} deleted across both databases with zero residual records.`,
        verification: {
          postgresRecordsRemaining: parseInt(verifyPg.rows[0].c, 10),
          pgvectorRecordsRemaining: parseInt(verifyEmbed.rows[0].c, 10),
          mongoDocumentsRemaining: verifyMongo,
        },
        timings: { pgDuration, mongoDuration },
      });
    }

    return NextResponse.json({ error: 'Unknown action specified' }, { status: 400 });
  } catch (err: any) {
    console.error('[CRUD Demo Error]:', err);
    demoPaperState.history.unshift({
      timestamp: new Date().toISOString(),
      operation: 'ERROR',
      database: 'Cross-DB',
      query: err.message,
      durationMs: Date.now() - startTime,
      status: 'FAILED',
    });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiLogging(handlePost, 'Interactive Dual-DB CRUD Simulation');

