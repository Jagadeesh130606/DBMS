import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const res = await query(
      `SELECT search_id, search_query, search_type, search_date
       FROM SEARCH_HISTORY
       WHERE user_id = $1
       ORDER BY search_date DESC;`,
      [user.user_id]
    );

    return NextResponse.json({
      total: res.rows.length,
      history: res.rows,
    });
  } catch (err: any) {
    console.error('[API Search History GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await query('DELETE FROM SEARCH_HISTORY WHERE user_id = $1;', [user.user_id]);

    return NextResponse.json({ message: 'Search history cleared successfully.' });
  } catch (err: any) {
    console.error('[API Search History Clear Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

