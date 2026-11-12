'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Search, 
  Database, 
  Code2, 
  Sparkles, 
  CheckCircle2, 
  X,
  AlertCircle
} from 'lucide-react';

export default function AdminPapersPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Paper Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAbstract, setFormAbstract] = useState('');
  const [formDoi, setFormDoi] = useState('');
  const [formPubDate, setFormPubDate] = useState('2024-05-15');
  const [formSource, setFormSource] = useState('NeurIPS 2024');
  const [formSelectedAuthorIds, setFormSelectedAuthorIds] = useState<number[]>([1]);
  const [formSelectedAreaIds, setFormSelectedAreaIds] = useState<number[]>([1]);
  const [formKeywords, setFormKeywords] = useState('machine learning, neural networks, optimization');

  const fetchPapers = () => {
    setLoading(true);
    fetch('/api/papers?limit=50')
      .then((r) => r.json())
      .then((d) => setPapers(d.papers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPapers();
    Promise.all([
      fetch('/api/authors').then((r) => r.json()),
      fetch('/api/areas').then((r) => r.json()),
    ]).then(([authData, areaData]) => {
      setAuthors(authData.authors || []);
      setAreas(areaData.areas || []);
    }).catch(console.error);
  }, []);

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const keywordsArray = formKeywords.split(',').map((k) => k.trim()).filter(Boolean);

      const res = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          abstract: formAbstract,
          doi: formDoi,
          publication_date: formPubDate,
          source: formSource,
          author_ids: formSelectedAuthorIds,
          area_ids: formSelectedAreaIds,
          keywords: keywordsArray,
          sections: [
            { heading: 'Introduction', content: `Introduction exploring ${formTitle}.` },
            { heading: 'Methodology', content: `Theoretical framework and implementation methodology for ${formTitle}.` },
            { heading: 'Results', content: `Experimental benchmark evaluation confirming superior accuracy and performance.` },
            { heading: 'Conclusion', content: `Summary of findings and ongoing investigations.` },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create paper.');
      }

      setSuccessMsg(`Research Paper successfully committed to PostgreSQL, pgvector (384-D), and MongoDB! (Paper ID #${data.paper_id})`);
      setShowAddModal(false);
      // Reset form
      setFormTitle('');
      setFormAbstract('');
      setFormDoi('');
      fetchPapers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaper = async (paperId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will delete the record from PostgreSQL (cascading all foreign keys) and MongoDB.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/papers/${paperId}`, { method: 'DELETE' });
      if (res.ok) {
        setPapers((prev) => prev.filter((p) => p.paper_id !== paperId));
        setSuccessMsg(`Paper #${paperId} successfully deleted across both databases.`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete paper');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredPapers = papers.filter((p) => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.doi.toLowerCase().includes(search.toLowerCase()) ||
    p.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar role="ADMIN" />

      <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">ADMIN CRUD</span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Research Paper Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Atomic cross-database inserts with compensation: PostgreSQL relational tables, pgvector cosine index, and MongoDB document hierarchy.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Research Paper</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter papers by title, DOI, or source..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total in Repository: <strong className="text-slate-900">{filteredPapers.length}</strong>
          </span>
        </div>

        {/* Table of Papers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Paper Title</th>
                  <th className="px-4 py-3">DOI</th>
                  <th className="px-4 py-3">Venue / Source</th>
                  <th className="px-4 py-3">Citations</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPapers.map((p) => (
                  <tr key={p.paper_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium text-slate-500">#{p.paper_id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-sm truncate">
                      <Link href={`/papers/${p.paper_id}`} className="hover:text-blue-600 transition">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{p.doi}</td>
                    <td className="px-4 py-3 text-slate-600">{p.source}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{p.citation_count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/papers/${p.paper_id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Paper Details"
                        >
                          <Database className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeletePaper(p.paper_id, p.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Paper (PostgreSQL + MongoDB)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Research Paper */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Add New Research Paper</h3>
                    <p className="text-[11px] text-slate-500">Atomic Two-Phase Commit across PostgreSQL &amp; MongoDB</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreatePaper} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paper Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Scalable Vector Indexing for High-Dimensional Search"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Abstract</label>
                  <textarea
                    required
                    rows={3}
                    value={formAbstract}
                    onChange={(e) => setFormAbstract(e.target.value)}
                    placeholder="Enter academic abstract..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">DOI (Unique)</label>
                    <input
                      type="text"
                      required
                      value={formDoi}
                      onChange={(e) => setFormDoi(e.target.value)}
                      placeholder="10.1145/example.2024.01"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Publication Date</label>
                    <input
                      type="date"
                      required
                      value={formPubDate}
                      onChange={(e) => setFormPubDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Publication Venue / Source</label>
                    <input
                      type="text"
                      required
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                      placeholder="e.g. ACM SIGMOD 2024"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Author</label>
                    <select
                      value={formSelectedAuthorIds[0]}
                      onChange={(e) => setFormSelectedAuthorIds([parseInt(e.target.value, 10)])}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {authors.map((a) => (
                        <option key={a.author_id} value={a.author_id}>{a.author_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Research Area</label>
                    <select
                      value={formSelectedAreaIds[0]}
                      onChange={(e) => setFormSelectedAreaIds([parseInt(e.target.value, 10)])}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {areas.map((a) => (
                        <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Keywords (Comma separated for MongoDB)</label>
                  <input
                    type="text"
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    placeholder="e.g. vector search, pgvector, postgresql, database"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    {submitting ? 'Executing Cross-DB Commit...' : 'Save Paper'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

