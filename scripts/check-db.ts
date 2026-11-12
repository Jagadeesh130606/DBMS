import { query } from '../lib/db/postgres';
import { connectMongoDB } from '../lib/db/mongodb';
import mongoose from 'mongoose';

async function main() {
  try {
    const tables = ['USERS', 'AUTHORS', 'RESEARCH_PAPER', 'RESEARCH_AREA', 'JOURNAL', 'CONFERENCE', 'PAPER_AUTHOR', 'PAPER_AREA', 'BOOKMARK', 'SEARCH_HISTORY', 'CITATION', 'PAPER_EMBEDDINGS'];
    console.log('PostgreSQL Table Counts:');
    for (const t of tables) {
      const res = await query(`SELECT count(*) FROM ${t}`);
      console.log(`  Table ${t}: ${res.rows[0].count}`);
    }

    const viewRes = await query('SELECT count(*) FROM paper_details_view');
    console.log(`  View paper_details_view: ${viewRes.rows[0].count}`);

    await connectMongoDB();
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nMongoDB Collections:');
    for (const c of collections) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log(`  Collection ${c.name}: ${count}`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
main();
