'use client';

import React, { useState, useEffect } from 'react';
import PaperCard from '@/components/PaperCard';
import { Search, Filter, BookOpen, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PapersPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and pagination states
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load research areas and authors for filter dropdowns
  useEffect(() => {
    Promise.all([
      fetch('/api/areas').then((r) => r.json()),
      fetch('/api/authors').then((r) => r.json()),
    ]).then(([areasData, authorsData]) => {
      setAreas(areasData.areas || []);
      setAuthors(authorsData.authors || []);
    }).catch(console.error);
  }, []);

  // Fetch papers when filters/page changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (selectedArea) params.append('areaId', selectedArea);
    if (selectedAuthor) params.append('authorId', selectedAuthor);
    if (selectedYear) params.append('year', selectedYear);
    if (sortBy) params.append('sortBy', sortBy);
    params.append('page', page.toString());
    params.append('limit', '9');

    fetch(`/api/papers?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setPapers(data.papers || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch((err) => console.error('Fetch papers error:', err))
      .finally(() => setLoading(false));
  }, [search, selectedArea, selectedAuthor, selectedYear, sortBy, page]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedArea('');
    setSelectedAuthor('');
    setSelectedYear('');
    setSortBy('date_desc');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
          <BookOpen className="w-7 h-7 text-blue-600" />
          <span>Research Paper Catalog</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore {total} academic publications categorized across multi-model PostgreSQL relational views and MongoDB documents.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Top search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search papers by title, abstract keyword, or DOI..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Research Area</label>
            <select
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Research Areas</option>
              {areas.map((a) => (
                <option key={a.area_id} value={a.area_id}>
                  {a.area_name} ({a.paper_count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Author / Scholar</label>
            <select
              value={selectedAuthor}
              onChange={(e) => {
                setSelectedAuthor(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Authors</option>
              {authors.map((a) => (
                <option key={a.author_id} value={a.author_id}>
                  {a.author_name} ({a.total_publications} papers)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Publication Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2014', '2012', '2005', '2004', '2001', '1998'].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date_desc">Publication Date (Newest)</option>
              <option value="date_asc">Publication Date (Oldest)</option>
              <option value="citations_desc">Citations (High to Low)</option>
              <option value="bookmarks_desc">Popularity (Most Bookmarked)</option>
              <option value="title_asc">Title (A to Z)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium flex items-center justify-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>Showing <span className="font-semibold text-slate-900">{papers.length}</span> of <span className="font-semibold text-slate-900">{total}</span> papers</p>
        <p>Page {page} of {totalPages}</p>
      </div>

      {/* Grid of Papers */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No research papers match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or clearing the selected filters to view more papers.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => (
            <PaperCard key={paper.paper_id} paper={paper} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 pt-6 border-t border-slate-200">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="flex items-center space-x-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="text-xs font-medium text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex items-center space-x-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

