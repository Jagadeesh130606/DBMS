import { NextRequest, NextResponse } from 'next/server';
import { query, getActiveEngine } from '@/lib/db/postgres';
import { connectMongoDB } from '@/lib/db/mongodb';
import PaperDocument from '@/database/mongodb/models/PaperDocument';
import AuthorDocument from '@/database/mongodb/models/AuthorDocument';
import ResearchAreaDocument from '@/database/mongodb/models/ResearchAreaDocument';
import CitationDocument from '@/database/mongodb/models/CitationDocument';
import { withApiLogging } from '@/lib/api-handler';

async function handleGet(req: NextRequest) {
  try {
    // 1. Relational aggregate counts from PostgreSQL (All 12 Tables)
    const [
      papersCount,
      authorsCount,
      areasCount,
      journalsCount,
      conferencesCount,
      citationsCount,
      usersCount,
      bookmarksCount,
      searchHistoryCount,
      paperAuthorsCount,
      paperAreasCount,
      embeddingsCount
    ] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM RESEARCH_PAPER;'),
      query('SELECT COUNT(*) AS count FROM AUTHORS;'),
      query('SELECT COUNT(*) AS count FROM RESEARCH_AREA;'),
      query('SELECT COUNT(*) AS count FROM JOURNAL;'),
      query('SELECT COUNT(*) AS count FROM CONFERENCE;'),
      query('SELECT COUNT(*) AS count FROM CITATION;'),
      query('SELECT COUNT(*) AS count FROM USERS;'),
      query('SELECT COUNT(*) AS count FROM BOOKMARK;'),
      query('SELECT COUNT(*) AS count FROM SEARCH_HISTORY;'),
      query('SELECT COUNT(*) AS count FROM PAPER_AUTHOR;'),
      query('SELECT COUNT(*) AS count FROM PAPER_AREA;'),
      query('SELECT COUNT(*) AS count FROM PAPER_EMBEDDINGS;'),
    ]);

    // Active engine detection
    const activeEngine = await getActiveEngine();

    // 2. Recently added papers using paper_details_view
    const recentPapers = await query(`
      SELECT 
        paper_id, 
        title, 
        doi, 
        publication_date, 
        citation_count, 
        source, 
        source_type,
        journal_name,
        conference_name,
        authors, 
        research_areas,
        bookmark_count
      FROM paper_details_view
      ORDER BY publication_date DESC, paper_id DESC
      LIMIT 8;
    `);

    // 3. Popular research areas with paper distributions
    const popularAreas = await query(`
      SELECT 
        ra.area_id, 
        ra.area_name, 
        ra.description,
        COUNT(par.paper_id) AS paper_count
      FROM RESEARCH_AREA ra
      LEFT JOIN PAPER_AREA par ON ra.area_id = par.area_id
      GROUP BY ra.area_id, ra.area_name, ra.description
      ORDER BY paper_count DESC;
    `);

    // 4. Most popular papers from popular_papers_view
    const popularPapers = await query(`
      SELECT 
        ppv.paper_id, 
        ppv.title, 
        ppv.doi, 
        ppv.source, 
        ppv.citation_count, 
        ppv.total_bookmarks, 
        ppv.popularity_score,
        ppv.popularity_rank,
        pdv.authors
      FROM popular_papers_view ppv
      JOIN paper_details_view pdv ON ppv.paper_id = pdv.paper_id
      ORDER BY ppv.popularity_rank ASC
      LIMIT 8;
    `);

    // 5. Recent search queries from SEARCH_HISTORY
    const recentSearches = await query(`
      SELECT 
        sh.search_id, 
        sh.search_query, 
        sh.search_type, 
        sh.search_date, 
        u.name AS user_name
      FROM SEARCH_HISTORY sh
      JOIN USERS u ON sh.user_id = u.user_id
      ORDER BY sh.search_date DESC
      LIMIT 10;
    `);

    // 6. MongoDB Document statistics across all 4 collections
    let mongoCounts = {
      paper_documents: 0,
      author_documents: 0,
      research_area_documents: 0,
      citation_documents: 0,
      totalDocuments: 0,
    };
    let mongoStatus = 'CONNECTED';

    try {
      await connectMongoDB();
      const [pDocs, aDocs, raDocs, cDocs] = await Promise.all([
        PaperDocument.countDocuments(),
        AuthorDocument.countDocuments(),
        ResearchAreaDocument.countDocuments(),
        CitationDocument.countDocuments(),
      ]);
      mongoCounts = {
        paper_documents: pDocs,
        author_documents: aDocs,
        research_area_documents: raDocs,
        citation_documents: cDocs,
        totalDocuments: pDocs + aDocs + raDocs + cDocs,
      };
    } catch (e: any) {
      console.warn('[Dashboard] Mongo count warning:', e.message);
      mongoStatus = 'DEGRADED';
    }

    const tableCounts = {
      RESEARCH_PAPER: parseInt(papersCount.rows[0]?.count || '0', 10),
      AUTHORS: parseInt(authorsCount.rows[0]?.count || '0', 10),
      RESEARCH_AREA: parseInt(areasCount.rows[0]?.count || '0', 10),
      JOURNAL: parseInt(journalsCount.rows[0]?.count || '0', 10),
      CONFERENCE: parseInt(conferencesCount.rows[0]?.count || '0', 10),
      CITATION: parseInt(citationsCount.rows[0]?.count || '0', 10),
      USERS: parseInt(usersCount.rows[0]?.count || '0', 10),
      BOOKMARK: parseInt(bookmarksCount.rows[0]?.count || '0', 10),
      SEARCH_HISTORY: parseInt(searchHistoryCount.rows[0]?.count || '0', 10),
      PAPER_AUTHOR: parseInt(paperAuthorsCount.rows[0]?.count || '0', 10),
      PAPER_AREA: parseInt(paperAreasCount.rows[0]?.count || '0', 10),
      PAPER_EMBEDDINGS: parseInt(embeddingsCount.rows[0]?.count || '0', 10),
    };

    return NextResponse.json({
      counts: {
        totalPapers: tableCounts.RESEARCH_PAPER,
        totalAuthors: tableCounts.AUTHORS,
        totalAreas: tableCounts.RESEARCH_AREA,
        totalJournals: tableCounts.JOURNAL,
        totalConferences: tableCounts.CONFERENCE,
        totalCitations: tableCounts.CITATION,
        totalUsers: tableCounts.USERS,
        totalBookmarks: tableCounts.BOOKMARK,
        totalEmbeddings: tableCounts.PAPER_EMBEDDINGS,
        mongoDocuments: mongoCounts.paper_documents,
        totalMongoDocuments: mongoCounts.totalDocuments,
      },
      tableCounts,
      mongoCounts,
      connectionStatus: {
        postgres: {
          status: 'CONNECTED',
          engine: activeEngine.toUpperCase(),
          tablesCount: 12,
          version: 'PostgreSQL 16 (pgvector active)',
        },
        mongodb: {
          status: mongoStatus,
          database: 'research_paper_db',
          collectionsCount: 4,
          host: '127.0.0.1:27017',
        },
      },
      recentPapers: recentPapers.rows,
      popularAreas: popularAreas.rows,
      popularPapers: popularPapers.rows,
      recentSearches: recentSearches.rows,
    });
  } catch (err: any) {
    console.error('[API Dashboard Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiLogging(handleGet, 'Fetch Dashboard Metrics & Database Counts');
