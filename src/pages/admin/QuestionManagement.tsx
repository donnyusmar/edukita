import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, HelpCircle, Layers, CheckSquare } from 'lucide-react';

export default function QuestionManagement() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapId, setSelectedChapId] = useState<string>('');
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExId, setSelectedExId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editQId, setEditQId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');

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
        if (data.length > 0) {
          setSelectedSubId(data[0].id.toString());
          fetchChapters(data[0].id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChapters = async (subId: string) => {
    try {
      const res = await fetch(`/api/chapters?subject_id=${subId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setChapters(data);
        if (data.length > 0) {
          setSelectedChapId(data[0].id.toString());
          fetchExercises(data[0].id.toString());
        } else {
          setSelectedChapId('');
          setExercises([]);
          setSelectedExId(null);
          setQuestions([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExercises = async (chapId: string) => {
    try {
      const res = await fetch(`/api/exercises?chapter_id=${chapId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
        if (data.length > 0) {
          setSelectedExId(data[0].id);
          fetchQuestions(data[0].id);
        } else {
          // If no exercise exists, automatically create one so questions can be loaded
          handleAutoCreateExercise(chapId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoCreateExercise = async (chapId: string) => {
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chapter_id: parseInt(chapId, 10),
          title: `Latihan Bab ${chapId}`
        })
      });
      if (res.ok) {
        const ex = await res.json();
        setExercises([ex]);
        setSelectedExId(ex.id);
        fetchQuestions(ex.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async (exId: number) => {
    try {
      const res = await fetch(`/api/questions?exercise_id=${exId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSubId(id);
    fetchChapters(id);
  };

  const handleChapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedChapId(id);
    fetchExercises(id);
  };

  const handleOptionChange = (idx: number, val: string) => {
    setOptions(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText || !selectedExId) return;

    // Filter out blank options
    const filteredOptions = options.map(o => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      alert('Tolong sediakan minimal 2 pilihan jawaban.');
      return;
    }

    if (!correctAnswer || !filteredOptions.includes(correctAnswer)) {
      alert('Pilihan jawaban benar harus sama persis dengan salah satu opsi di atas.');
      return;
    }

    const payload = {
      exercise_id: selectedExId,
      question_text: questionText,
      options: filteredOptions,
      correct_answer: correctAnswer
    };

    try {
      let res;
      if (editQId) {
        res = await fetch(`/api/questions/${editQId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/questions', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowForm(false);
        setEditQId(null);
        setQuestionText('');
        setOptions(['', '', '', '']);
        setCorrectAnswer('');
        fetchQuestions(selectedExId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditQuestion = (q: any) => {
    setEditQId(q.id);
    setQuestionText(q.question_text);
    
    // Support varying option counts
    const loadedOpts = [...q.options];
    while (loadedOpts.length < 4) {
      loadedOpts.push('');
    }
    setOptions(loadedOpts);
    setCorrectAnswer(q.correct_answer);
    setShowForm(true);
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok && selectedExId) {
        fetchQuestions(selectedExId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Konsol Admin</span>
          <h1 className="text-2xl font-bold text-white mt-1">Manajemen Soal Kuis</h1>
        </div>
        {selectedExId && (
          <button
            onClick={() => { setEditQId(null); setQuestionText(''); setOptions(['', '', '', '']); setCorrectAnswer(''); setShowForm(true); }}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/10"
          >
            <Plus className="w-4 h-4" />
            Tambah Soal
          </button>
        )}
      </div>

      {/* Filter Controllers */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mata Pelajaran</label>
          <select
            value={selectedSubId}
            onChange={handleSubChange}
            className="glass-input w-full py-2.5 px-3 text-xs"
          >
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pilih Bab</label>
          <select
            value={selectedChapId}
            onChange={handleChapChange}
            disabled={chapters.length === 0}
            className="glass-input w-full py-2.5 px-3 text-xs"
          >
            {chapters.length === 0 ? (
              <option value="">Belum Ada Bab</option>
            ) : (
              chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
            )}
          </select>
        </div>
      </div>

      {/* Question Form Modal / Box */}
      {showForm && (
        <form onSubmit={handleSaveQuestion} className="glass-panel p-6 md:p-8 rounded-3xl border border-indigo-500/20 space-y-6 relative">
          <button 
            type="button" 
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <h3 className="font-bold text-base text-slate-100">{editQId ? 'Edit Soal' : 'Buat Soal Baru'}</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pertanyaan</label>
              <textarea
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="glass-input w-full py-2.5 px-3 text-xs h-20"
                placeholder="Masukkan teks pertanyaan kuis..."
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Opsi Pilihan Jawaban</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 w-4">{String.fromCharCode(65 + idx)}</span>
                    <input
                      type="text"
                      required={idx < 2}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="glass-input w-full py-2 px-3 text-xs"
                      placeholder={`Opsi Pilihan ${String.fromCharCode(65 + idx)}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kunci Jawaban Benar</label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                required
                className="glass-input w-full py-2.5 px-3 text-xs"
              >
                <option value="">Pilih Kunci Jawaban</option>
                {options.map((o, idx) => {
                  const optVal = o.trim();
                  if (!optVal) return null;
                  return (
                    <option key={idx} value={optVal}>
                      {String.fromCharCode(65 + idx)}: {optVal}
                    </option>
                  );
                })}
              </select>
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

      {/* Questions list container */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Daftar Soal Latihan</h2>
        
        {!selectedExId ? (
          <div className="text-center py-12 glass-panel rounded-2xl">
            <p className="text-slate-500 text-xs">Pilih mata pelajaran & bab yang memiliki konten kuis.</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl flex flex-col items-center justify-center">
            <HelpCircle className="w-10 h-10 text-slate-500 mb-2" />
            <p className="text-slate-400 text-xs">Belum ada soal pada latihan bab ini. Klik tombol tambah di kanan atas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q: any, index: number) => (
              <div 
                key={q.id}
                className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4 relative group"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
                    Soal #{index + 1}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditQuestion(q)}
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg border border-slate-850 bg-slate-900/30 text-slate-400 hover:text-rose-400 hover:border-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="font-semibold text-slate-200 text-sm leading-relaxed">{q.question_text}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {q.options.map((opt: string, oIdx: number) => {
                    const isCorrect = q.correct_answer === opt;
                    return (
                      <div 
                        key={oIdx}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-slate-900/10 border-slate-850 text-slate-400'}`}
                      >
                        <span>{String.fromCharCode(65 + oIdx)}: {opt}</span>
                        {isCorrect && <span className="text-[9px] font-extrabold text-green-400 uppercase bg-green-500/10 px-2 py-0.5 rounded shrink-0">Kunci</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
