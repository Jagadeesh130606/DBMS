'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Play, 
  Clock, 
  Code2, 
  Terminal, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Zap, 
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { DBMS_DEMO_QUERIES, DbmsQueryDemo } from '@/lib/dbms-queries';

export default function DbmsConceptsPage() {
  const [queries, setQueries] = useState<DbmsQueryDemo[]>(DBMS_DEMO_QUERIES);
  const [selectedQueryId, setSelectedQueryId] = useState<string>('select_basic');
  const [activeQuery, setActiveQuery] = useState<DbmsQueryDemo>(DBMS_DEMO_QUERIES[0]);
  const [customSql, setCustomSql] = useState<string>(DBMS_DEMO_QUERIES[0].sql);
  
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Switch active query
  const handleSelectQuery = (q: DbmsQueryDemo) => {
    setSelectedQueryId(q.id);
    setActiveQuery(q);
    setCustomSql(q.sql);
    setError(null);
    setExecutionResult(null);
  };

  // Execute query
  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setExecutionResult(null);

    try {
      const res = await fetch('/api/dbms/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: selectedQueryId,
          customSql: customSql !== activeQuery.sql ? customSql : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Query execution error');
      }
      setExecutionResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleExecute();
  }, [selectedQueryId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Database className="w-3.5 h-3.5" />
          <span>Level-3 DBMS Concept Verification Suite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          SQL &amp; DBMS Concepts Demonstration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Interactive evaluation of 18 essential DBMS concepts including recursive CTEs, window functions, correlated subqueries, transactions, triggers, and EXPLAIN query plan analysis on live tables.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of 18 Queries */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2 max-h-[750px] overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            18 Evaluated SQL Queries
          </p>

          <div className="space-y-1">
            {queries.map((q, idx) => {
              const isSelected = q.id === selectedQueryId;
              return (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuery(q)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-start space-x-2.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 font-bold ${
                    isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="overflow-hidden">
                    <p className="truncate">{q.title}</p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {q.concept}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: SQL Editor, Execution Engine & Query Plan */}
        <div className="lg:col-span-8 space-y-6">
          {/* Query Details & SQL Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                  {activeQuery.category}
                </span>
                <h2 className="text-base font-bold text-slate-900">{activeQuery.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{activeQuery.description}</p>
              </div>

              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? 'Executing...' : 'Run Query'}</span>
              </button>
            </div>

            {/* SQL Terminal Box */}
            <div className="p-4 bg-slate-950 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed border-b border-slate-800">
              <pre>{customSql}</pre>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <p className="font-bold">Database Query Error:</p>
              <p className="mt-1 font-mono text-[11px]">{error}</p>
            </div>
          )}

          {/* Results Table */}
          {executionResult && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-4">
                  <span>
                    Rows Returned: <strong className="text-slate-900 font-bold">{executionResult.rowCount}</strong>
                  </span>
                  <span>
                    Execution Duration: <strong className="text-blue-600 font-mono">{executionResult.executionTimeMs} ms</strong>
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PostgreSQL 16 Engine</span>
                </span>
              </div>

              <div className="overflow-x-auto max-h-[380px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] sticky top-0 border-b border-slate-200">
                    <tr>
                      {executionResult.columns.map((col: string) => (
                        <th key={col} className="px-4 py-2.5 font-mono">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {executionResult.rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {executionResult.columns.map((col: string) => (
                          <td key={col} className="px-4 py-2.5 max-w-xs truncate text-slate-800">
                            {row[col] === null ? (
                              <span className="text-slate-300 italic">NULL</span>
                            ) : typeof row[col] === 'object' ? (
                              JSON.stringify(row[col])
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* EXPLAIN Query Plan */}
              {executionResult.queryPlan && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                      <Terminal className="w-3.5 h-3.5 text-blue-600" />
                      <span>PostgreSQL Query Execution Plan (EXPLAIN)</span>
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">Cost &amp; Index Analyzer</span>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-300 text-[11px] font-mono rounded-xl overflow-x-auto leading-relaxed">
                    {executionResult.queryPlan}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
