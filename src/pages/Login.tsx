import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Shield, User, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginProps {
  setUser: (user: any) => void;
}

export default function Login({ setUser }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      setUser(user);
      navigate(user.role === 'admin' ? '/admin' : '/');
    }
  }, [navigate, setUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal. Periksa kembali email dan password.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'murid') => {
    if (role === 'admin') {
      setEmail('admin@test.com');
      setPassword('password123');
    } else {
      setEmail('murid@test.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-3xl relative z-10 border border-slate-800/80 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Masuk ke Edukita
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Platform Belajar & Gamifikasi Terpadu
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm flex items-center gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input block w-full pl-10 pr-3 py-3 text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input block w-full pl-10 pr-3 py-3 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              {loading ? 'Menghubungkan...' : 'Masuk ke Akun'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>

        {/* Demo Quick Credentials */}
        <div className="pt-6 border-t border-slate-800/60 mt-6">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Akun Demo (Klik untuk Isi Otomatis)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickFill('murid')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/30 hover:bg-slate-900/80 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-green-400" />
              Siswa/Murid
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/30 hover:bg-slate-900/80 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              Administrator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
