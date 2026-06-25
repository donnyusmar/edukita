import { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Edit3, Save, X, ToggleLeft, ToggleRight, Settings } from 'lucide-react';

export default function GamificationManagement() {
  const [badges, setBadges] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editBadgeId, setEditBadgeId] = useState<number | null>(null);
  const [badgeName, setBadgeName] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('Award');
  const [conditionType, setConditionType] = useState('perfect_score');
  const [conditionValue, setConditionValue] = useState('100');
  const [subjectId, setSubjectId] = useState('');
  const [badgeActive, setBadgeActive] = useState(true);

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [badgesRes, subRes] = await Promise.all([
        fetch('/api/admin/badges', { headers }),
        fetch('/api/subjects', { headers })
      ]);

      if (!badgesRes.ok || !subRes.ok) throw new Error('Gagal mengambil data gamifikasi');

      const badgesData = await badgesRes.json();
      const subData = await subRes.json();

      setBadges(badgesData);
      setSubjects(subData);
      
      if (subData.length > 0) {
        setSubjectId(subData[0].id.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeName || !subjectId) return;

    const payload = {
      name: badgeName,
      icon: badgeIcon,
      condition_type: conditionType,
      condition_value: conditionValue,
      subject_id: parseInt(subjectId, 10),
      is_active: badgeActive
    };

    try {
      let res;
      if (editBadgeId) {
        res = await fetch(`/api/admin/badges/${editBadgeId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/badges', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowForm(false);
        setEditBadgeId(null);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditBadge = (badge: any) => {
    setEditBadgeId(badge.id);
    setBadgeName(badge.name);
    setBadgeIcon(badge.icon);
    setConditionType(badge.condition_type);
    setConditionValue(badge.condition_value);
    setSubjectId(badge.subject_id.toString());
    setBadgeActive(badge.is_active);
    setShowForm(true);
  };

  const handleDeleteBadge = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lencana gamifikasi ini?')) return;
    try {
      const res = await fetch(`/api/admin/badges/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setBadgeName('');
    setBadgeIcon('Award');
    setConditionType('perfect_score');
    setConditionValue('100');
    setBadgeActive(true);
    if (subjects.length > 0) {
      setSubjectId(subjects[0].id.toString());
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Memuat panel gamifikasi lencana...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-400">Eror: {error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Konsol Admin</span>
          <h1 className="text-2xl font-bold text-white mt-1">Kelola Penghargaan & Lencana</h1>
        </div>
        <button
          onClick={() => { resetForm(); setEditBadgeId(null); setShowForm(true); }}
          className="flex items-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/10"
        >
          <Plus className="w-4 h-4" />
          Buat Lencana
        </button>
      </div>

      {/* Badge Form Dialog */}
      {showForm && (
        <form onSubmit={handleSaveBadge} className="glass-panel p-6 md:p-8 rounded-3xl border border-indigo-500/20 space-y-6 relative">
          <button 
            type="button" 
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <h3 className="font-bold text-base text-slate-100">{editBadgeId ? 'Edit Lencana' : 'Buat Lencana Baru'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Lencana</label>
              <input
                type="text"
                required
                value={badgeName}
                onChange={(e) => setBadgeName(e.target.value)}
                className="glass-input w-full py-2.5 px-3 text-xs"
                placeholder="Contoh: Ahli Aljabar"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mata Pelajaran Terkait</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="glass-input w-full py-2.5 px-3 text-xs"
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ikon Lencana</label>
              <select
                value={badgeIcon}
                onChange={(e) => setBadgeIcon(e.target.value)}
                className="glass-input w-full py-2.5 px-3 text-xs"
              >
                <option value="Award">Piala (Award)</option>
                <option value="Star">Bintang (Star)</option>
                <option value="Medal">Medali (Medal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kondisi Kelayakan</label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value)}
                className="glass-input w-full py-2.5 px-3 text-xs"
              >
                <option value="perfect_score">Nilai Kuis Sempurna (100)</option>
                <option value="complete_exercise">Menyelesaikan 1 Latihan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nilai Kondisi</label>
              <input
                type="text"
                required
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                className="glass-input w-full py-2.5 px-3 text-xs"
                placeholder="Contoh: 100 atau 1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status Aktif</label>
              <button
                type="button"
                onClick={() => setBadgeActive(!badgeActive)}
                className="flex items-center mt-1"
              >
                {badgeActive ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-md shadow-indigo-500/10"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge: any) => (
          <div key={badge.id} className="glass-card p-6 rounded-2xl relative overflow-hidden flex items-start gap-4 group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl" />
            
            {/* Badge Icon Display */}
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              {badge.icon === 'Award' ? '🏆' : badge.icon === 'Star' ? '⭐' : '🏅'}
            </div>

            <div className="space-y-2 overflow-hidden flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded uppercase">
                    {badge.subject_name}
                  </span>
                  <h3 className="font-bold text-slate-100 text-sm mt-2 truncate">
                    {badge.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                  <button
                    onClick={() => handleEditBadge(badge)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBadge(badge.id)}
                    className="p-1 text-slate-400 hover:text-rose-450"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Syarat: {badge.condition_type === 'perfect_score' ? `Skor sempurna (${badge.condition_value})` : `Menyelesaikan ${badge.condition_value} latihan`}
              </p>

              <div className="flex items-center gap-1 text-[10px] font-semibold">
                <span className="text-slate-500">Status: </span>
                <span className={badge.is_active ? 'text-green-400' : 'text-slate-500'}>
                  {badge.is_active ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
