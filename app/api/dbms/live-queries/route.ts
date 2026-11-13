import { NextRequest, NextResponse } from 'next/server';
import { getLiveQueryHistory, clearLiveQueryHistory } from '@/lib/db/query-logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'PostgreSQL' | 'MongoDB';

    const queries = getLiveQueryHistory(limit, filter);

    const allQueries = getLiveQueryHistory(150);
    const pgCount = allQueries.filter((q) => q.dbType === 'PostgreSQL').length;
    const mongoCount = allQueries.filter((q) => q.dbType === 'MongoDB').length;

    return NextResponse.json({
      success: true,
      queries,
      stats: {
        totalCaptured: allQueries.length,
        pgCount,
        mongoCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'clear') {
      clearLiveQueryHistory();
      return NextResponse.json({ success: true, message: 'Live query history cleared.' });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

