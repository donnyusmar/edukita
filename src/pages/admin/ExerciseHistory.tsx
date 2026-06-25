import { useState, useEffect } from 'react';
import { History, Calendar, Clock, User } from 'lucide-react';

export default function ExerciseHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/results', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil riwayat latihan');
      const data = await res.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // Calculates difference between start and end time in seconds/minutes
  const getDuration = (startedStr: string, completedStr: string) => {
    const started = new Date(startedStr).getTime();
    const completed = new Date(completedStr).getTime();
    const diffMs = completed - started;
    if (isNaN(diffMs) || diffMs <= 0) return 'Beberapa detik';
    
    const diffSecs = Math.round(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs} Detik`;
    
    const diffMins = Math.floor(diffSecs / 60);
    const remainingSecs = diffSecs % 60;
    return `${diffMins} Menit ${remainingSecs} Detik`;
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Memuat catatan log aktivitas...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-400">Eror: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Konsol Admin</span>
        <h1 className="text-2xl font-bold text-white mt-1">Log Riwayat Latihan</h1>
        <p className="text-slate-400 text-xs mt-1">Audit log real-time pengerjaan kuis latihan oleh seluruh murid.</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl border border-slate-850">
          <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h4 className="text-slate-350 font-bold mb-1">Log Aktivitas Masih Kosong</h4>
          <p className="text-slate-400 text-xs">Belum ada murid yang mengerjakan kuis latihan saat ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((log: any) => (
            <div 
              key={log.id} 
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 shrink-0 mt-1">
                  <User className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">{log.student_name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Mengerjakan <span className="font-semibold text-indigo-400">{log.exercise_title}</span> pada subjek <span className="text-slate-300 font-medium">{log.subject_name}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 md:text-right border-t border-slate-800/40 md:border-none pt-3 md:pt-0">
                <div className="space-y-1">
                  <div className="flex items-center md:justify-end gap-1.5 text-[10px] font-semibold text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Durasi: {getDuration(log.started_at, log.completed_at)}</span>
                  </div>
                  <div className="flex items-center md:justify-end gap-1.5 text-[10px] font-semibold text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Selesai: {new Date(log.completed_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`inline-block font-extrabold text-sm px-3 py-1.5 rounded-xl ${log.score >= 80 ? 'bg-green-500/10 text-green-400' : log.score >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                    {log.score} Poin
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
