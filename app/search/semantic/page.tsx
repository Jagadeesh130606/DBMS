'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PaperCard from '@/components/PaperCard';
import { Sparkles, Cpu, Clock, BookOpen } from 'lucide-react';

function SemanticSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [queryText, setQueryText] = useState(initialQuery);
  const [topK, setTopK] = useState('15');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const sampleNaturalLanguageQueries = [
    'How can machine learning detect network intrusion attacks?',
    'What architectures enable self-attention without recurrent layers?',
    'How do globally distributed databases handle synchronized transactions?',
    'Techniques for approximate nearest neighbor search in vector databases',
    'Self-supervised representation learning for computer vision without labels',
    'Protecting neural network training against data poisoning and adversarial manipulation',
  ];

  const executeSemanticSearch = async (searchTerm: string, limitVal: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setSearched(true);
    const start = performance.now();

    try {
      const res = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm.trim(), topK: limitVal }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setExecutionTime(Number((performance.now() - start).toFixed(2)));
    } catch (err) {
      console.error('Semantic search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeSemanticSearch(initialQuery, topK);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSemanticSearch(queryText, topK);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>pgvector Cosine Similarity Search</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Semantic Search Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Vector similarity retrieval using 384-dimensional dense embeddings and PostgreSQL <code className="text-purple-600 font-semibold">&lt;=&gt;</code> cosine distance.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Sparkles className="w-5 h-5 text-purple-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Enter a natural language inquiry or research concept..."
              className="w-full pl-11 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              className="p-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="15">Top 15</option>
              <option value="20">Top 20</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition shadow-sm flex items-center space-x-2 shrink-0"
            >
              {loading ? <span>Embedding &amp; Searching...</span> : <span>Search Vectors</span>}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="font-semibold text-slate-500 text-[11px]">Natural Language Inquiries:</span>
          {sampleNaturalLanguageQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQueryText(q);
                executeSemanticSearch(q, topK);
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium transition text-[11px] text-left"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-100">Vector Embeddings Pipeline</p>
            <p className="text-[11px] text-slate-400">
              Query text is embedded into a unit-normalized vector $\vec&#123;q&#125; \in \mathbb&#123;R&#125;^&#123;384&#125;$. Cosine distance is evaluated in PostgreSQL using the pgvector extension.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 font-mono text-[11px] text-purple-300 shrink-0">
          <span>Model: all-MiniLM-L6-v2</span>
          <span>•</span>
          <span>Dim: 384</span>
        </div>
      </div>

      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-3">
            <p>
              Found <span className="font-bold text-slate-900">{results.length}</span> nearest neighbors ranked by Cosine Similarity
            </p>
            {executionTime !== null && (
              <span className="flex items-center space-x-1 font-mono text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Inference &amp; Query: {executionTime} ms</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse space-y-4">
                  <div className="h-4 bg-purple-100 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-16 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No semantic matches returned</h3>
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

export default function SemanticSearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Semantic Search...</div>}>
      <SemanticSearchContent />
    </Suspense>
  );
}
