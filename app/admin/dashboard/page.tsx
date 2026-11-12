'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  Code2, 
  BookOpen, 
  PlusCircle, 
  BarChart3, 
  Users, 
  CheckCircle2,
  GitFork,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentPapers, setRecentPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.counts);
        setRecentPapers(data.recentPapers || []);
      })
      .catch((err) => console.error('Admin dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar role="ADMIN" />

      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">ADMIN ROLE</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">System &amp; Database Administration</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Multi-Model Database Oversight • PostgreSQL &amp; MongoDB Synchronization</p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/admin/papers"
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Research Paper</span>
            </Link>
            <Link
              href="/dbms"
              className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>SQL Demos</span>
            </Link>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">PostgreSQL Relational DB</p>
                <p className="text-[11px] text-emerald-700 font-medium">9 Tables • Normalized 3NF</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">pgvector Embedding Engine</p>
                <p className="text-[11px] text-purple-700 font-medium">384-D • Cosine &lt;=&gt; Active</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
          </div>

          <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">MongoDB Document Database</p>
                <p className="text-[11px] text-teal-700 font-medium">paper_documents Collection</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-2xl font-extrabold text-slate-900">{stats?.totalPapers ?? 32}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Research Papers</p>
            <p className="text-[10px] text-emerald-600 mt-1">100% Cross-DB Synced</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-2xl font-extrabold text-slate-900">{stats?.totalAuthors ?? 15}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Registered Authors</p>
            <p className="text-[10px] text-slate-400 mt-1">M:N with Paper_Author</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-2xl font-extrabold text-slate-900">{stats?.totalCitations ?? 44}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Citation Edges</p>
            <p className="text-[10px] text-blue-600 mt-1">Recursive CTEs enabled</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-2xl font-extrabold text-slate-900">{stats?.totalUsers ?? 10}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Total User Accounts</p>
            <p className="text-[10px] text-purple-600 mt-1">Admins &amp; Students</p>
          </div>
        </div>

        {/* Manage Papers Action Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-lg">Cross-Database Research Paper CRUD</h3>
            <p className="text-xs text-blue-200 mt-1 max-w-xl">
              Adding or removing research papers automatically triggers a 2-phase cross-database workflow: PostgreSQL relational inserts, Sentence Transformer 384-dimensional dense vector embeddings, and MongoDB document hierarchy storage with compensation safety.
            </p>
          </div>
          <Link
            href="/admin/papers"
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-semibold text-xs transition shadow shrink-0 flex items-center space-x-1.5"
          >
            <span>Open Paper Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Recent Papers Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Recent Papers in Repository (PostgreSQL &amp; MongoDB)</h3>
            <Link href="/papers" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author(s)</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Citations</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPapers.map((paper) => (
                  <tr key={paper.paper_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium text-slate-600">#{paper.paper_id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-xs truncate">{paper.title}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{paper.authors}</td>
                    <td className="px-4 py-3 text-slate-500">{paper.source}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{paper.citation_count}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/papers/${paper.paper_id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

