'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  BookOpen, 
  Calendar, 
  GitFork, 
  Bookmark, 
  ExternalLink, 
  Tag, 
  User, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft,
  Share2
} from 'lucide-react';
import PaperCard from '@/components/PaperCard';

export default function PaperDetailsPage() {
  const params = useParams();
  const paperId = params.id as string;

  const [paper, setPaper] = useState<any>(null);
  const [doc, setDoc] = useState<any>(null);
  const [similarPapers, setSimilarPapers] = useState<any[]>([]);
  const [citationStats, setCitationStats] = useState<any>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sections' | 'references' | 'metadata'>('sections');

  useEffect(() => {
    if (!paperId) return;

    setLoading(true);
    Promise.all([
      fetch(`/api/papers/${paperId}`).then((r) => r.json()),
      fetch(`/api/recommendations?paperId=${paperId}&limit=3`).then((r) => r.json()),
      fetch(`/api/papers/${paperId}/citations`).then((r) => r.json()),
    ])
      .then(([paperData, similarData, citationData]) => {
        if (paperData.paper) {
          setPaper(paperData.paper);
          setDoc(paperData.document);
          setBookmarked(paperData.paper.isBookmarked || false);
        }
        setSimilarPapers(similarData.recommendations || []);
        setCitationStats(citationData.stats || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [paperId]);

  const toggleBookmark = async () => {
    try {
      if (bookmarked) {
        await fetch(`/api/bookmarks/${paperId}`, { 
          method: 'DELETE',
          headers: { 'x-action-name': 'Remove Paper Bookmark' }
        });
        setBookmarked(false);
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-action-name': 'Add Paper Bookmark'
          },
          body: JSON.stringify({ paperId: parseInt(paperId, 10) }),
        });
        if (res.ok) {
          setBookmarked(true);
        } else if (res.status === 401) {
          window.location.href = '/login';
        }
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Retrieving Multi-Model Paper Records...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Research Paper Not Found</h2>
        <p className="text-xs text-slate-500">The requested paper ID does not exist in the database.</p>
        <Link href="/papers" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Return to Paper Catalog
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(paper.publication_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link href="/papers" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Papers</span>
        </Link>
      </div>

      {/* Main Relational Header Card (PostgreSQL) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold">
              {paper.source}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono">
              DOI: {paper.doi}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleBookmark}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${
                bookmarked
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
              <span>{bookmarked ? 'Bookmarked' : 'Save to Library'}</span>
            </button>

            <Link
              href={`/citations?paperId=${paper.paper_id}`}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Explore Citations ({paper.citation_count})</span>
            </Link>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
          {paper.title}
        </h1>

        {/* Authors with Affiliations */}
        <div className="border-t border-b border-slate-100 py-4 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contributing Authors &amp; Affiliations</p>
          <div className="flex flex-wrap gap-4 text-xs">
            {paper.authorsList?.map((author: any) => (
              <div key={author.author_id} className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <div>
                  <span className="font-bold text-slate-900">{author.name}</span>
                  {author.affiliation && (
                    <span className="text-[11px] text-slate-500 block">{author.affiliation}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Research Areas */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center space-x-1">
            <Tag className="w-3.5 h-3.5" />
            <span>Research Areas:</span>
          </span>
          {paper.areasList?.map((area: any) => (
            <span key={area.area_id} className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
              {area.area_name}
            </span>
          ))}
        </div>

        {/* Abstract */}
        <div className="space-y-2 pt-2">
          <h3 className="font-bold text-sm text-slate-900">Abstract</h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            {paper.abstract}
          </p>
        </div>
      </div>

      {/* MongoDB Document Content Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">MongoDB NoSQL Store</span>
            <h2 className="text-base font-bold">Unstructured Document Sections &amp; References</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">collection: paper_documents</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sections')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'sections' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Document Sections ({doc?.sections?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('references')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'references' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Structured References ({doc?.references?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'metadata' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Metadata &amp; Keywords
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'sections' && (
            <div className="space-y-6">
              {doc?.sections?.map((sec: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{sec.heading}</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-7">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'references' && (
            <div className="space-y-3">
              {doc?.references?.length === 0 ? (
                <p className="text-xs text-slate-400">No references documented in document store.</p>
              ) : (
                doc?.references?.map((ref: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{ref.title}</p>
                    <p className="text-slate-600">{Array.isArray(ref.authors) ? ref.authors.join(', ') : ref.authors} ({ref.year})</p>
                    {ref.doi && (
                      <p className="text-[11px] font-mono text-blue-600">DOI: {ref.doi}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Paper Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {doc?.keywords?.map((kw: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-medium border border-emerald-200">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Document Type</span>
                  <span className="font-bold text-slate-800">{doc?.metadata?.document_type || 'Research Article'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Language</span>
                  <span className="font-bold text-slate-800">{doc?.metadata?.language || 'English'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Publisher</span>
                  <span className="font-bold text-slate-800">{doc?.metadata?.publisher || paper.source}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Peer Reviewed</span>
                  <span className="font-bold text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Semantically Similar Papers (pgvector) */}
      {similarPapers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Semantically Similar Papers</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Computed via pgvector cosine distance on 384-dimensional dense vectors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarPapers.map((simPaper) => (
              <PaperCard key={simPaper.paper_id} paper={simPaper} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

