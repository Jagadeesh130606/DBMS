import { AsyncLocalStorage } from 'async_hooks';

export interface SemanticSearchContext {
  originalQuery: string;
  dimension: number;
  embeddingPreview: number[]; // first 5 values only
}

export interface RequestContext {
  requestId: string;
  action: string;
  path: string;
  method: string;
  startTime: number;
  semanticContext?: SemanticSearchContext;
}

export interface LiveQueryEvent {
  id: string;
  timestamp: string;
  dbType: 'PostgreSQL' | 'MongoDB';
  operation: string;
  target: string; // table or collection name
  query: string;
  parameters?: Record<string, any> | any[];
  status: 'SUCCESS' | 'ERROR';
  error?: string;
  rowCount?: number;
  executionTimeMs: number;
  requestId?: string;
  action?: string;
  semanticContext?: SemanticSearchContext;
}

// Global AsyncLocalStorage so all database operations can access the active request context
declare global {
  // eslint-disable-next-line no-var
  var __requestContextStorage: AsyncLocalStorage<RequestContext> | undefined;
  // eslint-disable-next-line no-var
  var __liveQueryRingBuffer: LiveQueryEvent[] | undefined;
}

export const requestContextStorage =
  global.__requestContextStorage || (global.__requestContextStorage = new AsyncLocalStorage<RequestContext>());

const MAX_BUFFER_SIZE = 150;
const ringBuffer: LiveQueryEvent[] =
  global.__liveQueryRingBuffer || (global.__liveQueryRingBuffer = []);

// ANSI Colors for PowerShell terminal output
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const RED = '\x1b[31m';
const GRAY = '\x1b[90m';

function getTimestamp(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:MM:SS
}

