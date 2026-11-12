'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PaperCard from '@/components/PaperCard';
import { Layers, Clock, BookOpen, GitMerge } from 'lucide-react';

function HybridSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [queryText, setQueryText] = useState(initialQuery);
  const [topK, setTopK] = useState('10');
  const [results, setResults] = useState<any[]>([]);
  const [keywordCount, setKeywordCount] = useState(0);
  const [semanticCount, setSemanticCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const sampleHybridQueries = [
    'transformer self-attention sequence transduction',
    'PostgreSQL relational MVCC concurrency locking',
    'deep neural network intrusion attack detection',
    'vector database approximate nearest neighbor HNSW',
    'cloud multi-tenant resource allocation reinforcement learning',
    'semi-supervised graph convolutional neural networks',
  ];

  const executeHybridSearch = async (searchTerm: string, limitVal: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setSearched(true);
    const start = performance.now();

    try {
      const res = await fetch('/api/search/hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm.trim(), topK: limitVal }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setKeywordCount(data.keywordMatchesCount || 0);
      setSemanticCount(data.semanticMatchesCount || 0);
      setExecutionTime(Number((performance.now() - start).toFixed(2)));
    } catch (err) {
      console.error('Hybrid search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeHybridSearch(initialQuery, topK);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeHybridSearch(queryText, topK);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
          <Layers className="w-3.5 h-3.5" />
          <span>Reciprocal Rank Fusion (RRF)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hybrid Search Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Fuses exact lexical inverted-index matching from PostgreSQL with dense vector semantic cosine rankings from pgvector.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Layers className="w-5 h-5 text-indigo-600 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Enter search terms or natural language query (e.g., 'transformer self-attention sequence modeling')..."
              className="w-full pl-11 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              className="p-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="15">Top 15</option>
              <option value="20">Top 20</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm flex items-center space-x-2 shrink-0"
            >
              {loading ? <span>Fusing Pipelines...</span> : <span>Execute Hybrid</span>}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="font-semibold text-slate-500 text-[11px]">Recommended Hybrid Queries:</span>
          {sampleHybridQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQueryText(q);
                executeHybridSearch(q, topK);
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-medium transition text-[11px] text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-100">Reciprocal Rank Fusion Formulation</p>
              <p className="text-[11px] text-slate-400">
                Score for document $d$: $RRF(d) = \frac&#123;1&#125;&#123;60 + rank_&#123;FTS&#125;(d)&#125; + \frac&#123;1&#125;&#123;60 + rank_&#123;vector&#125;(d)&#125;$. Deduplicates matches and balances exact keywords with semantic concepts.
              </p>
            </div>
          </div>
          {searched && (
            <div className="flex items-center space-x-2 text-[11px] font-mono shrink-0">
              <span className="px-2 py-1 bg-amber-950 text-amber-300 rounded border border-amber-800/50">Keyword Hits: {keywordCount}</span>
              <span className="px-2 py-1 bg-purple-950 text-purple-300 rounded border border-purple-800/50">Semantic Hits: {semanticCount}</span>
            </div>
          )}
        </div>
      </div>

      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-3">
            <p>
              Merged <span className="font-bold text-slate-900">{results.length}</span> deduplicated papers via RRF
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
                  <div className="h-4 bg-indigo-100 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-16 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No hybrid matches returned</h3>
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

export default function HybridSearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Hybrid Search...</div>}>
      <HybridSearchContent />
    </Suspense>
  );
}
