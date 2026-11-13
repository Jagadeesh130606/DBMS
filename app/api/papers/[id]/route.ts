import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { connectMongoDB } from '@/lib/db/mongodb';
import PaperDocument from '@/database/mongodb/models/PaperDocument';
import { generateEmbedding, formatVectorForPg } from '@/semantic/embedding_service/embedder';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-handler';

async function handleGet(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paperId = parseInt(params.id, 10);
    if (isNaN(paperId)) {
      return NextResponse.json({ error: 'Invalid paper ID' }, { status: 400 });
    }

    const user = getCurrentUser(req);

    // 1. Fetch structured relational metadata from PostgreSQL
    const pgRes = await query(
      `SELECT 
        rp.paper_id,
        rp.title,
        rp.abstract,
        rp.doi,
        rp.publication_date,
        rp.citation_count,
        rp.source,
        rp.created_at,
        COALESCE(string_agg(DISTINCT a.name, ', ' ORDER BY a.name), 'Unknown Author') AS authors,
        COALESCE(string_agg(DISTINCT ra.area_name, ', ' ORDER BY ra.area_name), 'General') AS research_areas,
        COUNT(DISTINCT b.user_id) AS bookmark_count
      FROM RESEARCH_PAPER rp
      LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
      LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
      LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
      LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
      LEFT JOIN BOOKMARK b ON rp.paper_id = b.paper_id
      WHERE rp.paper_id = $1
      GROUP BY rp.paper_id, rp.title, rp.abstract, rp.doi, rp.publication_date, rp.citation_count, rp.source, rp.created_at;`,
      [paperId]
    );

    if (pgRes.rows.length === 0) {
      return NextResponse.json({ error: 'Research paper not found.' }, { status: 404 });
    }

    const paper = pgRes.rows[0];

    // Fetch authors with details (affiliations)
    const authorsRes = await query(
      `SELECT a.author_id, a.name, a.affiliation, a.email, pa.author_order
       FROM PAPER_AUTHOR pa
       JOIN AUTHORS a ON pa.author_id = a.author_id
       WHERE pa.paper_id = $1
       ORDER BY pa.author_order ASC;`,
      [paperId]
    );

    // Fetch research areas
    const areasRes = await query(
      `SELECT ra.area_id, ra.area_name, ra.description
       FROM PAPER_AREA par
       JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
       WHERE par.paper_id = $1;`,
      [paperId]
    );

    // Check if currently authenticated user bookmarked this paper
    let isBookmarked = false;
    if (user) {
      const bmRes = await query(
        'SELECT 1 FROM BOOKMARK WHERE user_id = $1 AND paper_id = $2;',
        [user.user_id, paperId]
      );
      isBookmarked = bmRes.rows.length > 0;
    }

    // 2. Fetch unstructured content from MongoDB
    await connectMongoDB();
    const mongoDoc = await PaperDocument.findOne({ paper_id: paperId }).lean();

    return NextResponse.json({
      paper: {
        ...paper,
        authorsList: authorsRes.rows,
        areasList: areasRes.rows,
        isBookmarked,
      },
      document: mongoDoc || {
        paper_id: paperId,
        full_text: `${paper.title}\n\n${paper.abstract}`,
        sections: [
          { heading: 'Abstract', content: paper.abstract },
          { heading: 'Document Body', content: 'Extended document content available in document store.' },
        ],
        references: [],
        keywords: ['research', 'computer science'],
        metadata: {
          language: 'English',
          document_type: 'Research Article',
        },
      },
    });
  } catch (err: any) {
    console.error('[API Paper GET [id] Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

async function handlePut(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin privilege required.' }, { status: 403 });
    }

    const paperId = parseInt(params.id, 10);
    const body = await req.json();
    const { title, abstract, doi, publication_date, source, sections, keywords, references } = body;

    // 1. Update PostgreSQL record
    await query(
      `UPDATE RESEARCH_PAPER
       SET 
         title = COALESCE($1, title),
         abstract = COALESCE($2, abstract),
         doi = COALESCE($3, doi),
         publication_date = COALESCE($4, publication_date),
         source = COALESCE($5, source)
       WHERE paper_id = $6;`,
      [title, abstract, doi, publication_date, source, paperId]
    );

    // 2. Update pgvector embedding if title or abstract changed
    if (title || abstract) {
      const current = await query('SELECT title, abstract FROM RESEARCH_PAPER WHERE paper_id = $1;', [paperId]);
      if (current.rows.length > 0) {
        const textToEmbed = `${current.rows[0].title}. ${current.rows[0].abstract}`;
        const vector = await generateEmbedding(textToEmbed);
        const vectorStr = formatVectorForPg(vector);
        await query(
          `INSERT INTO PAPER_EMBEDDINGS (paper_id, embedding, embedding_model, created_at)
           VALUES ($1, $2, 'all-MiniLM-L6-v2', CURRENT_TIMESTAMP)
           ON CONFLICT (paper_id)
           DO UPDATE SET embedding = EXCLUDED.embedding, created_at = CURRENT_TIMESTAMP;`,
          [paperId, vectorStr]
        );
      }
    }

    // 3. Update MongoDB document
    await connectMongoDB();
    await PaperDocument.findOneAndUpdate(
      { paper_id: paperId },
      {
        $set: {
          ...(sections ? { sections } : {}),
          ...(keywords ? { keywords } : {}),
          ...(references ? { references } : {}),
          ...(title || abstract ? { full_text: `${title || ''}\n\n${abstract || ''}` } : {}),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: 'Research paper successfully updated in PostgreSQL and MongoDB.' });
  } catch (err: any) {
    console.error('[API Paper PUT Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

async function handleDelete(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin privilege required.' }, { status: 403 });
    }

    const paperId = parseInt(params.id, 10);

    // 1. Delete from PostgreSQL (cascades to PAPER_AUTHOR, PAPER_AREA, CITATION, BOOKMARK, PAPER_EMBEDDINGS)
    const delRes = await query('DELETE FROM RESEARCH_PAPER WHERE paper_id = $1 RETURNING paper_id;', [paperId]);
    if (delRes.rows.length === 0) {
      return NextResponse.json({ error: 'Paper not found.' }, { status: 404 });
    }

    // 2. Delete from MongoDB
    await connectMongoDB();
    await PaperDocument.deleteOne({ paper_id: paperId });

    return NextResponse.json({ message: `Research paper #${paperId} successfully deleted across both databases.` });
  } catch (err: any) {
    console.error('[API Paper DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiLogging(handleGet, 'View Research Paper Details');
export const PUT = withApiLogging(handlePut, 'Update Research Paper (Dual-DB Sync)');
export const DELETE = withApiLogging(handleDelete, 'Delete Research Paper (Dual-DB Cascade)');

