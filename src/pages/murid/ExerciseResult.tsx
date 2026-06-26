import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, BookOpen, AlertCircle, RefreshCw, CheckCircle2, XCircle, ArrowRight, Star, Filter } from 'lucide-react';

export default function ExerciseResult() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newBadges, setNewBadges] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'benar' | 'salah'>('all');

  useEffect(() => {
    // Fetch result detail
    const fetchResultDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch user results
        const res = await fetch('/api/results', { headers });
        if (!res.ok) throw new Error('Gagal mengambil data hasil latihan');
        const results = await res.json();
        
        const currentResult = results.find((r: any) => r.id === parseInt(id || '', 10));
        if (!currentResult) throw new Error('Hasil latihan tidak ditemukan');
        setResult(currentResult);

        // Fetch questions for this exercise
        const qRes = await fetch(`/api/questions?exercise_id=${currentResult.exercise_id}&result_id=${id}`, { headers });
        if (!qRes.ok) throw new Error('Gagal memuat detail soal');
        const questionsData = await qRes.json();
        setQuestions(questionsData);

        // Read newly earned badges from sessionStorage
        const savedBadges = sessionStorage.getItem('newBadges');
        if (savedBadges) {
          setNewBadges(JSON.parse(savedBadges));
          sessionStorage.removeItem('newBadges'); // Clear after reading
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan sistem');
      } finally {
        setLoading(false);
      }
    };

    fetchResultDetail();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Mengevaluasi hasil kuis...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 font-semibold mb-4">{error}</p>
        <Link to="/" className="px-4 py-2 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-500 transition-colors">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const score = result.score;
  const isPerfect = score === 100;
  const isPass = score >= 70;

  const userAnswers = result?.answers?.answers || result?.answers || {};

  // Recommendations: identify if they got any question wrong in this subject
  const hasWrongAnswers = questions.some(q => userAnswers[q.id] !== q.correct_answer);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Celebration Modal / Banner for New Badges */}
      {newBadges.length > 0 && (
        <div className="glass-panel p-6 border-indigo-500 bg-indigo-950/40 rounded-3xl text-center relative overflow-hidden shadow-2xl animate-bounce">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
          <Award className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-white">Selamat! Anda Meraih Lencana Baru!</h2>
          <div className="flex justify-center gap-4 mt-4">
            {newBadges.map((badge: any) => (
              <div key={badge.id} className="flex flex-col items-center bg-slate-900/60 p-4 rounded-2xl border border-indigo-500/30">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center mb-1 text-lg">
                  🏆
                </div>
                <span className="text-xs font-bold text-slate-100">{badge.name}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 capitalize">{badge.condition_type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Score Banner */}
      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-slate-800/80 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] -mr-10 -mt-10" />
        
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Skor Akhir Kuis</span>
        <div className="my-6">
          <span className={`text-7xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent ${isPerfect ? 'from-yellow-400 to-amber-500' : isPass ? 'from-green-400 to-emerald-500' : 'from-rose-400 to-red-500'}`}>
            {score}
          </span>
          <span className="text-slate-500 text-lg">/100</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {isPerfect ? 'Luar Biasa! Sempurna!' : isPass ? 'Kerja Bagus! Kamu Lulus!' : 'Ayo Coba Lagi!'}
        </h2>
        <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed mb-6">
          Hasil latihan Anda untuk subjek <span className="font-semibold text-indigo-400">{result.subject_name}</span> telah disimpan dalam database Neon.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            to={`/subjects/${result.subject_id || 1}`}
            className="flex items-center gap-2 py-2.5 px-5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900/80 transition-all hover:border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            Ulangi Latihan
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/10"
          >
            Lanjut Belajar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Review Recommendations */}
      {hasWrongAnswers && (
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl space-y-3">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Rekomendasi Pemantapan Materi</h3>
          </div>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Berdasarkan kesalahan jawaban Anda pada kuis ini, kami merekomendasikan Anda untuk mempelajari kembali bab:
          </p>
          <div className="bg-slate-950/40 p-4 rounded-xl border border-amber-500/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{result.subject_name}</span>
              <h4 className="font-semibold text-white text-sm mt-0.5">{result.exercise_title}</h4>
            </div>
            <Link 
              to={`/subjects/${result.subject_id || 1}`}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 text-slate-950 text-xs font-extrabold hover:bg-amber-400 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Baca Teori
            </Link>
          </div>
        </div>
      )}

      {/* Grouped Answers Review */}
      <div className="space-y-4">
        {/* Header + Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-400" />
            Review Jawaban
          </h3>
          {/* Stats summary */}
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {questions.filter(q => userAnswers[q.id] === q.correct_answer).length} Benar
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">
              <XCircle className="w-3.5 h-3.5" />
              {questions.filter(q => userAnswers[q.id] !== q.correct_answer).length} Salah
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/60 w-fit">
          {(['all', 'benar', 'salah'] as const).map(f => (
            <button
              key={f}
              onClick={() => setReviewFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                reviewFilter === f
                  ? f === 'benar'
                    ? 'bg-green-600 text-white shadow'
                    : f === 'salah'
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'Semua Soal' : f === 'benar' ? '✓ Jawaban Benar' : '✗ Jawaban Salah'}
            </button>
          ))}
        </div>

        {/* Question Cards */}
        <div className="space-y-4">
          {(() => {
            const filtered = questions.filter(q => {
              const isCorrect = userAnswers[q.id] === q.correct_answer;
              if (reviewFilter === 'benar') return isCorrect;
              if (reviewFilter === 'salah') return !isCorrect;
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-10 glass-panel rounded-2xl border border-slate-800/60">
                  <p className="text-slate-400 text-sm">
                    {reviewFilter === 'benar' ? 'Tidak ada jawaban benar.' : 'Tidak ada jawaban salah. Semua benar! 🎉'}
                  </p>
                </div>
              );
            }

            return filtered.map((q, index) => {
              const studentAns = userAnswers[q.id];
              const isCorrect = studentAns === q.correct_answer;
              const origIndex = questions.findIndex(orig => orig.id === q.id);
              return (
                <div key={q.id} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} space-y-4`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Soal {origIndex + 1}</span>
                    <div className="flex items-center gap-1">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs font-bold text-green-400">Benar</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold text-red-400">Salah</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-200">{q.question_text}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.options.map((opt: string, idx: number) => {
                      const isStudentChoice = studentAns === opt;
                      const isCorrectAnswer = q.correct_answer === opt;

                      let btnStyle = 'bg-slate-900/30 border-slate-800 text-slate-400';
                      if (isCorrectAnswer) {
                        btnStyle = 'bg-green-500/10 border-green-500/50 text-green-300';
                      } else if (isStudentChoice && !isCorrect) {
                        btnStyle = 'bg-red-500/10 border-red-500/50 text-red-300';
                      }

                      return (
                        <div key={idx} className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${btnStyle}`}>
                          <span>{opt}</span>
                          <div className="flex gap-1">
                            {isCorrectAnswer && <span className="text-[10px] uppercase font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Kunci</span>}
                            {isStudentChoice && !isCorrect && <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Anda</span>}
                            {isStudentChoice && isCorrect && <span className="text-[10px] uppercase font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">✓ Anda</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
