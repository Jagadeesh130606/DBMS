import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { connectMongoDB } from '@/lib/db/mongodb';
import PaperDocument from '@/database/mongodb/models/PaperDocument';

export async function GET(req: NextRequest) {
  try {
    // 1. Relational aggregate counts from PostgreSQL
    const [papersCount, authorsCount, areasCount, citationsCount, usersCount, bookmarksCount] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM RESEARCH_PAPER;'),
      query('SELECT COUNT(*) AS count FROM AUTHORS;'),
      query('SELECT COUNT(*) AS count FROM RESEARCH_AREA;'),
      query('SELECT COUNT(*) AS count FROM CITATION;'),
      query('SELECT COUNT(*) AS count FROM USERS;'),
      query('SELECT COUNT(*) AS count FROM BOOKMARK;'),
    ]);

    // 2. Recently added papers using paper_details_view
    const recentPapers = await query(`
      SELECT 
        paper_id, 
        title, 
        doi, 
        publication_date, 
        citation_count, 
        source, 
        authors, 
        research_areas,
        bookmark_count
      FROM paper_details_view
      ORDER BY publication_date DESC, paper_id DESC
      LIMIT 6;
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
      LIMIT 6;
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
      LIMIT 8;
    `);

    // 6. MongoDB Document statistics
    let mongoDocCount = 0;
    try {
      await connectMongoDB();
      mongoDocCount = await PaperDocument.countDocuments();
    } catch (e: any) {
      console.warn('[Dashboard] Mongo count warning:', e.message);
    }

    return NextResponse.json({
      counts: {
        totalPapers: parseInt(papersCount.rows[0]?.count || '0', 10),
        totalAuthors: parseInt(authorsCount.rows[0]?.count || '0', 10),
        totalAreas: parseInt(areasCount.rows[0]?.count || '0', 10),
        totalCitations: parseInt(citationsCount.rows[0]?.count || '0', 10),
        totalUsers: parseInt(usersCount.rows[0]?.count || '0', 10),
        totalBookmarks: parseInt(bookmarksCount.rows[0]?.count || '0', 10),
        mongoDocuments: mongoDocCount,
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

