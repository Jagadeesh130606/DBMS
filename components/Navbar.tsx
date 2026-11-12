'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Layers, 
  Bookmark, 
  History, 
  Users, 
  Database, 
  BarChart3, 
  Shield, 
  LogOut, 
  LogIn, 
  UserPlus,
  Compass,
  GitFork,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const navLinks = [
    { href: '/papers', label: 'Papers', icon: BookOpen },
    { href: '/search/keyword', label: 'Keyword Search', icon: Search },
    { href: '/search/semantic', label: 'Semantic Search', icon: Sparkles },
    { href: '/search/hybrid', label: 'Hybrid Search', icon: Layers },
    { href: '/recommendations', label: 'Recommendations', icon: Compass },
    { href: '/citations', label: 'Citations', icon: GitFork },
    { href: '/dbms', label: 'DBMS Demo', icon: Database },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block">Scholar<span className="text-blue-600">Vector</span></span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider block uppercase">Multi-Model DBMS</span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                  className="flex items-center space-x-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                >
                  {user.role === 'ADMIN' ? <Shield className="w-3.5 h-3.5 text-rose-600" /> : <Bookmark className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{user.name.split(' ')[0]}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="flex items-center space-x-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 font-medium"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm font-medium transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Icon className="w-4 h-4 text-blue-600" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-200 flex flex-col space-y-2">
            {user ? (
              <>
                <Link
                  href={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-semibold text-blue-700 bg-blue-50"
                >
                  Dashboard ({user.role}: {user.name})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <div className="flex space-x-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 text-center py-2 text-sm border border-slate-300 rounded-lg font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 text-center py-2 text-sm bg-blue-600 text-white rounded-lg font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

