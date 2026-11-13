import { NextRequest, NextResponse } from 'next/server';
import { requestContextStorage, logRequestStart, logRequestEnd, RequestContext } from './db/query-logger';

export function inferAction(method: string, pathname: string): string {
  const m = method.toUpperCase();

  if (pathname.startsWith('/api/dbms/live-queries')) return 'Live Activity Poll';
  if (pathname.startsWith('/api/dbms/execute')) return 'Execute SQL Workbench Query';
  if (pathname.startsWith('/api/dbms/analytics')) return 'Execute MongoDB Aggregation Pipelines';
  if (pathname.startsWith('/api/dbms/crud-demo')) return 'Interactive Dual-DB CRUD Simulation';
  if (pathname.startsWith('/api/dbms/overview')) return 'Inspect Database Architecture & Tables';
  if (pathname.startsWith('/api/dbms/collection-sample')) return 'Inspect MongoDB Document Sample';
  if (pathname.startsWith('/api/dbms/queries')) return 'Load SQL Query Templates';

  if (pathname.includes('/citations')) return 'Explore Citation Graph (Recursive CTE)';
  if (pathname.startsWith('/api/papers/')) {
    if (m === 'GET') return 'View Research Paper Details';
    if (m === 'PUT' || m === 'PATCH') return 'Update Research Paper';
    if (m === 'DELETE') return 'Delete Research Paper (Dual-DB Cascade)';
  }
  if (pathname === '/api/papers') {
    if (m === 'POST') return 'Add Research Paper (Multi-Model Transaction)';
    if (m === 'GET') return 'Search & Filter Research Papers';
  }

  if (pathname.startsWith('/api/bookmarks/')) {
    if (m === 'DELETE') return 'Remove Paper Bookmark';
  }
  if (pathname === '/api/bookmarks') {
    if (m === 'POST') return 'Add Paper Bookmark';
    if (m === 'GET') return 'List Saved Bookmarks';
  }

  if (pathname === '/api/search/keyword') return 'Keyword Search (PostgreSQL FTS)';
  if (pathname === '/api/search/semantic') return 'Semantic Vector Search (pgvector 384-D)';
  if (pathname === '/api/search/hybrid') return 'Hybrid Search (Reciprocal Rank Fusion)';
  if (pathname === '/api/recommendations') return 'Personalized Semantic Recommendations';

  if (pathname === '/api/authors') return 'Explore Academic Authors';
  if (pathname === '/api/areas') return 'Explore Research Areas';
  if (pathname === '/api/dashboard') return 'Fetch Dashboard Analytics';
  if (pathname === '/api/search-history') return 'Manage Search History';

  if (pathname === '/api/auth/login') return 'User Login Authentication';
  if (pathname === '/api/auth/register') return 'User Registration';
  if (pathname === '/api/auth/logout') return 'User Sign Out';
  if (pathname === '/api/auth/me') return 'Verify Active Session';

  return `${m} ${pathname}`;
}

let requestCounter = 1;

/**
 * Standard Next.js Route Handler wrapper providing live terminal query correlation
 */
export function withApiLogging(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  explicitAction?: string
) {
  return async (req: NextRequest, routeParams?: any) => {
    const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;

    // Skip verbose request banners for live query polling to avoid terminal flooding
    if (pathname.includes('/api/dbms/live-queries')) {
      return handler(req, routeParams);
    }

    const counterStr = String(requestCounter++).padStart(3, '0');
    const headerReqId = req.headers.get('x-request-id');
    const requestId = headerReqId || `req-${counterStr}`;
    const action = req.headers.get('x-action-name') || explicitAction || inferAction(req.method, pathname);

    const context: RequestContext = {
      requestId,
      action,
      path: pathname,
      method: req.method,
      startTime: performance.now(),
    };

    return requestContextStorage.run(context, async () => {
      logRequestStart(context);
      try {
        const response = await handler(req, routeParams);
        response.headers.set('x-request-id', requestId);
        response.headers.set('x-action-name', action);
        logRequestEnd(context, response.status);
        return response;
      } catch (err: any) {
        logRequestEnd(context, 500, `Internal Error: ${err.message}`);
        throw err;
      }
    });
  };
}

export default withApiLogging;

