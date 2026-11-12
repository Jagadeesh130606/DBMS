'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PaperCard from '@/components/PaperCard';
import { Search, Database, Clock, BookOpen } from 'lucide-react';

function KeywordSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [queryText, setQueryText] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const sampleQueries = [
    'transformer sequence modeling',
    'PostgreSQL MVCC concurrency',
    'network intrusion detection',
    'distributed database Spanner',
    'resilient distributed datasets Spark',
    'approximate nearest neighbors vector indexing',
  ];

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setSearched(true);
    const start = performance.now();

    try {
      const res = await fetch(`/api/search/keyword?q=${encodeURIComponent(searchTerm.trim())}&limit=12`);
      const data = await res.json();
      setResults(data.results || []);
      setExecutionTime(Number((performance.now() - start).toFixed(2)));
    } catch (err) {
      console.error('Keyword search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(queryText);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Database className="w-3.5 h-3.5" />
          <span>PostgreSQL Full-Text Search (FTS)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Keyword Search Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Lexical text matching powered by PostgreSQL <code className="text-blue-600 font-semibold">to_tsvector</code>, <code className="text-blue-600 font-semibold">plainto_tsquery</code>, and GIN inverted indexing with <code className="text-blue-600 font-semibold">ts_rank</code> relevance scoring.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search by keywords, title terms, or authors (e.g., 'transformer sequence modeling')..."
              className="w-full pl-11 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition shadow-sm flex items-center space-x-2"
          >
            {loading ? <span>Searching...</span> : <span>Run Search</span>}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="font-semibold text-slate-500 text-[11px]">Sample Queries:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQueryText(q);
                executeSearch(q);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition text-[11px]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-3">
            <p>
              Found <span className="font-bold text-slate-900">{results.length}</span> papers matching &ldquo;{queryText}&rdquo;
            </p>
            {executionTime !== null && (
              <span className="flex items-center space-x-1 font-mono text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Execution: {executionTime} ms</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-16 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No keyword matches found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No papers contained all query tokens in their inverted GIN index. Try semantic search to match conceptual intent instead.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((paper) => (
                <PaperCard key={paper.paper_id} paper={paper} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KeywordSearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Keyword Search...</div>}>
      <KeywordSearchContent />
    </Suspense>
  );
}
