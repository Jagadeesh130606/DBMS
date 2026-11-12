import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db/postgres';

export async function GET(req: NextRequest) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Fetch fresh user data and stats
  const userRes = await query('SELECT user_id, name, email, role, created_at FROM USERS WHERE user_id = $1;', [user.user_id]);
  if (userRes.rows.length === 0) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Fetch user bookmark count
  const bmCount = await query('SELECT COUNT(*) AS count FROM BOOKMARK WHERE user_id = $1;', [user.user_id]);
  const histCount = await query('SELECT COUNT(*) AS count FROM SEARCH_HISTORY WHERE user_id = $1;', [user.user_id]);

  return NextResponse.json({
    authenticated: true,
    user: {
      ...userRes.rows[0],
      bookmark_count: parseInt(bmCount.rows[0]?.count || '0', 10),
      search_count: parseInt(histCount.rows[0]?.count || '0', 10),
    },
  });
}

