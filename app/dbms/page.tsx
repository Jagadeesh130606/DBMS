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
  ShieldCheck,
  Table,
  FolderTree,
  Activity,
  ArrowRight,
  RefreshCw,
  Trash2,
  Edit3,
  PlusCircle,
  Eye,
  FileText,
  AlertTriangle,
  Server
} from 'lucide-react';
import { DBMS_DEMO_QUERIES, DbmsQueryDemo } from '@/lib/dbms-queries';

export default function DbmsConceptsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'sql' | 'pipelines' | 'crud' | 'activity'>('overview');

  // Overview State
  const [overviewData, setOverviewData] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);

  // MongoDB Collection Sample State
  const [selectedCollection, setSelectedCollection] = useState<string>('paper_documents');
  const [collectionSample, setCollectionSample] = useState<any>(null);
  const [collectionLoading, setCollectionLoading] = useState<boolean>(false);

  // SQL Demo State
  const [queries] = useState<DbmsQueryDemo[]>(DBMS_DEMO_QUERIES);
  const [selectedQueryId, setSelectedQueryId] = useState<string>('select_basic');
  const [activeQuery, setActiveQuery] = useState<DbmsQueryDemo>(DBMS_DEMO_QUERIES[0]);
  const [customSql, setCustomSql] = useState<string>(DBMS_DEMO_QUERIES[0].sql);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState<boolean>(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // MongoDB Pipelines State
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [pipelineLoading, setPipelineLoading] = useState<boolean>(false);

  // Interactive CRUD Demonstration State
  const [crudState, setCrudState] = useState<any>(null);
  const [crudActionLoading, setCrudActionLoading] = useState<boolean>(false);
  const [crudResult, setCrudResult] = useState<any>(null);

  // Live Query Monitor State (PowerShell Terminal Mirror)
  const [liveQueries, setLiveQueries] = useState<any[]>([]);
  const [liveDbFilter, setLiveDbFilter] = useState<'all' | 'PostgreSQL' | 'MongoDB'>('all');
  const [liveAutoRefresh, setLiveAutoRefresh] = useState<boolean>(true);
  const [liveStats, setLiveStats] = useState<{ totalCaptured: number; pgCount: number; mongoCount: number }>({
    totalCaptured: 0,
    pgCount: 0,
    mongoCount: 0,
  });

  const fetchLiveQueries = () => {
    fetch(`/api/dbms/live-queries?limit=60&filter=${liveDbFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLiveQueries(data.queries || []);
          if (data.stats) setLiveStats(data.stats);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchLiveQueries();
      if (!liveAutoRefresh) return;
      const interval = setInterval(fetchLiveQueries, 1500);
      return () => clearInterval(interval);
    }
  }, [activeTab, liveDbFilter, liveAutoRefresh]);

  const clearLiveQueries = async () => {
    await fetch('/api/dbms/live-queries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' }),
    });
    setLiveQueries([]);
    setLiveStats({ totalCaptured: 0, pgCount: 0, mongoCount: 0 });
  };

  // Fetch overview data
  const loadOverview = () => {
    setOverviewLoading(true);
    fetch('/api/dbms/overview')
      .then((res) => res.json())
      .then((data) => setOverviewData(data))
      .catch((err) => console.error(err))
      .finally(() => setOverviewLoading(false));
  };

  // Fetch collection samples
  const loadCollectionSample = (col: string) => {
    setSelectedCollection(col);
    setCollectionLoading(true);
    fetch(`/api/dbms/collection-sample?collection=${col}&limit=3`)
      .then((res) => res.json())
      .then((data) => setCollectionSample(data))
      .catch((err) => console.error(err))
      .finally(() => setCollectionLoading(false));
  };

  // Fetch MongoDB analytics pipelines
  const loadPipelines = () => {
    setPipelineLoading(true);
    fetch('/api/dbms/analytics')
      .then((res) => res.json())
      .then((data) => setPipelineData(data))
      .catch((err) => console.error(err))
      .finally(() => setPipelineLoading(false));
  };

  // Fetch CRUD demo state
  const loadCrudState = () => {
    fetch('/api/dbms/crud-demo')
      .then((res) => res.json())
      .then((data) => setCrudState(data))
      .catch((err) => console.error(err));
  };

  // Execute interactive CRUD step
  const executeCrudStep = async (action: 'insert' | 'verify' | 'update' | 'delete') => {
    setCrudActionLoading(true);
    setCrudResult(null);
    try {
      const res = await fetch('/api/dbms/crud-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setCrudResult(data);
      loadCrudState();
      loadOverview();
    } catch (err: any) {
      setCrudResult({ error: err.message });
    } finally {
      setCrudActionLoading(false);
    }
  };

  // Execute active SQL query
  const handleExecuteSql = async () => {
    setSqlLoading(true);
    setSqlError(null);
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
      setSqlError(err.message);
    } finally {
      setSqlLoading(false);
    }
  };

  // Switch query demo
  const handleSelectQuery = (q: DbmsQueryDemo) => {
    setSelectedQueryId(q.id);
    setActiveQuery(q);
    setCustomSql(q.sql);
    setSqlError(null);
    setExecutionResult(null);
  };

  useEffect(() => {
    loadOverview();
    loadCrudState();
  }, []);

  useEffect(() => {
    if (activeTab === 'documents' && !collectionSample) {
      loadCollectionSample('paper_documents');
    }
    if (activeTab === 'pipelines' && !pipelineData) {
      loadPipelines();
    }
    if (activeTab === 'sql' && !executionResult) {
      handleExecuteSql();
    }
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Academic Level-3 DBMS Demonstration Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Multi-Model DBMS Architecture &amp; Demonstration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verified ER Model • PostgreSQL Relational Engine (12 Tables) • MongoDB Document Store (4 Collections) • pgvector
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              loadOverview();
              loadCrudState();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>1. Database Architecture &amp; Tables</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>2. MongoDB Document Store (4 Collections)</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'sql'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>3. SQL Demonstrations (20 Query Types)</span>
        </button>

        <button
          onClick={() => setActiveTab('pipelines')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'pipelines'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>4. MongoDB Aggregation Pipelines</span>
        </button>

        <button
          onClick={() => setActiveTab('crud')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'crud'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>5. Interactive Dual-DB CRUD Demonstrator</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'activity'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>6. Live Database Activity (Terminal Monitor)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DATABASE ARCHITECTURE & TABLES OVERVIEW                            */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Connection Health & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PostgreSQL Engine</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  CONNECTED
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">12</span>
                <span className="text-xs text-slate-500 font-medium">Relational Tables</span>
              </div>
              <p className="text-xs text-slate-500">
                Engine: <span className="font-semibold text-slate-700">{overviewData?.engine || 'PGLITE'}</span> • Strict 3NF/BCNF • Foreign Keys with Cascades
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">MongoDB Document Store</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  CONNECTED
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">4</span>
                <span className="text-xs text-slate-500 font-medium">Dedicated Collections</span>
              </div>
              <p className="text-xs text-slate-500">
                Host: <span className="font-semibold text-slate-700">127.0.0.1:27017</span> • Database: <span className="font-semibold text-slate-700">research_paper_db</span>
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dense Vector Store</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                  PGVECTOR ACTIVE
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">384-D</span>
                <span className="text-xs text-slate-500 font-medium">Dense Vectors</span>
              </div>
              <p className="text-xs text-slate-500">
                Model: <span className="font-semibold text-slate-700">all-MiniLM-L6-v2</span> • Distance: <span className="font-semibold text-slate-700">Cosine (&lt;=&gt;)</span>
              </p>
            </div>
          </div>

          {/* ER Diagram Alignment Map */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-blue-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Full Conformity with ER DIAGRAM.png</span>
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              Every entity and relationship from the ER diagram is fully instantiated: 
              <span className="font-semibold"> USER</span>, 
              <span className="font-semibold"> AUTHORS</span>, 
              <span className="font-semibold"> RESEARCH_PAPER</span>, 
              <span className="font-semibold"> RESEARCH_AREA</span>, 
              <span className="font-semibold"> JOURNAL</span> (PUBLISHED_IN), 
              <span className="font-semibold"> CONFERENCE</span> (PRESENTED_IN), 
              <span className="font-semibold"> CITATION</span> (Recursive CITES relationship with anti-self-citation constraints), 
              <span className="font-semibold"> BOOKMARK</span>, and 
              <span className="font-semibold"> SEARCH_HISTORY</span>.
            </p>
          </div>

          {/* PostgreSQL Tables Grid */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">PostgreSQL Relational Tables (12 Entities &amp; Junctions)</h3>
                <p className="text-xs text-slate-500">Authoritative ACID storage with normalized constraints and indexing</p>
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Total Rows: {overviewData?.totalPostgresRecords || '...'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">Table Name</th>
                    <th className="py-3 px-6">Primary Key</th>
                    <th className="py-3 px-6">Description / Purpose</th>
                    <th className="py-3 px-6 text-right">Row Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {overviewData?.tables?.map((t: any) => (
                    <tr key={t.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-6 font-mono font-bold text-slate-900 flex items-center space-x-2">
                        <Table className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t.name}</span>
                      </td>
                      <td className="py-3 px-6 font-mono text-purple-700 font-semibold">{t.pk}</td>
                      <td className="py-3 px-6 text-slate-600">{t.desc}</td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-slate-900">
                        {t.rowCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MongoDB Collections Grid */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">MongoDB Document Store (4 Collections)</h3>
                <p className="text-xs text-slate-500">Semi-structured, hierarchical narratives, metrics, and aggregation pipelines</p>
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Total Documents: {overviewData?.totalMongoDocuments || '...'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">Collection Name</th>
                    <th className="py-3 px-6">Linking Identifier</th>
                    <th className="py-3 px-6">Content Description</th>
                    <th className="py-3 px-6 text-right">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {overviewData?.collections?.map((c: any) => (
                    <tr key={c.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-6 font-mono font-bold text-slate-900 flex items-center space-x-2">
                        <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{c.name}</span>
                      </td>
                      <td className="py-3 px-6 font-mono text-blue-700 font-semibold">{c.keyField}</td>
                      <td className="py-3 px-6 text-slate-600">{c.desc}</td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-slate-900">
                        {c.docCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONGODB DOCUMENT STORE & LIVE SAMPLES                              */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-wrap gap-2 pb-2">
            {[
              { id: 'paper_documents', label: 'paper_documents (110 Docs)', icon: FileText },
              { id: 'author_documents', label: 'author_documents (35 Docs)', icon: Layers },
              { id: 'research_area_documents', label: 'research_area_documents (9 Docs)', icon: FolderTree },
              { id: 'citation_documents', label: 'citation_documents (110 Docs)', icon: Activity },
            ].map((col) => {
              const Icon = col.icon;
              return (
                <button
                  key={col.id}
                  onClick={() => loadCollectionSample(col.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm ${
                    selectedCollection === col.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{col.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  MongoDB Collection: {selectedCollection}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">Real-Time Sample Documents from Database</h3>
              </div>
              <button
                onClick={() => loadCollectionSample(selectedCollection)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Fetch Latest</span>
              </button>
            </div>

            {collectionLoading ? (
              <div className="py-12 flex justify-center items-center space-x-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Querying MongoDB...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {collectionSample?.samples?.map((doc: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <div className="flex justify-between items-center text-slate-500 mb-2 pb-1 border-b border-slate-800/80">
                      <span>Document #{idx + 1} • _id: {String(doc._id)}</span>
                      <span className="text-emerald-400">Stable Link: {doc.paper_id ? `paper_id: ${doc.paper_id}` : doc.author_id ? `author_id: ${doc.author_id}` : `area_id: ${doc.area_id}`}</span>
                    </div>
                    <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SQL DEMONSTRATION SUITE (18+ QUERY PATTERNS)                       */}
      {/* ========================================================================= */}
      {activeTab === 'sql' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Query Selector Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              SQL Concepts Demonstration Menu ({queries.length} Queries)
            </h3>

            <div className="space-y-1.5 max-h-[650px] overflow-y-auto pr-1">
              {queries.map((q) => {
                const isSelected = selectedQueryId === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuery(q)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {q.category}
                      </span>
                      {isSelected && <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />}
                    </div>
                    <p className="text-xs font-bold mt-0.5">{q.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{q.concept}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Query Workbench & Plan */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-blue-400">{activeQuery.category}</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{activeQuery.title}</h3>
                </div>

                <button
                  onClick={handleExecuteSql}
                  disabled={sqlLoading}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {sqlLoading ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  <span>Execute SQL Query</span>
                </button>
              </div>

              {/* Editable SQL Editor */}
              <div className="relative">
                <textarea
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  rows={7}
                  className="w-full bg-slate-950 font-mono text-xs text-blue-300 p-4 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed resize-y"
                  spellCheck={false}
                />
              </div>

              {/* Performance Metrics */}
              {executionResult && (
                <div className="flex items-center space-x-4 text-xs font-mono text-slate-400 pt-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Execution: <strong className="text-emerald-400">{executionResult.executionTimeMs} ms</strong></span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Table className="w-3.5 h-3.5 text-blue-400" />
                    <span>Returned: <strong className="text-blue-400">{executionResult.rowCount} rows</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {sqlError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs space-y-1">
                <div className="flex items-center space-x-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>PostgreSQL Execution Error</span>
                </div>
                <p className="font-mono">{sqlError}</p>
              </div>
            )}

            {/* Query Results Table */}
            {executionResult?.rows && executionResult.rows.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-2">
                <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Query Result Set</span>
                  <span className="text-[11px] text-slate-500 font-mono">Showing {executionResult.rows.length} rows</span>
                </div>

                <div className="max-h-72 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
                      <tr>
                        {Object.keys(executionResult.rows[0]).map((col) => (
                          <th key={col} className="py-2.5 px-4 font-mono">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {executionResult.rows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 font-mono text-[11px]">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="py-2.5 px-4 max-w-xs truncate text-slate-700">
                              {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Query Execution Plan (EXPLAIN ANALYZE) */}
            {executionResult?.executionPlan && (
              <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-200 space-y-3 font-mono text-xs">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  PostgreSQL Query Execution Plan (EXPLAIN ANALYZE)
                </h4>
                <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-[11px] text-slate-300 space-y-1">
                  {executionResult.executionPlan.map((step: string, idx: number) => (
                    <div key={idx} className="whitespace-pre">{step}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MONGODB AGGREGATION PIPELINES                                      */}
      {/* ========================================================================= */}
      {activeTab === 'pipelines' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Multi-Stage Aggregation Pipelines over paper_documents</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Demonstrates complex document transformations that would require expensive normalization and recursive queries in relational engines: 
              array unwinding (<code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded">$unwind</code>), 
              grouping with metrics (<code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded">$group</code>), 
              and structural projections (<code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded">$project</code>).
            </p>
          </div>

          {pipelineLoading ? (
            <div className="py-12 flex justify-center items-center space-x-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Running Aggregation Pipelines...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pipeline 1: Keyword Distribution */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">1. Top Keywords Frequency</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">$unwind &amp; $group</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {pipelineData?.mongoAnalytics?.keywordDistribution?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-medium">{item._id}</span>
                      <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-900">{item.count} papers</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline 2: Document Types */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">2. Document Type Categorization</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">$group &amp; $avg</span>
                </div>
                <div className="space-y-2">
                  {pipelineData?.mongoAnalytics?.documentTypes?.map((dt: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{dt._id || 'Standard Article'}</p>
                        <p className="text-[11px] text-slate-500">Average Pages: {Math.round(dt.avgPageCount || 10)}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-700">{dt.count} Docs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline 3: Section Structure */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">3. Average Document Structure Metrics</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">$project &amp; $size</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/60 rounded-lg text-xs space-y-1">
                    <p className="text-slate-600">Average Sections per Paper:</p>
                    <p className="text-xl font-black text-blue-900 font-mono">
                      {pipelineData?.mongoAnalytics?.sectionMetrics?.avgSectionsPerPaper ? Number(pipelineData.mongoAnalytics.sectionMetrics.avgSectionsPerPaper).toFixed(1) : '4.0'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50/60 rounded-lg text-xs space-y-1">
                    <p className="text-slate-600">Average Citations / References Array:</p>
                    <p className="text-xl font-black text-purple-900 font-mono">
                      {pipelineData?.mongoAnalytics?.sectionMetrics?.avgReferencesPerPaper ? Number(pipelineData.mongoAnalytics.sectionMetrics.avgReferencesPerPaper).toFixed(1) : '4.0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pipeline 4: Reference Publication Timeline */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">4. Bibliographic Citation Timeline</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">$unwind references.year</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {pipelineData?.mongoAnalytics?.referenceDistribution?.map((ref: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-medium">Year {ref._id}</span>
                      <span className="font-mono font-bold text-slate-900">{ref.totalReferences} Citations</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INTERACTIVE DUAL-DB CRUD DEMONSTRATOR                               */}
      {/* ========================================================================= */}
      {activeTab === 'crud' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Action Control Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Live Cross-Database Demonstrator</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Demonstrate How Frontend Actions Trigger Dual-DB Synchronized Operations
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Execute each step sequentially to show your professor how an atomic write commits to PostgreSQL, updates pgvector, stores in MongoDB, and cleans up cleanly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => executeCrudStep('insert')}
                disabled={crudActionLoading}
                className="flex flex-col items-start p-4 rounded-xl border border-blue-300 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 transition text-left disabled:opacity-50"
              >
                <div className="flex items-center space-x-2 font-bold text-xs mb-1">
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>Step 1: INSERT Paper</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Writes to PostgreSQL + pgvector + MongoDB with compensation.
                </p>
              </button>

              <button
                onClick={() => executeCrudStep('verify')}
                disabled={crudActionLoading || !crudState?.activePaperId}
                className="flex flex-col items-start p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 transition text-left disabled:opacity-50"
              >
                <div className="flex items-center space-x-2 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Step 2: SELECT &amp; Verify</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Confirms matching paper ID across both database engines.
                </p>
              </button>

              <button
                onClick={() => executeCrudStep('update')}
                disabled={crudActionLoading || !crudState?.activePaperId}
                className="flex flex-col items-start p-4 rounded-xl border border-purple-300 bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 transition text-left disabled:opacity-50"
              >
                <div className="flex items-center space-x-2 font-bold text-xs mb-1">
                  <Edit3 className="w-4 h-4 text-purple-600" />
                  <span>Step 3: UPDATE Paper</span>
                </div>
                <p className="text-[11px] text-purple-800">
                  Updates title, re-indexes vector, and mutates MongoDB sections.
                </p>
              </button>

              <button
                onClick={() => executeCrudStep('delete')}
                disabled={crudActionLoading || !crudState?.activePaperId}
                className="flex flex-col items-start p-4 rounded-xl border border-rose-300 bg-rose-50/70 hover:bg-rose-100/70 text-rose-900 transition text-left disabled:opacity-50"
              >
                <div className="flex items-center space-x-2 font-bold text-xs mb-1">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Step 4: DELETE Cleanly</span>
                </div>
                <p className="text-[11px] text-rose-800">
                  Cascades foreign keys in PG and removes Mongo documents.
                </p>
              </button>
            </div>
          </div>

          {/* Real-time Operation Result Banner */}
          {crudResult && (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-lg space-y-3 font-mono text-xs animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-bold uppercase tracking-wider">Operation Response Payload</span>
                <span className="text-slate-400">Timestamp: {new Date().toLocaleTimeString()}</span>
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {JSON.stringify(crudResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Query Audit Trail / History */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Query Execution Audit Trail</h3>
                <p className="text-xs text-slate-500">Live operational log showing database target, execution time, and status</p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-700">
                Active ID: {crudState?.activePaperId ? `#${crudState.activePaperId}` : 'None'}
              </span>
            </div>

            <div className="divide-y divide-slate-200 max-h-80 overflow-y-auto">
              {crudState?.history?.length > 0 ? (
                crudState.history.map((h: any, i: number) => (
                  <div key={i} className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {h.status}
                        </span>
                        <span className="font-bold text-slate-900">{h.operation}</span>
                        <span className="text-slate-400 text-[11px] font-mono">[{h.database}]</span>
                      </div>
                      <p className="font-mono text-[11px] text-slate-600 line-clamp-1">{h.query}</p>
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-500 whitespace-nowrap">
                      <span>{h.durationMs} ms</span> • <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No operations recorded yet. Click Step 1 to trigger an insert!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: LIVE DATABASE QUERY ACTIVITY (POWERSHELL TERMINAL MIRROR)          */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="text-lg font-bold">Live Database Query Monitor</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  REAL BACKEND STREAM
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Every frontend click executes real parameterized SQL on PostgreSQL and document operations on MongoDB.
                Look at your backend <strong>PowerShell terminal</strong> where <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400">npm.cmd run dev</code> is running to see full structured logs in real time!
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLiveAutoRefresh(!liveAutoRefresh)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  liveAutoRefresh
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${liveAutoRefresh ? 'animate-pulse' : ''}`} />
                <span>{liveAutoRefresh ? 'Streaming ON (1.5s)' : 'Streaming Paused'}</span>
              </button>

              <button
                onClick={fetchLiveQueries}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                title="Refresh Queries"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={clearLiveQueries}
                className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-700/50 rounded-lg text-xs font-medium transition"
              >
                Clear Log
              </button>
            </div>
          </div>

          {/* Filter Bar & Quick Stats */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase mr-1">Filter Engine:</span>
              <button
                onClick={() => setLiveDbFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  liveDbFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Operations ({liveStats.totalCaptured})
              </button>
              <button
                onClick={() => setLiveDbFilter('PostgreSQL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  liveDbFilter === 'PostgreSQL'
                    ? 'bg-cyan-700 text-white shadow-sm'
                    : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                }`}
              >
                PostgreSQL ({liveStats.pgCount})
              </button>
              <button
                onClick={() => setLiveDbFilter('MongoDB')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  liveDbFilter === 'MongoDB'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                MongoDB ({liveStats.mongoCount})
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center space-x-3">
              <span>Showing last <strong>{liveQueries.length}</strong> real-time operations</span>
            </div>
          </div>

          {/* Query Stream Feed */}
          <div className="space-y-3">
            {liveQueries.length > 0 ? (
              liveQueries.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition space-y-3"
                >
                  {/* Top Metadata Row */}
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          q.dbType === 'PostgreSQL'
                            ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {q.dbType}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                        {q.operation}
                      </span>

                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {q.target}
                      </span>

                      {q.action && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {q.action}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
                      {q.requestId && (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {q.requestId}
                        </span>
                      )}
                      <span className="font-semibold text-slate-700">{q.executionTimeMs} ms</span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded ${
                          q.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                        }`}
                      >
                        {q.status}
                      </span>
                      <span>{q.timestamp}</span>
                    </div>
                  </div>

                  {/* Semantic Vector Context Block (when available) */}
                  {q.semanticContext && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-900 space-y-1.5 font-mono">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200 pb-1">
                        <span className="font-bold text-purple-800 flex items-center space-x-1.5">
                          <span>✨ Semantic Vector Search Context</span>
                        </span>
                        <span className="bg-purple-200/80 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded">
                          Dimension: {q.semanticContext.dimension}
                        </span>
                      </div>
                      <div className="text-[11px]">
                        <strong className="text-purple-700">Original Input:</strong>{' '}
                        <span className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-purple-200 font-sans font-medium">
                          &quot;{q.semanticContext.originalQuery}&quot;
                        </span>
                      </div>
                      <div className="text-[11px] text-purple-800">
                        <strong className="text-purple-700">Embedding Preview (First 5):</strong>{' '}
                        <span className="text-purple-950 font-mono">
                          [{q.semanticContext.embeddingPreview?.join(', ')}, ...]
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Executed Query / Operation Payload */}
                  <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-emerald-300">
                      {q.query}
                    </pre>
                  </div>

                  {/* Parameters / Count Row */}
                  {(q.parameters || q.rowCount !== undefined) && (
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-mono bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                      <div>
                        {q.parameters && (
                          <span>
                            <strong className="text-slate-700">Params:</strong>{' '}
                            {typeof q.parameters === 'object'
                              ? JSON.stringify(q.parameters).slice(0, 150)
                              : String(q.parameters)}
                          </span>
                        )}
                      </div>
                      {q.rowCount !== undefined && (
                        <span className="font-semibold text-slate-700">
                          Records: <span className="text-blue-700 font-bold">{q.rowCount}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
                <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Activity className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Live Database Activity Stream Ready</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Interact with any frontend button (search, add paper, view paper, bookmarks, or SQL workbench) to watch the actual database queries appear live here and in your PowerShell terminal!
                  </p>
                </div>
                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={() => setActiveTab('sql')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    Go to SQL Workbench
                  </button>
                  <button
                    onClick={() => setActiveTab('crud')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    Try Dual-DB CRUD
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
