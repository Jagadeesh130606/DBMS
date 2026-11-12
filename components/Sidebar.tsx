'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Bookmark, 
  History, 
  Sparkles, 
  Search, 
  Layers, 
  BookOpen, 
  Users, 
  GitFork, 
  Database, 
  BarChart3, 
  ShieldCheck,
  PlusCircle
} from 'lucide-react';

interface SidebarProps {
  role?: 'ADMIN' | 'STUDENT';
}

export default function Sidebar({ role = 'STUDENT' }: SidebarProps) {
  const pathname = usePathname();

  const studentLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/bookmarks', label: 'My Bookmarks', icon: Bookmark },
    { href: '/search-history', label: 'Search History', icon: History },
    { href: '/recommendations', label: 'Recommendations', icon: Sparkles },
    { href: '/papers', label: 'All Papers', icon: BookOpen },
    { href: '/search/semantic', label: 'Semantic Search', icon: Sparkles },
    { href: '/search/hybrid', label: 'Hybrid Search', icon: Layers },
    { href: '/citations', label: 'Citation Explorer', icon: GitFork },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Admin Metrics', icon: ShieldCheck },
    { href: '/admin/papers', label: 'Manage Papers (CRUD)', icon: PlusCircle },
    { href: '/papers', label: 'Paper Directory', icon: BookOpen },
    { href: '/dbms', label: 'DBMS SQL Demos', icon: Database },
    { href: '/analytics', label: 'Database Analytics', icon: BarChart3 },
    { href: '/authors', label: 'Author Directory', icon: Users },
  ];

  const links = role === 'ADMIN' ? adminLinks : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div>
        <div className="mb-6 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Workspace</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {role === 'ADMIN' ? 'Administrator Portal' : 'Student Scholar Hub'}
          </p>
        </div>

        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900">
          <p className="font-semibold text-[11px] flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Dual-Engine Active</span>
          </p>
          <p className="text-[10px] text-blue-700 mt-1">
            PostgreSQL relational core & MongoDB document storage synchronized.
          </p>
        </div>
      </div>
    </aside>
  );
}

