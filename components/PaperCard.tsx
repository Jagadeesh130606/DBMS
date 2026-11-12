'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, ExternalLink, Calendar, GitFork, Tag, Sparkles, Layers } from 'lucide-react';

interface PaperCardProps {
  paper: {
    paper_id: number;
    title: string;
    abstract?: string;
    doi: string;
    publication_date: string;
    citation_count: number;
    source: string;
    authors?: string;
    research_areas?: string;
    similarity_score?: number;
    rrfScore?: number;
    matchType?: string;
    isBookmarked?: boolean;
    bookmark_count?: number;
  };
  onBookmarkToggle?: (paperId: number, bookmarked: boolean) => void;
}

export default function PaperCard({ paper, onBookmarkToggle }: PaperCardProps) {
  const [bookmarked, setBookmarked] = useState(paper.isBookmarked || false);
  const [loading, setLoading] = useState(false);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      if (bookmarked) {
        const res = await fetch(`/api/bookmarks/${paper.paper_id}`, { method: 'DELETE' });
        if (res.ok) {
          setBookmarked(false);
          onBookmarkToggle?.(paper.paper_id, false);
        }
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId: paper.paper_id }),
        });
        if (res.ok) {
          setBookmarked(true);
          onBookmarkToggle?.(paper.paper_id, true);
        } else if (res.status === 401) {
          window.location.href = '/login';
        }
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(paper.publication_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Badges & Meta */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium">
              ID #{paper.paper_id}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
              {paper.source}
            </span>
            {paper.similarity_score !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Sim: {(Number(paper.similarity_score) * 100).toFixed(1)}%</span>
              </span>
            )}
            {paper.matchType && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center space-x-1 ${
                paper.matchType === 'HYBRID_MATCH' 
                  ? 'bg-purple-100 text-purple-800' 
                  : paper.matchType === 'SEMANTIC_ONLY' 
                  ? 'bg-sky-100 text-sky-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <Layers className="w-2.5 h-2.5" />
                <span>{paper.matchType.replace('_', ' ')}</span>
              </span>
            )}
          </div>

          <button
            onClick={toggleBookmark}
            disabled={loading}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark paper'}
            className={`p-1.5 rounded-lg border transition ${
              bookmarked
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Paper Title */}
        <Link href={`/papers/${paper.paper_id}`} className="block group-hover:text-blue-600 transition">
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-1.5">
            {paper.title}
          </h3>
        </Link>

        {/* Authors */}
        <p className="text-xs text-slate-600 mb-2.5 line-clamp-1">
          <span className="font-medium text-slate-700">{paper.authors || 'Unknown Researcher'}</span>
        </p>

        {/* Abstract snippet */}
        {paper.abstract && (
          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
            {paper.abstract}
          </p>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1" title="Citations received">
            <GitFork className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">{paper.citation_count}</span>
            <span className="text-[11px] text-slate-400">cites</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </span>
        </div>

        <Link
          href={`/papers/${paper.paper_id}`}
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium hover:underline text-xs"
        >
          <span>Explore</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

