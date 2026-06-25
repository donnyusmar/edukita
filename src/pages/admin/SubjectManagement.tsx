import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit3, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  
  // Subject Form States
  const [showSubForm, setShowSubForm] = useState(false);
  const [editSubId, setEditSubId] = useState<number | null>(null);
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subIcon, setSubIcon] = useState('BookOpen');
  const [subActive, setSubActive] = useState(true);

  // Chapter Form States
  const [showChapForm, setShowChapForm] = useState(false);
  const [editChapId, setEditChapId] = useState<number | null>(null);
  const [chapTitle, setChapTitle] = useState('');
  const [chapOrder, setChapOrder] = useState('1');

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
        if (data.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(data[0].id);
          fetchChapters(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChapters = async (subId: number) => {
    try {
      const res = await fetch(`/api/chapters?subject_id=${subId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setChapters(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSubject = (id: number) => {
    setSelectedSubjectId(id);
    fetchChapters(id);
    setShowChapForm(false);
    setEditChapId(null);
  };

  // SUBJECT CRUD OPERATIONS
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName) return;

    const payload = {
      name: subName,
      description: subDesc,
      icon: subIcon,
      is_active: subActive
    };

    try {
      let res;
      if (editSubId) {
        res = await fetch(`/api/subjects/${editSubId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/subjects', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowSubForm(false);
        setEditSubId(null);
        resetSubForm();
        fetchSubjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubject = (sub: any) => {
    setEditSubId(sub.id);
    setSubName(sub.name);
    setSubDesc(sub.description || '');
    setSubIcon(sub.icon || 'BookOpen');
    setSubActive(sub.is_active);
    setShowSubForm(true);
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini beserta seluruh bab di dalamnya?')) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        if (selectedSubjectId === id) {
          setSelectedSubjectId(null);
          setChapters([]);
        }
        fetchSubjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetSubForm = () => {
    setSubName('');
    setSubDesc('');
    setSubIcon('BookOpen');
    setSubActive(true);
  };

  // CHAPTER CRUD OPERATIONS
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapTitle || !selectedSubjectId) return;

    const payload = {
      subject_id: selectedSubjectId,
      title: chapTitle,
      order_number: parseInt(chapOrder, 10)
    };

    try {
      let res;
      if (editChapId) {
        res = await fetch(`/api/chapters/${editChapId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/chapters', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowChapForm(false);
        setEditChapId(null);
        setChapTitle('');
        setChapOrder('1');
        fetchChapters(selectedSubjectId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditChapter = (chap: any) => {
    setEditChapId(chap.id);
    setChapTitle(chap.title);
    setChapOrder(chap.order_number.toString());
    setShowChapForm(true);
  };

  const handleDeleteChapter = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bab ini?')) return;
    try {
      const res = await fetch(`/api/chapters/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok && selectedSubjectId) {
        fetchChapters(selectedSubjectId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Konsol Admin</span>
          <h1 className="text-2xl font-bold text-white mt-1">Kelola Mata Pelajaran & Bab</h1>
        </div>
        <button
          onClick={() => { resetSubForm(); setEditSubId(null); setShowSubForm(true); }}
          className="flex items-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/10"
        >
          <Plus className="w-4 h-4" />
          Tambah Pelajaran
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: List of subjects */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Daftar Pelajaran</h2>
          
          {showSubForm && (
            <form onSubmit={handleSaveSubject} className="glass-panel p-5 rounded-2xl border border-indigo-500/30 space-y-4">
              <h3 className="font-bold text-sm text-slate-100">{editSubId ? 'Edit Pelajaran' : 'Tambah Pelajaran Baru'}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nama Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="glass-input w-full py-1.5 px-3 text-xs"
                    placeholder="Contoh: Matematika Dasar"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Deskripsi</label>
                  <textarea
                    value={subDesc}
                    onChange={(e) => setSubDesc(e.target.value)}
                    className="glass-input w-full py-1.5 px-3 text-xs h-16"
                    placeholder="Deskripsi singkat..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Ikon Lucide</label>
                    <select
                      value={subIcon}
                      onChange={(e) => setSubIcon(e.target.value)}
                      className="glass-input w-full py-1.5 px-2 text-xs"
                    >
                      <option value="BookOpen">Buku (BookOpen)</option>
                      <option value="Calculator">Kalkulator (Calculator)</option>
                      <option value="Layers">Lapisan (Layers)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status Aktif</label>
                    <button
                      type="button"
                      onClick={() => setSubActive(!subActive)}
                      className="flex items-center mt-1"
                    >
                      {subActive ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubForm(false)}
                  className="px-3 py-1.5 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {subjects.map((sub: any) => {
              const isSelected = selectedSubjectId === sub.id;
              return (
                <div 
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub.id)}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer group transition-all ${isSelected ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-900/20 border-slate-850 hover:bg-slate-900/40'}`}
                >
                  <div className="overflow-hidden pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${sub.is_active ? 'bg-green-500' : 'bg-slate-600'}`} />
                      <h3 className="font-semibold text-slate-200 text-sm truncate">{sub.name}</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-1">{sub.description || 'Tidak ada deskripsi'}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditSubject(sub); }}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(sub.id); }}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: List of chapters for selected subject */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Daftar Bab Pendukung
            </h2>
            {selectedSubjectId && (
              <button
                onClick={() => { setChapTitle(''); setChapOrder((chapters.length + 1).toString()); setEditChapId(null); setShowChapForm(true); }}
                className="flex items-center gap-1 py-1.5 px-3 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-transparent rounded-lg text-xs font-bold text-indigo-400 hover:text-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bab
              </button>
            )}
          </div>

          {showChapForm && selectedSubjectId && (
            <form onSubmit={handleSaveChapter} className="glass-panel p-5 rounded-2xl border border-indigo-500/30 space-y-4">
              <h3 className="font-bold text-sm text-slate-100">{editChapId ? 'Edit Bab' : 'Tambah Bab Baru'}</h3>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Judul Bab</label>
                  <input
                    type="text"
                    required
                    value={chapTitle}
                    onChange={(e) => setChapTitle(e.target.value)}
                    className="glass-input w-full py-1.5 px-3 text-xs"
                    placeholder="Contoh: Operasi Hitung"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Urutan</label>
                  <input
                    type="number"
                    required
                    value={chapOrder}
                    onChange={(e) => setChapOrder(e.target.value)}
                    className="glass-input w-full py-1.5 px-2 text-xs text-center"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowChapForm(false)}
                  className="px-3 py-1.5 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          {!selectedSubjectId ? (
            <div className="text-center py-12 glass-panel rounded-2xl">
              <p className="text-slate-500 text-xs">Pilih mata pelajaran terlebih dahulu di sebelah kiri.</p>
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl">
              <p className="text-slate-500 text-xs">Pelajaran ini belum memiliki bab. Tambah bab baru di atas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((chap: any) => (
                <div 
                  key={chap.id}
                  className="p-4 rounded-xl border border-slate-850 bg-slate-900/10 flex items-center justify-between group"
                >
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Urutan ke-{chap.order_number}</span>
                    <h4 className="font-semibold text-slate-200 text-sm">{chap.title}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditChapter(chap)}
                      className="p-2 border border-slate-800 rounded-lg bg-slate-900/30 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteChapter(chap.id)}
                      className="p-2 border border-slate-850 rounded-lg bg-slate-900/30 text-slate-400 hover:text-rose-400 hover:border-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
