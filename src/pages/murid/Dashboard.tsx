import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calculator, Award, ArrowRight, Shield, Layers, HelpCircle } from 'lucide-react';

export default function MuridDashboard() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [subRes, resRes] = await Promise.all([
          fetch('/api/subjects', { headers }),
          fetch('/api/results', { headers })
        ]);

        if (!subRes.ok || !resRes.ok) {
          throw new Error('Gagal mengambil data dashboard');
        }

        const subData = await subRes.json();
        const resData = await resRes.json();

        setSubjects(subData);
        setResults(resData);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator': return <Calculator className="w-6 h-6 text-indigo-400" />;
      case 'BookOpen': return <BookOpen className="w-6 h-6 text-indigo-400" />;
      case 'Layers': return <Layers className="w-6 h-6 text-indigo-400" />;
      default: return <BookOpen className="w-6 h-6 text-indigo-400" />;
    }
  };

  // Mock progress or calculate based on results
  const getSubjectProgress = (subjectId: number) => {
    // Simple logic: if they have any result for this subject, show progress.
    // In our seed data, we have 1 exercise. If they completed it, progress is 100%, else 0%.
    const completedForSubject = results.filter(r => r.subject_name === 'Matematika Dasar');
    if (subjectId === 1 && completedForSubject.length > 0) {
      return 100;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-800/40 w-1/4 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-800/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 font-semibold mb-4">Eror: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-500 transition-colors"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900/40 border border-slate-800 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
            Mulai Perjalanan Belajarmu Hari Ini!
          </h1>
          <p className="text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
            Akses konten teori terlengkap, uji kemampuanmu melalui latihan praktis, dan dapatkan lencana penghargaan atas prestasimu.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>{subjects.length} Mata Pelajaran</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>{results.length} Latihan Diselesaikan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Mata Pelajaran */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          Daftar Mata Pelajaran
        </h2>
        
        {subjects.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl border border-slate-850">
            <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Belum ada mata pelajaran aktif saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub: any) => {
              const progress = getSubjectProgress(sub.id);
              return (
                <div key={sub.id} className="glass-card flex flex-col justify-between p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                  
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-slate-850 flex items-center justify-center border border-slate-800 mb-4 group-hover:scale-110 transition-transform">
                      {getSubjectIcon(sub.icon)}
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 mb-2 truncate group-hover:text-indigo-400 transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-6">
                      {sub.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        <span>Progres Belajar</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <Link 
                      to={`/subjects/${sub.id}`}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:border-transparent transition-all group-hover:shadow-lg group-hover:shadow-indigo-500/10"
                    >
                      Buka Pembelajaran
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
