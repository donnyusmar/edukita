import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Layers, CheckSquare, BarChart, History, Award, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    totalStudents: 0,
    totalSubjects: 0,
    totalExercisesCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Gagal mengambil statistik admin');
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Memuat dashboard administrator...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-400">Eror: {error}</div>;
  }

  const managementCards = [
    {
      title: 'Manajemen Mata Pelajaran',
      description: 'Kelola data mata pelajaran (nama, deskripsi, ikon) beserta bab pendukung di dalamnya.',
      link: '/admin/subjects',
      icon: <Layers className="w-6 h-6 text-indigo-400" />,
      color: 'from-indigo-600/20 to-purple-600/10'
    },
    {
      title: 'Manajemen Soal Kuis',
      description: 'Lakukan operasi CRUD soal pilihan ganda lengkap dengan opsi ganda dan kunci jawabannya.',
      link: '/admin/questions',
      icon: <CheckSquare className="w-6 h-6 text-pink-400" />,
      color: 'from-pink-600/20 to-rose-600/10'
    },
    {
      title: 'Monitoring Nilai Siswa',
      description: 'Pantau nilai seluruh murid, hitung nilai rata-rata, filter pencarian, dan unduh laporan CSV.',
      link: '/admin/scores',
      icon: <BarChart className="w-6 h-6 text-cyan-400" />,
      color: 'from-cyan-600/20 to-teal-600/10'
    },
    {
      title: 'Riwayat & Aktivitas Latihan',
      description: 'Periksa catatan audit log pengerjaan kuis siswa secara real-time berdasarkan tanggal.',
      link: '/admin/history',
      icon: <History className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-600/20 to-orange-600/10'
    },
    {
      title: 'Manajemen Gamifikasi',
      description: 'Buat dan modifikasi lencana penghargaan serta kriteria kondisi kelulusan yang dibutuhkan.',
      link: '/admin/gamification',
      icon: <Award className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-600/20 to-green-600/10'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Admin Title */}
      <div>
        <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Konsol Administrator</span>
        <h1 className="text-2xl font-bold text-white mt-1">Dashboard Edukita</h1>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Siswa</span>
            <div className="text-3xl font-extrabold text-white mt-2">{stats.totalStudents}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mata Pelajaran Aktif</span>
            <div className="text-3xl font-extrabold text-white mt-2">{stats.totalSubjects}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Layers className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latihan Diselesaikan</span>
            <div className="text-3xl font-extrabold text-white mt-2">{stats.totalExercisesCompleted}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <CheckSquare className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Management Console Sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Alat Kontrol & Manajemen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementCards.map((card, idx) => (
            <div key={idx} className="glass-card flex flex-col justify-between p-6 rounded-2xl group border border-slate-800/60 hover:border-slate-700/80">
              <div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} border border-slate-800/80 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  {card.icon}
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2 truncate group-hover:text-indigo-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  {card.description}
                </p>
              </div>

              <Link 
                to={card.link}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-indigo-400 hover:text-white bg-indigo-500/5 hover:bg-indigo-600 border border-indigo-500/10 hover:border-transparent transition-all"
              >
                Buka Panel
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
