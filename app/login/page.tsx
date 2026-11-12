'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Database, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-md mb-3">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Academic Portal Sign In</h2>
          <p className="text-xs text-slate-500 mt-1">Research Paper Discovery &amp; Recommendation Platform</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@research.edu"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm transition shadow-sm flex items-center justify-center space-x-2"
          >
            {loading ? <span>Authenticating...</span> : <><span>Sign In</span> <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* Demo Fast Fill Buttons */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
            One-Click Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handlePreFill('student@research.edu')}
              className="flex items-center justify-center space-x-1.5 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Student Account</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreFill('admin@research.edu')}
              className="flex items-center justify-center space-x-1.5 p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium border border-purple-200 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Account</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

