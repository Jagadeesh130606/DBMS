'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GitFork, BookOpen, Layers, ArrowRight, ExternalLink } from 'lucide-react';

function CitationsContent() {
  const searchParams = useSearchParams();
  const initialPaperId = searchParams.get('paperId') || '1';

  const [selectedPaperId, setSelectedPaperId] = useState(initialPaperId);
  const [papersList, setPapersList] = useState<any[]>([]);
  const [citationData, setCitationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load paper list for dropdown selection
  useEffect(() => {
    fetch('/api/papers?limit=40')
      .then((r) => r.json())
      .then((d) => setPapersList(d.papers || []))
      .catch(console.error);
  }, []);

  // Fetch citation graph data when selectedPaperId changes
  useEffect(() => {
    if (!selectedPaperId) return;
    setLoading(true);

    fetch(`/api/papers/${selectedPaperId}/citations`)
      .then((r) => r.json())
      .then((d) => setCitationData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPaperId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
          <GitFork className="w-3.5 h-3.5" />
          <span>Recursive SQL CTE &amp; Graph Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Citation Network Explorer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore recursive multi-level citation pathways across research literature computed using PostgreSQL recursive Common Table Expressions (<code className="text-indigo-600 font-semibold">WITH RECURSIVE</code>).
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Focus Research Paper</label>
          <select
            value={selectedPaperId}
            onChange={(e) => setSelectedPaperId(e.target.value)}
            className="w-full sm:w-96 p-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {papersList.map((p) => (
              <option key={p.paper_id} value={p.paper_id}>
                #{p.paper_id} - {p.title.substring(0, 50)}... ({p.citation_count} cites)
              </option>
            ))}
          </select>
        </div>

        {citationData?.stats && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="font-extrabold text-slate-900 text-sm block">
                {citationData.stats.total_citations_received}
              </span>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Inbound Citations</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="font-extrabold text-slate-900 text-sm block">
                {citationData.stats.total_references_cited}
              </span>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Outbound References</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-center">
              <span className="font-extrabold text-purple-700 text-sm block">
                {citationData.stats.second_degree_citations}
              </span>
              <span className="text-[10px] text-purple-700 uppercase font-semibold">2nd-Degree Citations</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Recursive Traversal Graph (Depth 1 to 3 Hops)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Iteratively evaluates transitive citations using <code className="font-mono text-indigo-600">UNION ALL</code> and cycle-avoiding path arrays.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono">
                {citationData?.recursiveNetwork?.length || 0} Paths Discovered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Hop Depth</th>
                    <th className="px-4 py-3">Citing Paper (Inbound)</th>
                    <th className="px-4 py-3">Cited Paper</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {citationData?.recursiveNetwork?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.depth === 1 
                            ? 'bg-blue-100 text-blue-800' 
                            : row.depth === 2 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Hop {row.depth}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-sm">
                        <span className="font-mono text-[10px] text-slate-400 mr-1.5">#{row.citing_paper_id}</span>
                        <span>{row.citing_title}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-sm">
                        <span className="font-mono text-[10px] text-slate-400 mr-1.5">#{row.cited_paper_id}</span>
                        <span>{row.cited_title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/papers/${row.citing_paper_id}`}
                          className="text-blue-600 hover:underline font-medium inline-flex items-center space-x-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Papers Citing This Work ({citationData?.citingPapers?.length || 0})</span>
                <span className="text-[10px] text-slate-400 font-normal">Direct Citations</span>
              </h3>

              {citationData?.citingPapers?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No inbound citations recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {citationData.citingPapers.map((paper: any) => (
                    <Link
                      key={paper.paper_id}
                      href={`/papers/${paper.paper_id}`}
                      className="block p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                    >
                      <p className="font-bold text-xs text-slate-900 line-clamp-1">{paper.title}</p>
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                        <span>{paper.authors}</span>
                        <span>•</span>
                        <span>{paper.source}</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">{paper.citation_count} cites</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>References Cited by This Paper ({citationData?.citedPapers?.length || 0})</span>
                <span className="text-[10px] text-slate-400 font-normal">Outbound References</span>
              </h3>

              {citationData?.citedPapers?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No outbound references linked.</p>
              ) : (
                <div className="space-y-3">
                  {citationData.citedPapers.map((paper: any) => (
                    <Link
                      key={paper.paper_id}
                      href={`/papers/${paper.paper_id}`}
                      className="block p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                    >
                      <p className="font-bold text-xs text-slate-900 line-clamp-1">{paper.title}</p>
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                        <span>{paper.authors}</span>
                        <span>•</span>
                        <span>{paper.source}</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">{paper.citation_count} cites</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CitationExplorationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Citation Graph Explorer...</div>}>
      <CitationsContent />
    </Suspense>
  );
}
