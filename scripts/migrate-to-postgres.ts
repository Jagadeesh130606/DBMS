import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function migratePgLiteToPostgres() {
  console.log('========================================================================');
  console.log('DATA MIGRATION UTILITY: PGLITE -> REAL POSTGRESQL SERVER');
  console.log('========================================================================');

  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.PG_USER || 'postgres'}:${process.env.PG_PASSWORD || 'postgrespassword'}@${process.env.PG_HOST || '127.0.0.1'}:${process.env.PG_PORT || '5432'}/${process.env.PG_DATABASE || 'research_paper_db'}`;

  const pgPool = new Pool({
    connectionString,
    connectionTimeoutMillis: 3000,
  });

  try {
    await pgPool.query('SELECT 1');
    console.log('[PostgreSQL] Connected to target server:', connectionString.replace(/:[^:]*@/, ':****@'));
  } catch (err: any) {
    console.error('[Error] Unable to connect to real PostgreSQL Server at:', connectionString);
    console.error('Details:', err.message);
    console.log('\nPlease verify that PostgreSQL Server is running on port 5432.');
    console.log('The application will continue safely using embedded PGlite in the meantime.');
    process.exit(1);
  }

  // Initialize PGlite source
  const { PGlite } = await import('@electric-sql/pglite');
  const { vector } = await import('@electric-sql/pglite/vector');
  const dataDir = path.resolve(process.cwd(), '.pglite-data');

  if (!fs.existsSync(dataDir)) {
    console.error('[Error] Source PGlite directory .pglite-data does not exist!');
    process.exit(1);
  }

  const pglite = new PGlite(dataDir, { extensions: { vector } });
  await pglite.waitReady;
  console.log('[PGlite] Connected to source embedded database in:', dataDir);

  // 1. Run DDL on real PostgreSQL
  console.log('\n--- 1. APPLYING DDL SCHEMAS ON REAL POSTGRESQL ---');
  try {
    await pgPool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('  [OK] pgvector extension enabled');
  } catch (e: any) {
    console.warn('  [WARN] pgvector extension warning:', e.message);
  }

  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'database/postgres/schema.sql'), 'utf-8');
  await pgPool.query(schemaSql);
  console.log('  [OK] Relational tables instantiated');

  const viewsSql = fs.readFileSync(path.join(process.cwd(), 'database/postgres/views.sql'), 'utf-8');
  await pgPool.query(viewsSql);
  console.log('  [OK] Database views instantiated');

  const funcsSql = fs.readFileSync(path.join(process.cwd(), 'database/postgres/functions.sql'), 'utf-8');
  await pgPool.query(funcsSql);
  console.log('  [OK] Stored functions instantiated');

  const trigsSql = fs.readFileSync(path.join(process.cwd(), 'database/postgres/triggers.sql'), 'utf-8');
  await pgPool.query(trigsSql);
  console.log('  [OK] Triggers instantiated');

  const idxSql = fs.readFileSync(path.join(process.cwd(), 'database/postgres/indexes.sql'), 'utf-8');
  await pgPool.query(idxSql);
  console.log('  [OK] GIN and HNSW Indexes instantiated');

  // 2. Migrate Tables in Referential Order
  console.log('\n--- 2. COPYING DATA RECORDS (PRESERVING IDENTIFIERS) ---');
  const tables = [
    'USERS',
    'AUTHORS',
    'RESEARCH_AREA',
    'JOURNAL',
    'CONFERENCE',
    'RESEARCH_PAPER',
    'PAPER_AUTHOR',
    'PAPER_AREA',
    'BOOKMARK',
    'SEARCH_HISTORY',
    'CITATION',
    'PAPER_EMBEDDINGS',
  ];

  for (const table of tables) {
    const srcRes = await pglite.query(`SELECT * FROM ${table};`);
    const rows = srcRes.rows || [];
    console.log(`  Migrating ${table.padEnd(18)} (${rows.length} rows)...`);

    if (rows.length === 0) continue;

    for (const row of rows) {
      const keys = Object.keys(row);
      const values = keys.map((k) => {
        const val = row[k];
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'number') {
          return `[${val.join(',')}]`;
        }
        return val;
      });

      const cols = keys.map((k) => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const insertSql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
      await pgPool.query(insertSql, values);
    }
  }

  // 3. Synchronize serial sequences
  console.log('\n--- 3. SYNCHRONIZING SERIAL SEQUENCES ---');
  const serialSyncs = [
    { table: 'USERS', pk: 'user_id', seq: 'users_user_id_seq' },
    { table: 'AUTHORS', pk: 'author_id', seq: 'authors_author_id_seq' },
    { table: 'RESEARCH_AREA', pk: 'area_id', seq: 'research_area_area_id_seq' },
    { table: 'JOURNAL', pk: 'journal_id', seq: 'journal_journal_id_seq' },
    { table: 'CONFERENCE', pk: 'conference_id', seq: 'conference_conference_id_seq' },
    { table: 'RESEARCH_PAPER', pk: 'paper_id', seq: 'research_paper_paper_id_seq' },
    { table: 'SEARCH_HISTORY', pk: 'search_id', seq: 'search_history_search_id_seq' },
  ];

  for (const s of serialSyncs) {
    try {
      await pgPool.query(`
        SELECT setval('${s.seq}', COALESCE((SELECT MAX(${s.pk}) FROM ${s.table}), 1));
      `);
      console.log(`  [OK] Synchronized sequence ${s.seq}`);
    } catch (err: any) {
      // Ignored if sequence doesn't exist
    }
  }

  // 4. Parity Verification
  console.log('\n--- 4. PARITY VERIFICATION ---');
  let allMatched = true;
  for (const table of tables) {
    const src = await pglite.query(`SELECT COUNT(*) AS c FROM ${table};`);
    const dst = await pgPool.query(`SELECT COUNT(*) AS c FROM ${table};`);
    const sCount = parseInt(src.rows[0].c, 10);
    const dCount = parseInt(dst.rows[0].c, 10);

    const match = sCount === dCount;
    if (!match) allMatched = false;
    console.log(`  Table ${table.padEnd(18)}: PGlite=${sCount} | PostgreSQL=${dCount} -> ${match ? '[MATCH]' : '[MISMATCH]'}`);
  }

  console.log('\n========================================================================');
  if (allMatched) {
    console.log('SUCCESS: Full database migration verified with 100% parity!');
    console.log('You can now set POSTGRES_MODE=pg in .env to use real PostgreSQL Server.');
  } else {
    console.warn('WARNING: Some table counts did not match perfectly. Please review logs above.');
  }
  console.log('========================================================================');

  await pgPool.end();
  process.exit(0);
}

migratePgLiteToPostgres().catch((err) => {
  console.error('[Migration Error]:', err);
  process.exit(1);
});

