'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, BookOpen, GitFork, ArrowRight, Database } from 'lucide-react';

export default function ResearchAreasPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/areas')
      .then((res) => res.json())
      .then((data) => setAreas(data.areas || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Layers className="w-3.5 h-3.5" />
          <span>Taxonomical Categorization</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Research Areas &amp; Academic Domains
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore research papers categorized across {areas.length} computer science specializations linked through <code className="text-blue-600 font-semibold">PAPER_AREA</code> composite keys.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse space-y-3">
              <div className="h-6 bg-slate-200 rounded w-2/3" />
              <div className="h-16 bg-slate-100 rounded" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {areas.map((area) => (
            <div
              key={area.area_id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  #{area.area_id}
                </div>

                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                  {area.area_name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {area.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-extrabold text-slate-900 block">{area.paper_count} Papers</span>
                  <span className="text-[11px] text-blue-600 font-semibold">{area.total_citations} Citations</span>
                </div>

                <Link
                  href={`/papers?areaId=${area.area_id}`}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

