import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-handler';

async function handleGet(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Query user_bookmark_view
    const res = await query(
      `SELECT 
        ubv.paper_id,
        ubv.title,
        ubv.doi,
        ubv.publication_date,
        ubv.source,
        ubv.citation_count,
        ubv.bookmarked_at,
        ubv.primary_author,
        pdv.authors,
        pdv.research_areas,
        pdv.abstract
      FROM user_bookmark_view ubv
      JOIN paper_details_view pdv ON ubv.paper_id = pdv.paper_id
      WHERE ubv.user_id = $1
      ORDER BY ubv.bookmarked_at DESC;`,
      [user.user_id]
    );

    return NextResponse.json({
      total: res.rows.length,
      bookmarks: res.rows,
    });
  } catch (err: any) {
    console.error('[API Bookmarks GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const paperId = parseInt(body.paperId || body.paper_id, 10);
    if (isNaN(paperId)) {
      return NextResponse.json({ error: 'Valid paper ID required' }, { status: 400 });
    }

    // Insert with ON CONFLICT DO NOTHING to avoid duplicate bookmarks
    const res = await query(
      `INSERT INTO BOOKMARK (user_id, paper_id, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, paper_id) DO NOTHING
       RETURNING user_id, paper_id, created_at;`,
      [user.user_id, paperId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ message: 'Paper is already bookmarked.', alreadyBookmarked: true });
    }

    return NextResponse.json({
      message: 'Paper bookmarked successfully.',
      bookmark: res.rows[0],
    }, { status: 201 });
  } catch (err: any) {
    console.error('[API Bookmarks POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiLogging(handleGet, 'List Saved Bookmarks');
export const POST = withApiLogging(handlePost, 'Add Paper Bookmark');

