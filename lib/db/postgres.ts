import { Pool, PoolClient } from 'pg';
import path from 'path';
import fs from 'fs';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields?: any[];
}

export interface TransactionClient {
  query: <T = any>(text: string, params?: any[]) => Promise<QueryResult<T>>;
  savepoint?: (name: string) => Promise<void>;
  rollbackTo?: (name: string) => Promise<void>;
  releaseSavepoint?: (name: string) => Promise<void>;
}

let pgPool: Pool | null = null;
let pgliteInstance: any = null;
let activeEngine: 'pg' | 'pglite' | null = null;

const POSTGRES_MODE = process.env.POSTGRES_MODE || 'auto';

async function initEngine(): Promise<'pg' | 'pglite'> {
  if (activeEngine) return activeEngine;

  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.PG_USER || 'postgres'}:${process.env.PG_PASSWORD || 'postgrespassword'}@${process.env.PG_HOST || '127.0.0.1'}:${process.env.PG_PORT || '5432'}/${process.env.PG_DATABASE || 'research_paper_db'}`;

  if (POSTGRES_MODE === 'pg') {
    pgPool = new Pool({ connectionString, connectionTimeoutMillis: 3000 });
    await pgPool.query('SELECT 1');
    activeEngine = 'pg';
    console.log('[PostgreSQL] Connected via node-postgres (pg Pool)');
    return activeEngine;
  }

  if (POSTGRES_MODE === 'pglite') {
    activeEngine = 'pglite';
    await initPglite();
    return activeEngine;
  }

  // 'auto' mode
  try {
    const testPool = new Pool({ connectionString, connectionTimeoutMillis: 1500 });
    await testPool.query('SELECT 1');
    pgPool = testPool;
    activeEngine = 'pg';
    console.log('[PostgreSQL] Connected via node-postgres (pg Pool)');
    return activeEngine;
  } catch (err: any) {
    console.warn('[PostgreSQL] External server unreachable (' + err.message + '). Falling back to embedded PGlite + vector extension.');
    activeEngine = 'pglite';
    await initPglite();
    return activeEngine;
  }
}

async function initPglite() {
  if (pgliteInstance) return pgliteInstance;

  try {
    const { PGlite } = await import('@electric-sql/pglite');
    const { vector } = await import('@electric-sql/pglite/vector');

    const dataDir = path.resolve(process.cwd(), '.pglite-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    pgliteInstance = new PGlite(dataDir, {
      extensions: { vector },
    });

    await pgliteInstance.waitReady;
    console.log('[PostgreSQL] Embedded PGlite initialized with pgvector in:', dataDir);
    return pgliteInstance;
  } catch (err: any) {
    console.error('[PostgreSQL] Failed to initialize PGlite:', err);
    throw err;
  }
}

/**
 * Execute multiple SQL statements / scripts (DDL, migrations, schema files)
 */
export async function exec(sql: string): Promise<any> {
  const engine = await initEngine();

  if (engine === 'pg' && pgPool) {
    return await pgPool.query(sql);
  } else {
    const pglite = await initPglite();
    return await pglite.exec(sql);
  }
}

/**
 * Execute a parameterized SQL query on PostgreSQL (pg or pglite)
 */
export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const engine = await initEngine();

  // If no params are passed and multiple statements might be present, use exec
  if ((!params || params.length === 0) && text.trim().includes(';')) {
    const statements = text.split(';').map(s => s.trim()).filter(Boolean);
    if (statements.length > 1) {
      await exec(text);
      return { rows: [], rowCount: 0 };
    }
  }

  // Normalize parameters (e.g. number[] vectors converted to '[0.1,0.2,...]' string format for pgvector)
  const normalizedParams = params?.map((p) => {
    if (Array.isArray(p) && p.length > 0 && typeof p[0] === 'number') {
      return `[${p.join(',')}]`;
    }
    return p;
  });

  if (engine === 'pg' && pgPool) {
    const result = await pgPool.query(text, normalizedParams);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows.length,
      fields: result.fields,
    };
  } else {
    const pglite = await initPglite();
    const result = await pglite.query(text, normalizedParams);
    return {
      rows: (result.rows || []) as T[],
      rowCount: result.affectedRows ?? result.rows?.length ?? 0,
      fields: result.fields,
    };
  }
}

/**
 * Execute an atomic database transaction with support for BEGIN, COMMIT, ROLLBACK, and SAVEPOINT
 */
export async function transaction<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T> {
  const engine = await initEngine();

  if (engine === 'pg' && pgPool) {
    const client: PoolClient = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const txClient: TransactionClient = {
        query: async (text: string, params?: any[]) => {
          const res = await client.query(text, params);
          return {
            rows: res.rows,
            rowCount: res.rowCount ?? res.rows.length,
            fields: res.fields,
          };
        },
        savepoint: async (name: string) => {
          await client.query(`SAVEPOINT ${name}`);
        },
        rollbackTo: async (name: string) => {
          await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
        },
        releaseSavepoint: async (name: string) => {
          await client.query(`RELEASE SAVEPOINT ${name}`);
        },
      };

      const result = await callback(txClient);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    const pglite = await initPglite();
    return await pglite.transaction(async (tx: any) => {
      const txClient: TransactionClient = {
        query: async (text: string, params?: any[]) => {
          const res = await tx.query(text, params);
          return {
            rows: res.rows || [],
            rowCount: res.affectedRows ?? res.rows?.length ?? 0,
            fields: res.fields,
          };
        },
        savepoint: async (name: string) => {
          await tx.query(`SAVEPOINT ${name}`);
        },
        rollbackTo: async (name: string) => {
          await tx.query(`ROLLBACK TO SAVEPOINT ${name}`);
        },
        releaseSavepoint: async (name: string) => {
          await tx.query(`RELEASE SAVEPOINT ${name}`);
        },
      };

      return await callback(txClient);
    });
  }
}

export async function getActiveEngine(): Promise<'pg' | 'pglite'> {
  return await initEngine();
}

export default {
  query,
  exec,
  transaction,
  getActiveEngine,
};
