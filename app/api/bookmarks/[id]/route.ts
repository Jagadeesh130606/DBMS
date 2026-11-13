import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-handler';

async function handleDelete(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const paperId = parseInt(params.id, 10);
    if (isNaN(paperId)) {
      return NextResponse.json({ error: 'Invalid paper ID' }, { status: 400 });
    }

    const res = await query(
      'DELETE FROM BOOKMARK WHERE user_id = $1 AND paper_id = $2 RETURNING paper_id;',
      [user.user_id, paperId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ message: 'Bookmark not found or already removed.' });
    }

    return NextResponse.json({ message: 'Bookmark successfully removed.' });
  } catch (err: any) {
    console.error('[API Bookmarks DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const DELETE = withApiLogging(handleDelete, 'Remove Paper Bookmark');

