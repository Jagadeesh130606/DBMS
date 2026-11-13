import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getCurrentUser } from '@/lib/auth';
import { DBMS_DEMO_QUERIES } from '@/lib/dbms-queries';
import { withApiLogging } from '@/lib/api-handler';

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json();
    const { queryId, customSql } = body;
    const user = getCurrentUser(req);

    let sqlToExecute = '';

    if (queryId) {
      const predefined = DBMS_DEMO_QUERIES.find((q) => q.id === queryId);
      if (!predefined) {
        return NextResponse.json({ error: 'Predefined query ID not found' }, { status: 404 });
      }
      sqlToExecute = predefined.sql;
    } else if (customSql) {
      // Security: Only allow custom SQL if admin, otherwise restrict to predefined allowlist
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({
          error: 'Arbitrary SQL execution is restricted to administrators. Students can execute all 18 pre-configured DBMS demonstration queries.',
        }, { status: 403 });
      }
      sqlToExecute = customSql;
    } else {
      return NextResponse.json({ error: 'Either queryId or customSql must be provided' }, { status: 400 });
    }

    // Safety checks against dangerous system modification commands
    const forbidden = /\b(drop database|truncate users|pg_terminate_backend)\b/i;
    if (forbidden.test(sqlToExecute)) {
      return NextResponse.json({ error: 'Restricted database operation.' }, { status: 400 });
    }

    // Measure real execution latency
    const startTime = performance.now();
    const result = await query(sqlToExecute);
    const executionTimeMs = (performance.now() - startTime).toFixed(2);

    // Run EXPLAIN query plan if it's a SELECT query
    let queryPlan = null;
    const trimmed = sqlToExecute.trim().toLowerCase();
    if (trimmed.startsWith('select') || trimmed.startsWith('with')) {
      try {
        const explainRes = await query(`EXPLAIN (FORMAT TEXT) ${sqlToExecute}`);
        queryPlan = explainRes.rows.map((r: any) => Object.values(r)[0]).join('\n');
      } catch (explainErr: any) {
        queryPlan = `EXPLAIN Note: ${explainErr.message}`;
      }
    }

    // Extract columns
    const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

    return NextResponse.json({
      sql: sqlToExecute,
      executionTimeMs: Number(executionTimeMs),
      rowCount: result.rows.length,
      columns,
      rows: result.rows,
      queryPlan,
    });
  } catch (err: any) {
    console.error('[API DBMS Execute Error]:', err);
    return NextResponse.json({
      error: err.message || 'Error executing SQL query',
      detail: err.detail || null,
      code: err.code || null,
    }, { status: 500 });
  }
}

export const POST = withApiLogging(handlePost, 'Execute SQL Workbench Query');
