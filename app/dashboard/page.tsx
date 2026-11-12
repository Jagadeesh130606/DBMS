'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PaperCard from '@/components/PaperCard';
import { 
  Bookmark, 
  History, 
  Sparkles, 
  BookOpen, 
  Search, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Compass
} from 'lucide-react';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verify user authentication
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        // Load bookmarks, history, and recommendations in parallel
        return Promise.all([
          fetch('/api/bookmarks').then((r) => r.json()),
          fetch('/api/search-history').then((r) => r.json()),
          fetch('/api/recommendations?limit=4').then((r) => r.json()),
        ]);
      })
      .then(([bmData, histData, recData]) => {
        setBookmarks(bmData.bookmarks || []);
        setHistory(histData.history || []);
        setRecommendations(
          recData.basedOnBookmarks?.length > 0 
            ? recData.basedOnBookmarks 
            : recData.trendingPapers || []
        );
      })
      .catch((err) => {
        console.warn('Dashboard auth check:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading Student Research Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <Sidebar role="STUDENT" />

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user ? user.name : 'Scholar'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Student Research Dashboard • PostgreSQL &amp; pgvector Semantic Engine
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/search/semantic"
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Semantic Search</span>
            </Link>
            <Link
              href="/papers"
              className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Browse Papers</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{bookmarks.length}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saved Bookmarks</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{history.length}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Search Queries Logged</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{recommendations.length}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Semantic Recs Ready</p>
            </div>
          </div>
        </div>

        {/* Personalized Recommendations Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Personalized Recommendations</span>
            </h2>
            <Link href="/recommendations" className="text-xs text-blue-600 hover:underline font-semibold flex items-center space-x-1">
              <span>View All Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((paper) => (
              <PaperCard key={paper.paper_id} paper={paper} />
            ))}
          </div>
        </div>

        {/* Bottom Split: Recent Bookmarks & Recent Searches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saved Bookmarks */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <span>My Bookmarked Papers ({bookmarks.length})</span>
              </h3>
              <Link href="/bookmarks" className="text-xs text-blue-600 hover:underline">
                Manage
              </Link>
            </div>

            {bookmarks.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No bookmarked papers yet. Explore the catalog to save papers.
              </div>
            ) : (
              <div className="space-y-3">
                {bookmarks.slice(0, 4).map((bm) => (
                  <Link
                    key={bm.paper_id}
                    href={`/papers/${bm.paper_id}`}
                    className="block p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition"
                  >
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{bm.title}</p>
                    <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-500">
                      <span>{bm.primary_author || 'Author'}</span>
                      <span>•</span>
                      <span>{bm.source}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-semibold">{bm.citation_count} citations</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Search History */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <History className="w-4 h-4 text-purple-600" />
                <span>Recent Inquiries ({history.length})</span>
              </h3>
              <Link href="/search-history" className="text-xs text-blue-600 hover:underline">
                History
              </Link>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No recorded search queries.
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <div
                    key={item.search_id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.search_type === 'SEMANTIC' 
                          ? 'bg-purple-100 text-purple-700' 
                          : item.search_type === 'HYBRID' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.search_type}
                      </span>
                      <span className="text-slate-800 font-medium truncate">{item.search_query}</span>
                    </div>
                    <Link
                      href={`/search/${item.search_type.toLowerCase()}?q=${encodeURIComponent(item.search_query)}`}
                      className="text-blue-600 hover:underline font-medium text-[11px] shrink-0 ml-2"
                    >
                      Re-run
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

