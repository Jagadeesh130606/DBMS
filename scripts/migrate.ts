import { exec, query } from '../lib/db/postgres';

export async function runMigration() {
  console.log('[Migration] Applying schema updates for JOURNAL, CONFERENCE and relationships...');
  
  const migrationSql = `
    -- 1. Create JOURNAL table if not exists
    CREATE TABLE IF NOT EXISTS JOURNAL (
        journal_id SERIAL PRIMARY KEY,
        journal_name VARCHAR(255) NOT NULL UNIQUE,
        publisher VARCHAR(255) NOT NULL,
        issn VARCHAR(30) UNIQUE NOT NULL
    );

    -- 2. Create CONFERENCE table if not exists
    CREATE TABLE IF NOT EXISTS CONFERENCE (
        conference_id SERIAL PRIMARY KEY,
        conference_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL CHECK (year >= 1950 AND year <= 2100)
    );

    -- 3. Add source_type, journal_id, conference_id to RESEARCH_PAPER if not exists
    ALTER TABLE RESEARCH_PAPER ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'CONFERENCE' CHECK (source_type IN ('JOURNAL', 'CONFERENCE', 'PREPRINT'));
    ALTER TABLE RESEARCH_PAPER ADD COLUMN IF NOT EXISTS journal_id INTEGER REFERENCES JOURNAL(journal_id) ON DELETE SET NULL ON UPDATE CASCADE;
    ALTER TABLE RESEARCH_PAPER ADD COLUMN IF NOT EXISTS conference_id INTEGER REFERENCES CONFERENCE(conference_id) ON DELETE SET NULL ON UPDATE CASCADE;

    -- 4. Create indexes if not exists
    CREATE INDEX IF NOT EXISTS idx_paper_journal ON RESEARCH_PAPER(journal_id);
    CREATE INDEX IF NOT EXISTS idx_paper_conference ON RESEARCH_PAPER(conference_id);
    CREATE INDEX IF NOT EXISTS idx_paper_source_type ON RESEARCH_PAPER(source_type);

    -- 5. Recreate paper_details_view to incorporate Journal and Conference details
    DROP VIEW IF EXISTS paper_details_view;
    CREATE VIEW paper_details_view AS
    SELECT 
        rp.paper_id,
        rp.title,
        rp.abstract,
        rp.doi,
        rp.publication_date,
        rp.citation_count,
        rp.source,
        rp.source_type,
        rp.journal_id,
        rp.conference_id,
        j.journal_name,
        c.conference_name,
        rp.created_at,
        COALESCE(
            string_agg(DISTINCT a.name, ', ' ORDER BY a.name),
            'Unknown Author'
        ) AS authors,
        COALESCE(
            string_agg(DISTINCT ra.area_name, ', ' ORDER BY ra.area_name),
            'General Science'
        ) AS research_areas,
        COUNT(DISTINCT b.user_id) AS bookmark_count
    FROM RESEARCH_PAPER rp
    LEFT JOIN JOURNAL j ON rp.journal_id = j.journal_id
    LEFT JOIN CONFERENCE c ON rp.conference_id = c.conference_id
    LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
    LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
    LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
    LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
    LEFT JOIN BOOKMARK b ON rp.paper_id = b.paper_id
    GROUP BY 
        rp.paper_id, 
        rp.title, 
        rp.abstract, 
        rp.doi, 
        rp.publication_date, 
        rp.citation_count, 
        rp.source, 
        rp.source_type,
        rp.journal_id,
        rp.conference_id,
        j.journal_name,
        c.conference_name,
        rp.created_at;
    -- 6. Synchronize SERIAL sequences to current maximum values
    SELECT setval(pg_get_serial_sequence('RESEARCH_PAPER', 'paper_id'), COALESCE((SELECT MAX(paper_id) FROM RESEARCH_PAPER), 1));
    SELECT setval(pg_get_serial_sequence('AUTHORS', 'author_id'), COALESCE((SELECT MAX(author_id) FROM AUTHORS), 1));
    SELECT setval(pg_get_serial_sequence('RESEARCH_AREA', 'area_id'), COALESCE((SELECT MAX(area_id) FROM RESEARCH_AREA), 1));
    SELECT setval(pg_get_serial_sequence('JOURNAL', 'journal_id'), COALESCE((SELECT MAX(journal_id) FROM JOURNAL), 1));
    SELECT setval(pg_get_serial_sequence('CONFERENCE', 'conference_id'), COALESCE((SELECT MAX(conference_id) FROM CONFERENCE), 1));
    SELECT setval(pg_get_serial_sequence('USERS', 'user_id'), COALESCE((SELECT MAX(user_id) FROM USERS), 1));
    SELECT setval(pg_get_serial_sequence('SEARCH_HISTORY', 'search_id'), COALESCE((SELECT MAX(search_id) FROM SEARCH_HISTORY), 1));
  `;

  await exec(migrationSql);
  console.log('[Migration] Migration executed successfully.');
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]:', err);
      process.exit(1);
    });
}
