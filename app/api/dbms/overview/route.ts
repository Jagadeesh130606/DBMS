import { NextRequest, NextResponse } from 'next/server';
import { query, getActiveEngine } from '@/lib/db/postgres';
import { connectMongoDB } from '@/lib/db/mongodb';
import PaperDocument from '@/database/mongodb/models/PaperDocument';
import AuthorDocument from '@/database/mongodb/models/AuthorDocument';
import ResearchAreaDocument from '@/database/mongodb/models/ResearchAreaDocument';
import CitationDocument from '@/database/mongodb/models/CitationDocument';

export async function GET(req: NextRequest) {
  try {
    const activeEngine = await getActiveEngine();

    // 1. PostgreSQL Tables and Row Counts
    const pgTables = [
      { name: 'USERS', desc: 'System users, passwords (bcrypt), and roles (ADMIN, STUDENT)', pk: 'user_id' },
      { name: 'AUTHORS', desc: 'Researcher profiles, academic affiliations, contact emails', pk: 'author_id' },
      { name: 'RESEARCH_PAPER', desc: 'Core bibliographic metadata, titles, abstracts, DOIs, citation counts', pk: 'paper_id' },
      { name: 'RESEARCH_AREA', desc: 'Controlled taxonomy of 9 computer science academic disciplines', pk: 'area_id' },
      { name: 'JOURNAL', desc: 'Academic publishing journals, publishers, and official ISSN numbers', pk: 'journal_id' },
      { name: 'CONFERENCE', desc: 'Conference proceedings, editions, locations, and presentation years', pk: 'conference_id' },
      { name: 'PAPER_AUTHOR', desc: 'M:N junction table mapping Papers to Authors with author sequence ordering', pk: '(paper_id, author_id)' },
      { name: 'PAPER_AREA', desc: 'M:N junction table categorizing Papers into Research Areas', pk: '(paper_id, area_id)' },
      { name: 'BOOKMARK', desc: '1:N user curated research paper library and recommendation seeds', pk: '(user_id, paper_id)' },
      { name: 'SEARCH_HISTORY', desc: 'Audit log of user queries across Keyword, Semantic, and Hybrid search', pk: 'search_id' },
      { name: 'CITATION', desc: 'Directed acyclic graph edges linking citing papers to cited papers', pk: '(citing_paper_id, cited_paper_id)' },
      { name: 'PAPER_EMBEDDINGS', desc: 'pgvector 384-dimensional dense vectors with HNSW cosine distance index', pk: 'embedding_id' },
    ];

    const tablesData = [];
    for (const t of pgTables) {
      const res = await query(`SELECT COUNT(*) AS count FROM ${t.name};`);
      tablesData.push({
        ...t,
        rowCount: parseInt(res.rows[0]?.count || '0', 10),
      });
    }

    // 2. MongoDB Collections
    await connectMongoDB();
    const [pDocs, aDocs, raDocs, cDocs] = await Promise.all([
      PaperDocument.countDocuments(),
      AuthorDocument.countDocuments(),
      ResearchAreaDocument.countDocuments(),
      CitationDocument.countDocuments(),
    ]);

    const mongoCollections = [
      {
        name: 'paper_documents',
        docCount: pDocs,
        desc: 'Unstructured narrative bodies, multi-level sections (Intro, Method, Results, Conclusion), references array, and keywords.',
        keyField: 'paper_id (Matches PostgreSQL RESEARCH_PAPER)',
        indexes: ['paper_id (unique)', 'keywords (multikey)', 'full_text (text)', 'references.year'],
      },
      {
        name: 'author_documents',
        docCount: aDocs,
        desc: 'Rich researcher biographies, multi-discipline research interests, co-author linkages, and citation impact metrics (h-index).',
        keyField: 'author_id (Matches PostgreSQL AUTHORS)',
        indexes: ['author_id (unique)', 'research_interests', 'metrics.total_citations', 'name (text)'],
      },
      {
        name: 'research_area_documents',
        docCount: raDocs,
        desc: 'Subject overviews, sub-topic taxonomies, emerging technological trends, and top international conference/journal venues.',
        keyField: 'area_id (Matches PostgreSQL RESEARCH_AREA)',
        indexes: ['area_id (unique)', 'area_name (unique)', 'sub_topics'],
      },
      {
        name: 'citation_documents',
        docCount: cDocs,
        desc: 'Graph contextual metadata, citing and cited paper lists with contextual sentences, and second-degree influence metrics.',
        keyField: 'paper_id (Matches PostgreSQL RESEARCH_PAPER)',
        indexes: ['paper_id (unique)', 'incoming_citation_count', 'citing_papers.paper_id'],
      },
    ];

    return NextResponse.json({
      engine: activeEngine.toUpperCase(),
      tables: tablesData,
      collections: mongoCollections,
      totalPostgresRecords: tablesData.reduce((acc, t) => acc + t.rowCount, 0),
      totalMongoDocuments: pDocs + aDocs + raDocs + cDocs,
    });
  } catch (err: any) {
    console.error('[API DBMS Overview Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
