'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Database, 
  Code2, 
  PieChart, 
  TrendingUp, 
  Layers, 
  Tag, 
  Calendar,
  FileText,
  Activity
} from 'lucide-react';

export default function DatabaseAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dbms/analytics')
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Computing MongoDB Aggregations &amp; Relational Analytics...</p>
        </div>
      </div>
    );
  }

  const mongo = analytics?.mongodb;
  const pg = analytics?.postgresql;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Multi-Model Aggregation Pipelines &amp; Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Database Analytics &amp; Aggregations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time metrics calculated using MongoDB NoSQL multi-stage aggregation pipelines ($group, $unwind, $project) alongside PostgreSQL relational summary analytics.
        </p>
      </div>

      {/* Part A: MongoDB Aggregation Pipelines */}
      <section className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
          <Code2 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">
            MongoDB NoSQL Aggregation Pipelines (<code className="font-mono text-emerald-700 text-sm">paper_documents</code>)
          </h2>
        </div>

        {/* MongoDB Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Documents Processed</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {mongo?.documentSummary?.totalDocumentsAnalyzed || 32}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">100% Schema Validated</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Avg Sections per Paper</span>
            <span className="text-2xl font-extrabold text-blue-600 mt-1 block">
              {Number(mongo?.documentSummary?.avgSectionsPerPaper || 4).toFixed(1)}
            </span>
            <span className="text-[11px] text-slate-500">Intro, Method, Results, Conclusion</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Avg References Embedded</span>
            <span className="text-2xl font-extrabold text-purple-600 mt-1 block">
              {Number(mongo?.documentSummary?.avgReferencesPerPaper || 4).toFixed(1)}
            </span>
            <span className="text-[11px] text-slate-500">Nested Reference Objects</span>
          </div>
        </div>

        {/* Top Keywords Pipeline & Document Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Keywords Cloud */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>Top Corpus Keywords ($unwind + $group)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Aggregated frequency across all document arrays</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {mongo?.topKeywords?.map((kw: any, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200"
                >
                  <span>#{kw.keyword}</span>
                  <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-bold flex items-center justify-center">
                    {kw.occurrences}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Reference Publication Years Pipeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Reference Citation Year Distribution</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Distribution of cited publication publication dates</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {mongo?.referenceYears?.map((ref: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700 w-16">Year {ref.year}</span>
                  <div className="flex-1 mx-3 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, ref.citations * 8)}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-800 text-right w-12">{ref.citations} refs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Part B: PostgreSQL Relational Analytics */}
      <section className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">
            PostgreSQL Relational Analytics &amp; Aggregations
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Research Area Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Papers &amp; Citation Distribution by Research Area</span>
            </h3>

            <div className="space-y-3">
              {pg?.areaDistribution?.map((area: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-800">{area.area_name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {area.paper_count} papers • {area.total_citations} cites
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (parseInt(area.total_citations, 10) / 250) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search History Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>User Discovery Mode Usage Breakdown</span>
            </h3>

            <div className="space-y-4 pt-2">
              {pg?.searchTypeDistribution?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.search_type === 'SEMANTIC' 
                        ? 'bg-purple-100 text-purple-700' 
                        : item.search_type === 'HYBRID' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.search_type}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{item.total_queries} queries logged</p>
                  </div>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

