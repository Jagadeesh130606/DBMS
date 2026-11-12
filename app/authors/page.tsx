'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, BookOpen, GitFork, Mail, Building, ArrowRight } from 'lucide-react';

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = search.trim() ? `/api/authors?search=${encodeURIComponent(search.trim())}` : '/api/authors';
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAuthors(data.authors || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>Relational View: author_publication_view</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Researcher &amp; Author Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore prominent academic scholars, university affiliations, publication metrics, and aggregate citation counts.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search author name or institution..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Authors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : authors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No authors found matching &ldquo;{search}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => (
            <div
              key={author.author_id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow">
                    {author.author_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{author.author_name}</h3>
                    <p className="text-xs text-slate-500 flex items-center space-x-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[200px]">{author.affiliation || 'University Researcher'}</span>
                    </p>
                  </div>
                </div>

                {author.email && (
                  <p className="text-xs text-slate-600 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{author.email}</span>
                  </p>
                )}

                <div className="pt-2 text-xs text-slate-600">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Expertise Domains</span>
                  <span className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 block text-[11px] line-clamp-1">
                    {author.primary_research_areas}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">{author.total_publications}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Papers</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-blue-600 text-sm block">{author.total_citations}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Citations</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-purple-600 text-sm block">{author.avg_citations_per_paper}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg / Paper</span>
                  </div>
                </div>

                <Link
                  href={`/papers?authorId=${author.author_id}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="View author papers"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

