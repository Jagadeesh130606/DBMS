import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongodb';
import PaperDocument from '@/database/mongodb/models/PaperDocument';
import AuthorDocument from '@/database/mongodb/models/AuthorDocument';
import ResearchAreaDocument from '@/database/mongodb/models/ResearchAreaDocument';
import CitationDocument from '@/database/mongodb/models/CitationDocument';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection') || 'paper_documents';
    const limit = Math.max(1, Math.min(10, parseInt(searchParams.get('limit') || '3', 10)));

    await connectMongoDB();

    let docs: any[] = [];
    switch (collection) {
      case 'author_documents':
        docs = await AuthorDocument.find().limit(limit).lean();
        break;
      case 'research_area_documents':
        docs = await ResearchAreaDocument.find().limit(limit).lean();
        break;
      case 'citation_documents':
        docs = await CitationDocument.find().limit(limit).lean();
        break;
      case 'paper_documents':
      default:
        docs = await PaperDocument.find().limit(limit).lean();
        break;
    }

    return NextResponse.json({
      collection,
      count: docs.length,
      samples: docs,
    });
  } catch (err: any) {
    console.error('[API Collection Sample Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

