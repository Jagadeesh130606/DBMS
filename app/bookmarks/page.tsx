'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PaperCard from '@/components/PaperCard';
import { Bookmark, BookOpen, Trash2, ArrowLeft } from 'lucide-react';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = () => {
    fetch('/api/bookmarks')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.bookmarks) {
          setBookmarks(data.bookmarks);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleBookmarkToggle = (paperId: number, bookmarked: boolean) => {
    if (!bookmarked) {
      setBookmarks((prev) => prev.filter((p) => p.paper_id !== paperId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading Saved Bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Bookmark className="w-3.5 h-3.5" />
          <span>Curated Personal Repository</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Saved Research Papers
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Retrieved dynamically from PostgreSQL <code className="text-blue-600 font-semibold">user_bookmark_view</code>. Papers saved here influence your personalized semantic recommendations.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Your bookmark collection is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse research papers or perform semantic searches to bookmark impactful literature.
          </p>
          <Link
            href="/papers"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((paper) => (
            <PaperCard
              key={paper.paper_id}
              paper={{
                ...paper,
                isBookmarked: true,
              }}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

