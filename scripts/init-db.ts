import fs from 'fs';
import path from 'path';
import { exec, getActiveEngine } from '../lib/db/postgres';
import { connectMongoDB } from '../lib/db/mongodb';
import PaperDocument from '../database/mongodb/models/PaperDocument';

async function executeSqlFile(filePath: string) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  const sql = fs.readFileSync(fullPath, 'utf8');
  console.log(`[DB Init] Executing ${path.basename(filePath)}...`);
  await exec(sql);
  console.log(`[DB Init] Successfully executed ${path.basename(filePath)}.`);
}

export async function initDatabases() {
  console.log('========================================================');
  console.log('INITIATING MULTI-MODEL DATABASE INITIALIZATION PIPELINE');
  console.log('========================================================');

  // 1. Initialize PostgreSQL Schema & Objects
  const engine = await getActiveEngine();
  console.log(`[PostgreSQL] Active execution engine: ${engine.toUpperCase()}`);

  await executeSqlFile('database/postgres/schema.sql');
  await executeSqlFile('database/postgres/views.sql');
  await executeSqlFile('database/postgres/functions.sql');
  await executeSqlFile('database/postgres/procedures.sql');
  await executeSqlFile('database/postgres/triggers.sql');
  await executeSqlFile('database/postgres/indexes.sql');

  // 2. Initialize MongoDB Collection and Indexes
  try {
    console.log('[MongoDB] Connecting to document store...');
    await connectMongoDB();
    await PaperDocument.createIndexes();
    console.log('[MongoDB] Verified paper_documents collection and indexes.');
  } catch (err: any) {
    console.warn('[MongoDB] MongoDB initialization notice:', err.message);
  }

  console.log('========================================================');
  console.log('DATABASE INITIALIZATION COMPLETED SUCCESSFULLY');
  console.log('========================================================');
}

if (require.main === module) {
  initDatabases()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[DB Init Error]:', err);
      process.exit(1);
    });
}
