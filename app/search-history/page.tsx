'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, Trash2, Search, ArrowRight, RotateCcw } from 'lucide-react';

export default function SearchHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    fetch('/api/search-history')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.history) {
          setHistory(data.history);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteItem = async (searchId: number) => {
    try {
      const res = await fetch(`/api/search-history/${searchId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.search_id !== searchId));
      }
    } catch (err) {
      console.error('Delete item error:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear your entire search history?')) return;
    try {
      const res = await fetch('/api/search-history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading Search Audit Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>PostgreSQL SEARCH_HISTORY Audit Log</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Search History &amp; Queries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Persisted inquiry log across Keyword, Semantic, and Hybrid discovery modes.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No search inquiries logged</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your keyword, semantic, and hybrid searches will be safely audited here for fast recall.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {history.map((item) => {
            const formattedDate = new Date(item.search_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const searchHref = `/search/${item.search_type.toLowerCase()}?q=${encodeURIComponent(item.search_query)}`;

            return (
              <div
                key={item.search_id}
                className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      item.search_type === 'SEMANTIC'
                        ? 'bg-purple-100 text-purple-700'
                        : item.search_type === 'HYBRID'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.search_type}
                  </span>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.search_query}
                    </p>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formattedDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    href={searchHref}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold transition"
                  >
                    <span>Re-run</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleDeleteItem(item.search_id)}
                    title="Delete query record"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

