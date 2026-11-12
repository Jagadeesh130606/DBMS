import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchId = parseInt(params.id, 10);
    if (isNaN(searchId)) {
      return NextResponse.json({ error: 'Invalid search ID' }, { status: 400 });
    }

    const res = await query(
      'DELETE FROM SEARCH_HISTORY WHERE search_id = $1 AND user_id = $2 RETURNING search_id;',
      [searchId, user.user_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Search record not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Search history record deleted.' });
  } catch (err: any) {
    console.error('[API Search History Item DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

