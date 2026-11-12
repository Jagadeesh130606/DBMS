'use client';

import React, { useState, useEffect } from 'react';
import PaperCard from '@/components/PaperCard';
import { Sparkles, Bookmark, History, TrendingUp, Compass, ArrowRight } from 'lucide-react';

export default function RecommendationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recommendations?limit=6')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error('Recommendations error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Synthesizing Semantic Recommendations...</p>
        </div>
      </div>
    );
  }

  const hasBookmarksRecs = data?.basedOnBookmarks?.length > 0;
  const hasHistoryRecs = data?.basedOnSearchHistory?.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Compass className="w-3.5 h-3.5" />
          <span>Semantic Recommendation Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Personalized Research Recommendations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Recommendations generated through vector space proximity ($1 - \text&#123;cosine distance&#125;$) over user activity graphs.
        </p>
      </div>

      {/* Section 1: Based on Bookmarks */}
      {hasBookmarksRecs && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <span>Derived from Your Bookmarked Library</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nearest neighbors in 384-dimensional pgvector embedding space to your saved papers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.basedOnBookmarks.map((paper: any) => (
              <PaperCard key={paper.paper_id} paper={paper} />
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Based on Search History */}
      {hasHistoryRecs && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-purple-600" />
                <span>Inspired by Your Recent Inquiries</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Relevant academic publications retrieved matching your recent exploratory inquiries.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.basedOnSearchHistory.map((paper: any) => (
              <PaperCard key={paper.paper_id} paper={paper} />
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Trending Landmark Papers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Trending Landmark Research</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked dynamically by weighted popularity index: $CitationCount \times 2 + Bookmarks \times 3$ via PostgreSQL view.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.trendingPapers?.map((paper: any) => (
            <PaperCard key={paper.paper_id} paper={paper} />
          ))}
        </div>
      </section>
    </div>
  );
}

