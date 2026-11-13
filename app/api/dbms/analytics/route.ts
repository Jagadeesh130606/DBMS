import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { connectMongoDB } from '@/lib/db/mongodb';
import PaperDocument from '@/database/mongodb/models/PaperDocument';
import { withApiLogging } from '@/lib/api-handler';

async function handleGet(req: NextRequest) {
  try {
    // -------------------------------------------------------------
    // PART A: MONGODB AGGREGATION PIPELINES
    // -------------------------------------------------------------
    await connectMongoDB();

    // 1. Group papers by document type
    const docTypesAgg = await PaperDocument.aggregate([
      {
        $group: {
          _id: '$metadata.document_type',
          count: { $sum: 1 },
          avgPageCount: { $avg: '$metadata.page_count' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 2. Group papers by keywords (Unwind + Group + Sort)
    const keywordsAgg = await PaperDocument.aggregate([
      { $unwind: '$keywords' },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // 3. Analyze reference publication distribution by year
    const referenceYearsAgg = await PaperDocument.aggregate([
      { $unwind: '$references' },
      {
        $group: {
          _id: '$references.year',
          totalReferences: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 4. Section structure analysis
    const sectionStatsAgg = await PaperDocument.aggregate([
      {
        $project: {
          paper_id: 1,
          section_count: { $size: '$sections' },
          reference_count: { $size: '$references' },
        },
      },
      {
        $group: {
          _id: null,
          avgSectionsPerPaper: { $avg: '$section_count' },
          avgReferencesPerPaper: { $avg: '$reference_count' },
          totalDocumentsAnalyzed: { $sum: 1 },
        },
      },
    ]);

    // -------------------------------------------------------------
    // PART B: POSTGRESQL RELATIONAL ANALYTICS
    // -------------------------------------------------------------
    // 1. Citations and paper distribution per research area
    const areaDistribution = await query(`
      SELECT 
        ra.area_name,
        COUNT(par.paper_id) AS paper_count,
        COALESCE(SUM(rp.citation_count), 0) AS total_citations,
        ROUND(COALESCE(AVG(rp.citation_count), 0), 2) AS avg_citations
      FROM RESEARCH_AREA ra
      LEFT JOIN PAPER_AREA par ON ra.area_id = par.area_id
      LEFT JOIN RESEARCH_PAPER rp ON par.paper_id = rp.paper_id
      GROUP BY ra.area_name
      ORDER BY total_citations DESC;
    `);

    // 2. Search history distribution by search type
    const searchTypeDistribution = await query(`
      SELECT 
        search_type,
        COUNT(*) AS total_queries,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM SEARCH_HISTORY), 1) AS percentage
      FROM SEARCH_HISTORY
      GROUP BY search_type
      ORDER BY total_queries DESC;
    `);

    // 3. Citation graph indegree/outdegree top papers
    const citationMetrics = await query(`
      SELECT 
        rp.paper_id,
        rp.title,
        rp.citation_count AS citations_received,
        (SELECT COUNT(*) FROM CITATION c WHERE c.citing_paper_id = rp.paper_id) AS references_cited
      FROM RESEARCH_PAPER rp
      ORDER BY citations_received DESC
      LIMIT 8;
    `);

    return NextResponse.json({
      mongodb: {
        documentTypes: docTypesAgg.map((d) => ({
          documentType: d._id || 'Standard Article',
          count: d.count,
          avgPages: Math.round(d.avgPageCount || 10),
        })),
        topKeywords: keywordsAgg.map((k) => ({
          keyword: k._id,
          occurrences: k.count,
        })),
        referenceYears: referenceYearsAgg.map((r) => ({
          year: r._id,
          citations: r.totalReferences,
        })),
        documentSummary: sectionStatsAgg[0] || {
          avgSectionsPerPaper: 4,
          avgReferencesPerPaper: 4,
          totalDocumentsAnalyzed: 32,
        },
      },
      postgresql: {
        areaDistribution: areaDistribution.rows,
        searchTypeDistribution: searchTypeDistribution.rows,
        citationMetrics: citationMetrics.rows,
      },
    });
  } catch (err: any) {
    console.error('[API DBMS Analytics Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiLogging(handleGet, 'Execute MongoDB Aggregation Pipelines');

