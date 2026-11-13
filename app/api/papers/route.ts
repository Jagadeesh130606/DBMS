import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db/postgres';
import { connectMongoDB } from '@/lib/db/mongodb';
import PaperDocument from '@/database/mongodb/models/PaperDocument';
import { generateEmbedding, formatVectorForPg } from '@/semantic/embedding_service/embedder';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-handler';

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const areaId = searchParams.get('areaId');
    const authorId = searchParams.get('authorId');
    const year = searchParams.get('year');
    const source = searchParams.get('source');
    const sortBy = searchParams.get('sortBy') || 'date_desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    let baseSql = `
      SELECT 
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
    `;

    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search.trim()) {
      whereClauses.push(`(
        LOWER(rp.title) LIKE $${paramIndex} OR 
        LOWER(rp.abstract) LIKE $${paramIndex} OR 
        LOWER(rp.doi) LIKE $${paramIndex}
      )`);
      params.push(`%${search.trim().toLowerCase()}%`);
      paramIndex++;
    }

    if (areaId) {
      whereClauses.push(`par.area_id = $${paramIndex}`);
      params.push(parseInt(areaId, 10));
      paramIndex++;
    }

    if (authorId) {
      whereClauses.push(`pa.author_id = $${paramIndex}`);
      params.push(parseInt(authorId, 10));
      paramIndex++;
    }

    if (year) {
      whereClauses.push(`EXTRACT(YEAR FROM rp.publication_date) = $${paramIndex}`);
      params.push(parseInt(year, 10));
      paramIndex++;
    }

    if (source) {
      whereClauses.push(`LOWER(rp.source) LIKE $${paramIndex}`);
      params.push(`%${source.trim().toLowerCase()}%`);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      baseSql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    baseSql += ` GROUP BY rp.paper_id, rp.title, rp.abstract, rp.doi, rp.publication_date, rp.citation_count, rp.source, rp.created_at`;

    // Sorting
    switch (sortBy) {
      case 'citations_desc':
        baseSql += ' ORDER BY rp.citation_count DESC, rp.publication_date DESC';
        break;
      case 'citations_asc':
        baseSql += ' ORDER BY rp.citation_count ASC';
        break;
      case 'title_asc':
        baseSql += ' ORDER BY rp.title ASC';
        break;
      case 'date_asc':
        baseSql += ' ORDER BY rp.publication_date ASC';
        break;
      case 'bookmarks_desc':
        baseSql += ' ORDER BY bookmark_count DESC, rp.publication_date DESC';
        break;
      case 'date_desc':
      default:
        baseSql += ' ORDER BY rp.publication_date DESC, rp.paper_id DESC';
        break;
    }

    // Execute paginated query
    const countSql = `SELECT COUNT(*) AS total FROM (${baseSql}) AS subquery;`;
    const countRes = await query(countSql, params);
    const totalCount = parseInt(countRes.rows[0]?.total || '0', 10);

    const paginatedSql = `${baseSql} LIMIT $${paramIndex} OFFSET $${paramIndex + 1};`;
    const paginatedParams = [...params, limit, offset];
    const dataRes = await query(paginatedSql, paginatedParams);

    return NextResponse.json({
      papers: dataRes.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('[API Papers GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin privilege required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      abstract,
      doi,
      publication_date,
      source,
      author_ids, // array of author IDs
      area_ids,   // array of area IDs
      full_text,
      sections,
      references,
      keywords,
      metadata,
    } = body;

    if (!title || !abstract || !doi || !publication_date || !source) {
      return NextResponse.json({ error: 'Title, abstract, DOI, publication date, and source are required.' }, { status: 400 });
    }

    // Check DOI uniqueness in PostgreSQL
    const existingDoi = await query('SELECT paper_id FROM RESEARCH_PAPER WHERE LOWER(doi) = LOWER($1);', [doi]);
    if (existingDoi.rows.length > 0) {
      return NextResponse.json({ error: `A paper with DOI '${doi}' already exists.` }, { status: 409 });
    }

    // 1. Cross-Database Synchronization Strategy with Explicit Compensation
    let newPaperId: number | null = null;

    try {
      // Step A: Atomic PostgreSQL Transaction (Paper + Authors + Areas)
      newPaperId = await transaction(async (client) => {
        const paperInsert = await client.query(
          `INSERT INTO RESEARCH_PAPER (title, abstract, doi, publication_date, citation_count, source)
           VALUES ($1, $2, $3, $4, 0, $5)
           RETURNING paper_id;`,
          [title.trim(), abstract.trim(), doi.trim(), publication_date, source.trim()]
        );
        const pId = paperInsert.rows[0].paper_id;

        // Insert authors
        if (Array.isArray(author_ids) && author_ids.length > 0) {
          for (let i = 0; i < author_ids.length; i++) {
            await client.query(
              `INSERT INTO PAPER_AUTHOR (paper_id, author_id, author_order)
               VALUES ($1, $2, $3);`,
              [pId, author_ids[i], i + 1]
            );
          }
        }

        // Insert areas
        if (Array.isArray(area_ids) && area_ids.length > 0) {
          for (const aId of area_ids) {
            await client.query(
              `INSERT INTO PAPER_AREA (paper_id, area_id)
               VALUES ($1, $2);`,
              [pId, aId]
            );
          }
        }

        return pId;
      });

      // Step B: Generate pgvector dense embedding and save
      const textToEmbed = `${title}. ${abstract}`;
      const vector = await generateEmbedding(textToEmbed);
      const pgVectorStr = formatVectorForPg(vector);
      await query(
        `INSERT INTO PAPER_EMBEDDINGS (paper_id, embedding, embedding_model)
         VALUES ($1, $2, 'all-MiniLM-L6-v2');`,
        [newPaperId, pgVectorStr]
      );

      // Step C: Insert into MongoDB document database
      await connectMongoDB();
      const defaultSections = [
        { heading: 'Introduction', content: `Introduction for ${title}.` },
        { heading: 'Methodology', content: `Methodology section detailing implementation.` },
        { heading: 'Results', content: `Experimental benchmark outcomes and comparative metrics.` },
        { heading: 'Conclusion', content: `Summary of findings and ongoing investigations.` },
      ];

      await PaperDocument.create({
        paper_id: newPaperId,
        full_text: full_text || `${title}\n\n${abstract}`,
        sections: sections || defaultSections,
        references: references || [],
        keywords: keywords || ['research', 'computer science'],
        metadata: metadata || {
          language: 'English',
          document_type: 'Research Article',
          publisher: source,
          peer_reviewed: true,
        },
      });

      return NextResponse.json({
        message: 'Research paper successfully created across PostgreSQL and MongoDB.',
        paper_id: newPaperId,
      }, { status: 201 });

    } catch (crossDbError: any) {
      console.error('[Cross-DB Transaction Error]:', crossDbError);
      
      // Compensation Logic: if MongoDB or embedding failed after PG commit, roll back / compensate PostgreSQL
      if (newPaperId) {
        console.warn(`[Compensation] Reverting PostgreSQL records for Paper ID: ${newPaperId}...`);
        await query('DELETE FROM RESEARCH_PAPER WHERE paper_id = $1;', [newPaperId]);
        await connectMongoDB();
        await PaperDocument.deleteOne({ paper_id: newPaperId });
      }

      return NextResponse.json({
        error: `Cross-database synchronization failed: ${crossDbError.message}. Compensation rolled back changes.`,
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('[API Papers POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiLogging(handleGet, 'Search & Filter Research Papers');
export const POST = withApiLogging(handlePost, 'Add Research Paper (Multi-Model Transaction)');

