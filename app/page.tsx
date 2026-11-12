'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Sparkles, 
  Layers, 
  Database, 
  Cpu, 
  Code2, 
  GitFork, 
  BookOpen, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  BookmarkCheck
} from 'lucide-react';
import PaperCard from '@/components/PaperCard';

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic' | 'hybrid'>('semantic');
  const [stats, setStats] = useState<any>(null);
  const [recentPapers, setRecentPapers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.counts) {
          setStats(data.counts);
          setRecentPapers(data.recentPapers || []);
        }
      })
      .catch((err) => console.error('Landing fetch error:', err));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search/${searchMode}?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Level-3 DBMS Academic Architecture Active</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Research Paper Discovery &amp; <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Semantic Recommendation System
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Multi-model academic discovery platform integrating <strong className="text-white">PostgreSQL</strong> for relational data, <strong className="text-white">pgvector</strong> for 384-dimensional dense semantic search, and <strong className="text-white">MongoDB</strong> for hierarchical paper documents.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mt-8 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
            {/* Search Mode Toggles */}
            <div className="flex justify-center space-x-2 mb-2 p-1 bg-black/30 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSearchMode('semantic')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                  searchMode === 'semantic' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Semantic Search (pgvector)</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('hybrid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                  searchMode === 'hybrid' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-300" />
                <span>Hybrid Search (RRF)</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('keyword')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                  searchMode === 'keyword' ? 'bg-slate-700 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-slate-300" />
                <span>Keyword (FTS GIN)</span>
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-xl overflow-hidden shadow-inner p-1">
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchMode === 'semantic'
                    ? "Enter natural language query, e.g. 'How can machine learning detect intrusion attacks?'"
                    : searchMode === 'hybrid'
                    ? "Enter terms, e.g. 'transformer self-attention sequence modeling'"
                    : "Search title, abstract, or DOI..."
                }
                className="w-full px-3 py-3 text-slate-900 placeholder-slate-400 focus:outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition flex items-center space-x-1"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Demo Credentials Pill */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Quick Demo Accounts:</span>
            <Link href="/login" className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200">
              Student: <span className="font-mono text-sky-400">student@research.edu</span>
            </Link>
            <Link href="/login" className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200">
              Admin: <span className="font-mono text-purple-400">admin@research.edu</span>
            </Link>
            <span className="text-[11px] text-slate-400">(Password: Password@123)</span>
          </div>
        </div>
      </section>

      {/* Live System Counter Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Papers Seeded', value: stats?.totalPapers ?? 32, icon: BookOpen, color: 'text-blue-600' },
            { label: 'Researchers', value: stats?.totalAuthors ?? 15, icon: Code2, color: 'text-indigo-600' },
            { label: 'Research Areas', value: stats?.totalAreas ?? 8, icon: Layers, color: 'text-sky-600' },
            { label: 'Citations Graph', value: stats?.totalCitations ?? 44, icon: GitFork, color: 'text-purple-600' },
            { label: 'User Bookmarks', value: stats?.totalBookmarks ?? 19, icon: BookmarkCheck, color: 'text-emerald-600' },
            { label: 'Mongo Documents', value: stats?.mongoDocuments ?? 32, icon: Database, color: 'text-teal-600' },
            { label: 'Vector Dim', value: '384-D', icon: Cpu, color: 'text-rose-600' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
                <p className="text-xl font-extrabold text-slate-900">{item.value}</p>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architectural Pillars (Multi-Model Justification) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Multi-Model Database Architecture
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Why multi-model? Rather than forcing polymorphic unstructured data into relational tables or compromising relational ACID integrity in NoSQL, this system genuinely partitions workloads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">PostgreSQL (Relational Core)</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Stores normalized 3NF relational entities: Users, Authors, Papers, Research Areas, Citations, Bookmarks, and Search History. Enforces foreign key constraints, triggers for citation counts, and GIN indexes for Full-Text Search.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">9 Tables</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">Views</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">Triggers</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">Stored Procedures</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-400 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">pgvector (Semantic Similarity)</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Stores 384-dimensional dense vectors generated by the <code className="text-purple-700 font-semibold">all-MiniLM-L6-v2</code> Sentence Transformer. Executes cosine distance (<code className="text-purple-700 font-semibold">&lt;=&gt;</code>) nearest-neighbor queries to uncover semantic intent.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700">384 Dimensions</span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700">Cosine Distance</span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700">HNSW Index</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">MongoDB (Document Database)</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Maintains the <code className="text-emerald-700 font-semibold">paper_documents</code> collection storing hierarchical sections (Introduction, Methodology, Results, Conclusion), references array, flexible metadata, and aggregation pipelines.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Mongoose Models</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Aggregation Pipelines</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Unstructured Text</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Recent Papers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Recently Added Landmark Research</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Retrieved via PostgreSQL paper_details_view</p>
          </div>
          <Link
            href="/papers"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View All Papers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPapers.slice(0, 6).map((paper) => (
            <PaperCard key={paper.paper_id} paper={paper} />
          ))}
        </div>
      </section>
    </div>
  );
}

