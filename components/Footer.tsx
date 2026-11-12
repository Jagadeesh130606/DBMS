import React from 'react';
import Link from 'next/link';
import { Database, ShieldCheck, Cpu, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Database className="w-4 h-4 text-blue-400" />
              <span>ScholarVector DBMS</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Multi-Model Research Paper Discovery and Semantic Recommendation System powered by PostgreSQL 16, pgvector cosine search, and MongoDB document storage.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Core Modules</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/papers" className="hover:text-blue-400">Research Paper Catalog</Link></li>
              <li><Link href="/search/keyword" className="hover:text-blue-400">PostgreSQL Full-Text Search</Link></li>
              <li><Link href="/search/semantic" className="hover:text-blue-400">pgvector Semantic Similarity</Link></li>
              <li><Link href="/search/hybrid" className="hover:text-blue-400">Reciprocal Rank Fusion (RRF)</Link></li>
              <li><Link href="/recommendations" className="hover:text-blue-400">Personalized Recommendations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Academic DBMS</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/dbms" className="hover:text-blue-400">18 SQL Query Demonstrations</Link></li>
              <li><Link href="/citations" className="hover:text-blue-400">Recursive CTE Citation Graphs</Link></li>
              <li><Link href="/analytics" className="hover:text-blue-400">MongoDB Aggregation Analytics</Link></li>
              <li><Link href="/authors" className="hover:text-blue-400">Author Productivity Views</Link></li>
              <li><Link href="/areas" className="hover:text-blue-400">Research Area Classifications</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">DBMS Architecture</h4>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center space-x-1.5"><Database className="w-3 h-3 text-blue-400" /> <span>PostgreSQL:</span></span>
                <span className="font-mono text-emerald-400 font-semibold">9 Tables + Views</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center space-x-1.5"><Cpu className="w-3 h-3 text-purple-400" /> <span>pgvector:</span></span>
                <span className="font-mono text-emerald-400 font-semibold">384-dim HNSW</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center space-x-1.5"><Code2 className="w-3 h-3 text-emerald-400" /> <span>MongoDB:</span></span>
                <span className="font-mono text-emerald-400 font-semibold">paper_documents</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">Demo Login: student@research.edu | Password@123</p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500">
          <p>© 2026 ScholarVector Academic Project. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span>Level-3 DBMS Academic Implementation</span>
            <span>ACID Normalized Schema</span>
            <span>Vector Cosine Similarity</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

