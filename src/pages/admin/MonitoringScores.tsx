import { useState, useEffect } from 'react';
import { Download, Search, BarChart2, Calendar, FileSpreadsheet } from 'lucide-react';

export default function MonitoringScores() {
  const [results, setResults] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [studentSearch, setStudentSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/results', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil data monitoring nilai');
      const data = await res.json();
      setResults(data);
      setFilteredResults(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // Run filter logic whenever filter states or raw results change
  useEffect(() => {
    let output = [...results];

    // Filter by student name/email
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      output = output.filter(r => 
        r.student_name.toLowerCase().includes(q) || 
        r.email?.toLowerCase().includes(q)
      );
    }

    // Filter by subject name
    if (subjectFilter) {
      output = output.filter(r => r.subject_name === subjectFilter);
    }

    // Filter by date (YYYY-MM-DD matches start of timestamp)
    if (dateFilter) {
      output = output.filter(r => r.completed_at.startsWith(dateFilter));
    }

    setFilteredResults(output);
  }, [studentSearch, subjectFilter, dateFilter, results]);

  // Compute stats
  const averageScore = filteredResults.length > 0 
    ? Math.round(filteredResults.reduce((acc, curr) => acc + curr.score, 0) / filteredResults.length)
    : 0;

  // Extract unique subjects for filter options
  const uniqueSubjects = Array.from(new Set(results.map(r => r.subject_name)));

  // Export CSV Function
  const exportToCSV = () => {
    if (filteredResults.length === 0) return;

    // CSV Headers
    const headers = ['Nama Siswa', 'Mata Pelajaran', 'Latihan', 'Skor', 'Tanggal Selesai'];
    
    // CSV Rows
    const rows = filteredResults.map(r => [
      r.student_name,
      r.subject_name,
      r.exercise_title,
      r.score,
      new Date(r.completed_at).toLocaleString('id-ID')
    ]);

    // Build content
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_nilai_edukita_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Memuat data monitoring nilai...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-400">Eror: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Title & Download */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Konsol Admin</span>
          <h1 className="text-2xl font-bold text-white mt-1">Monitoring Nilai Siswa</h1>
        </div>
        
        <button
          onClick={exportToCSV}
          disabled={filteredResults.length === 0}
          className="flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-emerald-500/10"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor Rekap (CSV)
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nilai Rata-Rata</span>
            <div className="text-3xl font-extrabold text-indigo-400 mt-2">{averageScore} / 100</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <BarChart2 className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah Data Terfilter</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{filteredResults.length} Rekor</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cari Nama Murid</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="glass-input w-full pl-9 pr-3 py-2 text-xs"
              placeholder="Cari murid..."
            />
          </div>
        </div>

        {/* Filter Subject */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mata Pelajaran</label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="glass-input w-full py-2 px-3 text-xs mt-2"
          >
            <option value="">Semua Pelajaran</option>
            {uniqueSubjects.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
          </select>
        </div>

        {/* Filter Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Selesai</label>
          <div className="relative mt-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="glass-input w-full py-1.5 px-3 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Scores Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold text-slate-450">
                <th className="py-4 px-6">Nama Siswa</th>
                <th className="py-4 px-6">Mata Pelajaran</th>
                <th className="py-4 px-6">Latihan Kuis</th>
                <th className="py-4 px-6 text-center">Skor</th>
                <th className="py-4 px-6">Tanggal Pengerjaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">
                    Tidak ada catatan nilai yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-200">{r.student_name}</td>
                    <td className="py-4 px-6 text-slate-400">{r.subject_name}</td>
                    <td className="py-4 px-6 text-slate-400">{r.exercise_title}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block font-extrabold px-2.5 py-1 rounded-lg text-xs ${r.score >= 80 ? 'bg-green-500/10 text-green-400' : r.score >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                        {r.score}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(r.completed_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
