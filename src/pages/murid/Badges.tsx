import { useState, useEffect } from 'react';
import { Award, Star, Shield, HelpCircle, Calendar } from 'lucide-react';

export default function MuridBadges() {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/badges', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Gagal memuat lencana prestasi');
        const data = await res.json();
        setBadges(data);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan sistem');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400 font-semibold">Memuat koleksi lencana prestasi...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-400 font-semibold">Eror: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Gamifikasi Prestasi</span>
        <h1 className="text-2xl font-bold text-white mt-1">Koleksi Lencana Saya</h1>
        <p className="text-slate-400 text-xs mt-1">
          Kumpulkan lencana baru dengan menjawab kuis secara sempurna atau menyelesaikan pembelajaran bab.
        </p>
      </div>

      {badges.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl border border-slate-850 flex flex-col items-center justify-center">
          <Award className="w-16 h-16 text-slate-600 mb-4" />
          <h4 className="text-slate-300 font-bold mb-1">Koleksi Lencana Masih Kosong</h4>
          <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
            Selesaikan kuis latihan di Mata Pelajaran pertama kamu untuk mendapatkan lencana perdana!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((sb: any) => (
            <div key={sb.id} className="glass-card p-6 rounded-2xl relative overflow-hidden flex items-start gap-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl" />

              {/* Badge Icon Cylinder */}
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-3xl shadow-lg shadow-yellow-500/5 shrink-0 animate-pulse">
                {sb.icon === 'Award' ? '🏆' : sb.icon === 'Star' ? '⭐' : '🏅'}
              </div>

              <div className="space-y-2 overflow-hidden">
                <div>
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded uppercase">
                    {sb.subject_name}
                  </span>
                  <h3 className="font-bold text-slate-100 text-base mt-2 truncate">
                    {sb.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Didapatkan pada pencapaian kuis dengan kriteria {sb.condition_type === 'perfect_score' ? 'skor 100%' : 'menyelesaikan kuis'}.
                </p>

                <div className="flex items-center gap-1.5 pt-1 text-[10px] font-semibold text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Diterima: {new Date(sb.earned_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