function generateEventId(): string {
  return 'evt-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Intelligent SQL operation & table name extractor
 */
export function parseSqlInfo(sql: string): { operation: string; table: string } {
  const cleanSql = sql.trim().replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '').trim();
  const firstWord = cleanSql.split(/\s+/)[0]?.toUpperCase() || 'QUERY';

  let operation = firstWord;
  let table = 'UNKNOWN';

  if (firstWord === 'WITH') {
    operation = 'CTE';
    // look for main query
    const match = cleanSql.match(/(?:FROM|INTO|UPDATE)\s+(?:ONLY\s+)?([a-zA-Z0-9_]+)/i);
    if (match) table = match[1].toUpperCase();
  } else if (firstWord === 'SELECT') {
    const fromMatch = cleanSql.match(/\bFROM\s+(?:ONLY\s+)?([a-zA-Z0-9_]+)/i);
    if (fromMatch) table = fromMatch[1].toUpperCase();
  } else if (firstWord === 'INSERT') {
    const intoMatch = cleanSql.match(/\bINTO\s+([a-zA-Z0-9_]+)/i);
    if (intoMatch) table = intoMatch[1].toUpperCase();
  } else if (firstWord === 'UPDATE') {
    const updateMatch = cleanSql.match(/\bUPDATE\s+(?:ONLY\s+)?([a-zA-Z0-9_]+)/i);
    if (updateMatch) table = updateMatch[1].toUpperCase();
  } else if (firstWord === 'DELETE') {
    const deleteMatch = cleanSql.match(/\bFROM\s+([a-zA-Z0-9_]+)/i);
    if (deleteMatch) table = deleteMatch[1].toUpperCase();
  } else if (firstWord === 'CREATE') {
    operation = 'DDL (CREATE)';
    const createMatch = cleanSql.match(/\bCREATE\s+(?:TABLE|VIEW|INDEX|OR\s+REPLACE\s+VIEW|TRIGGER|FUNCTION|PROCEDURE)?\s*(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
    if (createMatch) table = createMatch[1].toUpperCase();
  }

  return { operation, table };
}

/**
 * Mask sensitive parameters (passwords, auth tokens, hashes)
 * and shorten high-dimensional vectors to first 5 values only
 */
export function maskSensitiveParams(params?: any[]): any[] | undefined {
  if (!params || params.length === 0) return params;

  return params.map((val) => {
    if (typeof val === 'string') {
      // bcrypt hash check ($2a$10$... or $2b$10$...)
      if (/^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(val)) {
        return '[PROTECTED_BCRYPT_HASH]';
      }
      // JWT token check
      if (/^eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(val)) {
        return '[PROTECTED_JWT_TOKEN]';
      }
      // Vector array string check - shorten to first 5 values only
      if (val.startsWith('[') && val.endsWith(']') && val.length > 50) {
        const inner = val.slice(1, -1);
        const parts = inner
          .split(',')
          .slice(0, 5)
          .map((s) => {
            const num = parseFloat(s.trim());
            return isNaN(num) ? s.trim() : Number(num.toFixed(4));
          });
        return `[384-D Vector preview: [${parts.join(', ')}, ...]]`;
      }
    }
    if (Array.isArray(val) && val.length > 5 && typeof val[0] === 'number') {
      const parts = val.slice(0, 5).map((v) => Number(v.toFixed(4)));
      return `[384-D Vector preview: [${parts.join(', ')}, ...]]`;
    }
    return val;
  });
}

/**
 * Associate semantic search context (original search input, dimension, preview)
 * with the active request ID in AsyncLocalStorage
 */
export function setSemanticContext(ctx: {
  originalQuery: string;
  dimension?: number;
  vector: number[] | Float32Array;
}) {
  const store = requestContextStorage.getStore();
  if (store) {
    const arr = Array.from(ctx.vector);
    const first5 = arr.slice(0, 5).map((n) => Number(n.toFixed(4)));
    store.semanticContext = {
      originalQuery: ctx.originalQuery,
      dimension: ctx.dimension || arr.length || 384,
      embeddingPreview: first5,
    };
  }
}

/**
 * Log when an API request begins
 */
export function logRequestStart(context: RequestContext) {
  const time = getTimestamp();
  console.log(
    `\n${CYAN}${BOLD}================================================================================${RESET}`
  );
  console.log(
    `${CYAN}${BOLD}REQUEST STARTED${RESET}  |  ${YELLOW}${BOLD}ID:${RESET} ${context.requestId}  |  ${GREEN}${BOLD}ACTION:${RESET} ${context.action}`
  );
  console.log(
    `${GRAY}Endpoint:${RESET} ${BOLD}${context.method} ${context.path}${RESET}  |  ${GRAY}Time:${RESET} ${time}`
  );
  console.log(
    `${CYAN}--------------------------------------------------------------------------------${RESET}`
  );
}

/**
 * Log when an API request completes
 */
export function logRequestEnd(context: RequestContext, statusCode: number, summary?: string) {
  const duration = (performance.now() - context.startTime).toFixed(1);
  const statusColor = statusCode >= 400 ? RED : GREEN;
  console.log(
    `${CYAN}--------------------------------------------------------------------------------${RESET}`
  );
  console.log(
    `${statusColor}${BOLD}[REQUEST FINISHED]${RESET} ${statusColor}${statusCode}${RESET}  |  ${GRAY}Total Duration:${RESET} ${duration} ms  |  ${YELLOW}ID:${RESET} ${context.requestId}`
  );
  if (summary) {
    console.log(`${GRAY}Summary:${RESET} ${summary}`);
  }
  console.log(
    `${CYAN}${BOLD}================================================================================${RESET}\n`
  );
}

export interface PostgresLogInput {
  query: string;
  params?: any[];
  rowCount?: number;
  executionTimeMs: number;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
  isTransaction?: boolean;
}

/**
 * Centralized PostgreSQL Query Logger (Prints to PowerShell & Buffer)
 */
export function logPostgresQuery(input: PostgresLogInput) {
  const context = requestContextStorage.getStore();
  const time = getTimestamp();
  const { operation, table } = parseSqlInfo(input.query);
  const maskedParams = maskSensitiveParams(input.params);
  const duration = input.executionTimeMs.toFixed(2);

  const event: LiveQueryEvent = {
    id: generateEventId(),
    timestamp: time,
    dbType: 'PostgreSQL',
    operation,
    target: table,
    query: input.query.trim(),
    parameters: maskedParams,
    status: input.status,
    error: input.error,
    rowCount: input.rowCount,
    executionTimeMs: Number(duration),
    requestId: context?.requestId,
    action: context?.action,
    semanticContext: context?.semanticContext,
  };

  ringBuffer.unshift(event);
  if (ringBuffer.length > MAX_BUFFER_SIZE) {
    ringBuffer.pop();
  }

  // --- Output directly to PowerShell Terminal ---
  console.log(
    `\n${CYAN}================================================================================${RESET}`
  );
  if (context?.semanticContext) {
    console.log(`${CYAN}${BOLD}POSTGRESQL QUERY EXECUTED [SEMANTIC VECTOR SEARCH]${RESET}`);
  } else {
    console.log(`${CYAN}${BOLD}POSTGRESQL QUERY EXECUTED${RESET}${input.isTransaction ? ` ${YELLOW}[TRANSACTION]${RESET}` : ''}`);
  }
  console.log(`${CYAN}================================================================================${RESET}`);
  console.log(`${GRAY}Time:${RESET}           ${time}`);
  if (context) {
    console.log(`${GRAY}Request ID:${RESET}     ${YELLOW}${BOLD}${context.requestId}${RESET}  (${GREEN}${context.action}${RESET})`);
    console.log(`${GRAY}API Endpoint:${RESET}   ${context.method} ${context.path}`);
  }
  console.log(`${GRAY}Operation:${RESET}      ${BOLD}${CYAN}${operation}${RESET}`);
  console.log(`${GRAY}Table:${RESET}          ${BOLD}${table}${RESET}`);
  if (context?.semanticContext) {
    console.log(`${MAGENTA}${BOLD}Semantic Vector Context:${RESET}`);
    console.log(`  ${GRAY}Original User Input:${RESET}  "${CYAN}${BOLD}${context.semanticContext.originalQuery}${RESET}"`);
    console.log(`  ${GRAY}Embedding Dimension:${RESET}  ${BOLD}${context.semanticContext.dimension}${RESET}`);
    console.log(`  ${GRAY}Embedding Preview:${RESET}    [${context.semanticContext.embeddingPreview.join(', ')}, ...]`);
  }
  console.log(`${GRAY}Query:${RESET}`);
  console.log(`${BOLD}${input.query.trim()}${RESET}`);

  if (maskedParams && maskedParams.length > 0) {
    console.log(`${GRAY}Parameters:${RESET}`);
    maskedParams.forEach((p, idx) => {
      const valStr = typeof p === 'object' && p !== null ? JSON.stringify(p) : String(p);
      console.log(`  ${YELLOW}$${idx + 1}${RESET} = ${GRAY}'${RESET}${valStr}${GRAY}'${RESET}`);
    });
  }

  if (input.status === 'SUCCESS') {
    const rowLabel = operation === 'SELECT' ? 'Rows returned' : 'Rows affected';
    console.log(`${GRAY}Status:${RESET}         ${GREEN}${BOLD}SUCCESS${RESET}`);
    console.log(`${GRAY}${rowLabel}:${RESET}  ${BOLD}${input.rowCount ?? 0}${RESET}`);
  } else {
    console.log(`${GRAY}Status:${RESET}         ${RED}${BOLD}ERROR${RESET} (${input.error})`);
  }

  console.log(`${GRAY}Execution time:${RESET} ${BOLD}${duration} ms${RESET}`);
  console.log(
    `${CYAN}================================================================================${RESET}`
  );
}

export interface MongoLogInput {
  collection: string;
  operation: string;
  filter?: any;
  update?: any;
  pipeline?: any[];
  documentId?: string | number;
  details?: Record<string, any>;
  rowCount?: number;
  executionTimeMs: number;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
}

/**
 * Centralized MongoDB Operation Logger (Prints to PowerShell & Buffer)
 */
export function logMongoQuery(input: MongoLogInput) {
  const context = requestContextStorage.getStore();
  const time = getTimestamp();
  const duration = input.executionTimeMs.toFixed(2);

  let queryRep = '';
  if (input.pipeline) {
    queryRep = `Pipeline: ${JSON.stringify(input.pipeline, null, 2)}`;
  } else if (input.filter) {
    queryRep = `Filter: ${JSON.stringify(input.filter)}`;
    if (input.update) queryRep += ` | Update: ${JSON.stringify(input.update)}`;
  } else if (input.details) {
    queryRep = `Data: ${JSON.stringify(input.details)}`;
  }

  const event: LiveQueryEvent = {
    id: generateEventId(),
    timestamp: time,
    dbType: 'MongoDB',
    operation: input.operation,
    target: input.collection,
    query: queryRep || `${input.operation} on ${input.collection}`,
    parameters: input.filter || input.details,
    status: input.status,
    error: input.error,
    rowCount: input.rowCount,
    executionTimeMs: Number(duration),
    requestId: context?.requestId,
    action: context?.action,
  };

  ringBuffer.unshift(event);
  if (ringBuffer.length > MAX_BUFFER_SIZE) {
    ringBuffer.pop();
  }

  // --- Output directly to PowerShell Terminal ---
  console.log(
    `\n${GREEN}================================================================================${RESET}`
  );
  console.log(`${GREEN}${BOLD}MONGODB OPERATION EXECUTED${RESET}`);
  console.log(`${GREEN}================================================================================${RESET}`);
  console.log(`${GRAY}Time:${RESET}           ${time}`);
  if (context) {
    console.log(`${GRAY}Request ID:${RESET}     ${YELLOW}${BOLD}${context.requestId}${RESET}  (${GREEN}${context.action}${RESET})`);
    console.log(`${GRAY}API Endpoint:${RESET}   ${context.method} ${context.path}`);
  }
  console.log(`${GRAY}Database:${RESET}       ${BOLD}research_paper_db${RESET}`);
  console.log(`${GRAY}Collection:${RESET}     ${BOLD}${GREEN}${input.collection}${RESET}`);
  console.log(`${GRAY}Operation:${RESET}      ${BOLD}${input.operation}${RESET}`);

  if (input.documentId !== undefined) {
    console.log(`${GRAY}Document ID:${RESET}    ${BOLD}${input.documentId}${RESET}`);
  }

  if (input.filter && Object.keys(input.filter).length > 0) {
    console.log(`${GRAY}Filter:${RESET}         ${JSON.stringify(input.filter)}`);
  }

  if (input.update) {
    console.log(`${GRAY}Update:${RESET}         ${JSON.stringify(input.update)}`);
  }

  if (input.pipeline) {
    console.log(`${GRAY}Pipeline Stages (${input.pipeline.length}):${RESET}`);
    input.pipeline.forEach((stage, idx) => {
      console.log(`  ${GRAY}[Stage ${idx + 1}]${RESET} ${JSON.stringify(stage)}`);
    });
  }

  if (input.details) {
    console.log(`${GRAY}Details:${RESET}        ${JSON.stringify(input.details)}`);
  }

  if (input.status === 'SUCCESS') {
    console.log(`${GRAY}Status:${RESET}         ${GREEN}${BOLD}SUCCESS${RESET}`);
    if (input.rowCount !== undefined) {
      console.log(`${GRAY}Count/Matches:${RESET}  ${BOLD}${input.rowCount}${RESET}`);
    }
  } else {
    console.log(`${GRAY}Status:${RESET}         ${RED}${BOLD}ERROR${RESET} (${input.error})`);
  }

  console.log(`${GRAY}Execution time:${RESET} ${BOLD}${duration} ms${RESET}`);
  console.log(
    `${GREEN}================================================================================${RESET}`
  );
}

/**
 * Retrieve recent database queries for the Live UI Monitor
 */
export function getLiveQueryHistory(limit = 50, dbFilter?: 'all' | 'PostgreSQL' | 'MongoDB'): LiveQueryEvent[] {
  let list = ringBuffer;
  if (dbFilter && dbFilter !== 'all') {
    list = list.filter((e) => e.dbType === dbFilter);
  }
  return list.slice(0, limit);
}

/**
 * Clear ring buffer
 */
export function clearLiveQueryHistory() {
  ringBuffer.length = 0;
}

