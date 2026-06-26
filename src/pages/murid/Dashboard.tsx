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

  // Calculate progress based on unique completed exercises per subject
  const getSubjectProgress = (subjectId: number, subjectName: string) => {
    const uniqueCompleted = new Set(
      results
        .filter(r => r.subject_name === subjectName)
        .map(r => r.exercise_id)
    ).size;

    if (subjectId === 1) {
      // Matematika Dasar has 1 exercise
      return Math.min(100, Math.round((uniqueCompleted / 1) * 100));
    } else if (subjectId === 2) {
      // Hafalan Perkalian 1-10 has 10 exercises
      return Math.min(100, Math.round((uniqueCompleted / 10) * 100));
    }
    return uniqueCompleted > 0 ? 100 : 0;
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900/40 border border-slate-800 p-6 md:p-10 shadow-2xl">
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
              const progress = getSubjectProgress(sub.id, sub.name);
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

      {/* Riwayat Latihan Per Hari / Minggu */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-500" />
          Riwayat Latihan Saya
        </h2>
        
        {results.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl border border-slate-850">
            <Award className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Kamu belum pernah mengerjakan latihan. Ayo mulai belajar!</p>
          </div>
        ) : (
          <HistoryLog results={results} />
        )}
      </div>
    </div>
  );
}

// ─── History Log Component ────────────────────────────────────────────────────
function HistoryLog({ results }: { results: any[] }) {
  const [activeWeek, setActiveWeek] = useState(0);

  // Group results by ISO week
  const getWeekKey = (dateStr: string) => {
    const d = new Date(dateStr);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  };

  const getWeekLabel = (weekKey: string) => {
    const [year, wPart] = weekKey.split('-W');
    const weekNum = parseInt(wPart);
    // Compute the Monday of that week
    const jan1 = new Date(parseInt(year), 0, 1);
    const dayOfWeek = jan1.getDay() || 7;
    const monday = new Date(jan1.getTime() + (weekNum - 1) * 7 * 86400000 - (dayOfWeek - 1) * 86400000);
    const sunday = new Date(monday.getTime() + 6 * 86400000);
    return `${monday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  // Group by day within each week
  const getDayKey = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Build week groups (sorted newest first)
  const weekMap: Record<string, any[]> = {};
  results.forEach(r => {
    const wk = getWeekKey(r.completed_at);
    if (!weekMap[wk]) weekMap[wk] = [];
    weekMap[wk].push(r);
  });
  const weeks = Object.keys(weekMap).sort((a, b) => b.localeCompare(a));

  if (weeks.length === 0) return null;

  const currentWeekKey = weeks[activeWeek] || weeks[0];
  const weekResults = weekMap[currentWeekKey] || [];

  // Group by day
  const dayMap: Record<string, any[]> = {};
  weekResults.forEach(r => {
    const dk = getDayKey(r.completed_at);
    if (!dayMap[dk]) dayMap[dk] = [];
    dayMap[dk].push(r);
  });
  const days = Object.keys(dayMap).sort((a, b) => {
    const da = weekResults.find(r => getDayKey(r.completed_at) === a)?.completed_at;
    const db = weekResults.find(r => getDayKey(r.completed_at) === b)?.completed_at;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
      {/* Week Navigator */}
      <div className="flex overflow-x-auto border-b border-slate-800/60 bg-slate-900/40">
        {weeks.map((wk, idx) => (
          <button
            key={wk}
            onClick={() => setActiveWeek(idx)}
            className={`flex-shrink-0 px-5 py-3.5 text-xs font-bold transition-all border-b-2 ${
              activeWeek === idx
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {idx === 0 ? '📅 Minggu Ini' : `Minggu ${idx + 1}`}
            <span className="block text-[10px] font-medium text-slate-500 mt-0.5">{getWeekLabel(wk)}</span>
          </button>
        ))}
      </div>

      {/* Day Groups */}
      <div className="divide-y divide-slate-800/40">
        {days.map(day => (
          <div key={day} className="p-4 md:p-6">
            {/* Day Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-slate-800/60" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2">{day}</span>
              <div className="h-px flex-1 bg-slate-800/60" />
            </div>

            {/* Results for this day */}
            <div className="space-y-2">
              {dayMap[day].map((res: any) => {
                const isPerfect = res.score === 100;
                const isPass = res.score >= 70;
                return (
                  <div key={res.id} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/50 transition-all group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isPerfect ? 'bg-yellow-400' : isPass ? 'bg-green-400' : 'bg-amber-400'}`} />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-indigo-300 truncate">{res.subject_name}</p>
                        <p className="text-sm font-medium text-slate-200 truncate">{res.exercise_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                        isPerfect
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : isPass
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {res.score}/100
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(res.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Link
                        to={`/results/${res.id}`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:border-transparent text-xs font-bold text-indigo-400 hover:text-white transition-all"
                      >
                        Lihat Hasil
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
