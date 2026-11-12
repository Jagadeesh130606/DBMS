import { NextResponse } from 'next/server';
import { DBMS_DEMO_QUERIES } from '@/lib/dbms-queries';

export async function GET() {
  return NextResponse.json({
    total: DBMS_DEMO_QUERIES.length,
    queries: DBMS_DEMO_QUERIES,
  });
}
