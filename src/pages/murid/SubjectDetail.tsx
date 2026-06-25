import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckSquare, ChevronRight, HelpCircle, Star, Award, AlertCircle } from 'lucide-react';

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'teori' | 'latihan'>('teori');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Theory Content State
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [theoryContent, setTheoryContent] = useState<any>(null);
  const [loadingTheory, setLoadingTheory] = useState(false);

  // Active Quiz State
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');

  useEffect(() => {
    const fetchSubjectData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch subject details
        const subRes = await fetch('/api/subjects', { headers });
        if (!subRes.ok) throw new Error('Gagal mengambil data mata pelajaran');
        const subjectsList = await subRes.json();
        const currentSub = subjectsList.find((s: any) => s.id === parseInt(id || '', 10));
        if (!currentSub) throw new Error('Mata pelajaran tidak ditemukan');
        setSubject(currentSub);

        // Fetch chapters
        const chapRes = await fetch(`/api/chapters?subject_id=${id}`, { headers });
        if (!chapRes.ok) throw new Error('Gagal mengambil data bab');
        const chaptersData = await chapRes.json();
        setChapters(chaptersData);

        if (chaptersData.length > 0) {
          // Select first chapter theory by default
          handleSelectTheory(chaptersData[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan sistem');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectData();
  }, [id]);

  const handleSelectTheory = async (chapterId: number) => {
    setSelectedChapterId(chapterId);
    setLoadingTheory(true);
    setTheoryContent(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/theories?chapter_id=${chapterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setTheoryContent(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTheory(false);
    }
  };

  const handleStartExercise = async (chapterId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Get exercise for the chapter
      const exRes = await fetch(`/api/exercises?chapter_id=${chapterId}`, { headers });
      if (!exRes.ok) throw new Error('Gagal memuat latihan');
      const exercises = await exRes.json();
      
      if (exercises.length === 0) {
        alert('Belum ada latihan untuk bab ini.');
        return;
      }

      const exercise = exercises[0];
      setActiveExercise(exercise);

      // Get questions for the exercise
      const qRes = await fetch(`/api/questions?exercise_id=${exercise.id}`, { headers });
      if (!qRes.ok) throw new Error('Gagal memuat soal-soal');
      const questionsData = await qRes.json();
      setQuestions(questionsData);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setQuizError('');
    } catch (err: any) {
      alert(err.message || 'Gagal memuat kuis.');
    }
  };

  const handleSelectOption = (questionId: number, option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmitQuiz = async () => {
    // Validate if all questions are answered
    const unanswered = questions.some(q => !selectedAnswers[q.id]);
    if (unanswered) {
      setQuizError('Silakan jawab semua soal terlebih dahulu sebelum mengirim.');
      return;
    }

    setSubmittingQuiz(true);
    setQuizError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          exercise_id: activeExercise.id,
          answers: selectedAnswers,
          questions: questions
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim jawaban');
      }

      const data = await response.json();
      
      // If there are earned badges, save them in sessionStorage to show in result
      if (data.earnedBadges && data.earnedBadges.length > 0) {
        sessionStorage.setItem('newBadges', JSON.stringify(data.earnedBadges));
      }

      navigate(`/results/${data.result.id}`);
    } catch (err: any) {
      setQuizError(err.message || 'Terjadi kesalahan saat mengirim hasil kuis');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Memuat konten pembelajaran...</div>;
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

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/80 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Mata Pelajaran</span>
          <h1 className="text-2xl font-bold text-white mt-1">{subject.name}</h1>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex border-b border-slate-800/80 max-w-md">
        <button
          onClick={() => { setActiveTab('teori'); setActiveExercise(null); }}
          className={`flex-1 py-3 px-4 font-semibold text-sm border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === 'teori' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <BookOpen className="w-4 h-4" />
          Teori Belajar
        </button>
        <button
          onClick={() => { setActiveTab('latihan'); }}
          className={`flex-1 py-3 px-4 font-semibold text-sm border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === 'latihan' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <CheckSquare className="w-4 h-4" />
          Latihan Soal
        </button>
      </div>

      {/* Active Exercise Quiz View */}
      {activeExercise ? (
        <div className="glass-panel p-4 md:p-8 rounded-3xl border border-slate-800/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

          {/* Quiz Header & Tracker */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/40 mb-6">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Latihan Aktif</span>
              <h3 className="text-lg font-bold text-white mt-1">{activeExercise.title}</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-indigo-400">{currentQuestionIndex + 1}</span>
              <span className="text-xs text-slate-500"> / {questions.length} Soal</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {questions.length > 0 && (
            <div className="space-y-6">
              {/* Question Text */}
              <div className="p-5 bg-slate-900/50 border border-slate-850 rounded-2xl text-slate-200 text-base leading-relaxed">
                {questions[currentQuestionIndex].question_text}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-3">
                {questions[currentQuestionIndex].options.map((opt: string, idx: number) => {
                  const isSelected = selectedAnswers[questions[currentQuestionIndex].id] === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(questions[currentQuestionIndex].id, opt)}
                      className={`w-full text-left py-3.5 px-4 md:py-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between ${isSelected ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5' : 'bg-slate-900/30 border-slate-800 text-slate-300 hover:bg-slate-900/80 hover:border-slate-700'}`}
                    >
                      <span>{opt}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-700 bg-slate-900'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Error banner if validation fails */}
              {quizError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>{quizError}</span>
                </div>
              )}

              {/* Navigation controls */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-800/40">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/80 text-sm font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                >
                  Sebelumnya
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/10"
                  >
                    Selanjutnya
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {submittingQuiz ? 'Mengirim...' : 'Selesai & Kirim'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standard Tab Views */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chapters List */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Daftar Bab</h3>
            {chapters.length === 0 ? (
              <p className="text-slate-500 text-xs">Belum ada bab terdaftar.</p>
            ) : (
              <div className="space-y-2">
                {chapters.map((chap: any) => {
                  const isSelected = selectedChapterId === chap.id;
                  return (
                    <div 
                      key={chap.id}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${isSelected ? 'bg-slate-900/80 border-slate-700/80 shadow-md' : 'bg-slate-900/20 border-slate-850 hover:bg-slate-900/40'}`}
                    >
                      <div className="overflow-hidden pr-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Bab {chap.order_number}</span>
                        <h4 className="font-semibold text-slate-200 text-sm truncate">{chap.title}</h4>
                      </div>

                      {activeTab === 'teori' ? (
                        <button
                          onClick={() => handleSelectTheory(chap.id)}
                          className={`p-1.5 rounded-lg border shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-transparent text-white' : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:text-slate-300'}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartExercise(chap.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-transparent text-xs font-bold text-indigo-400 hover:text-white transition-all shrink-0"
                        >
                          Kuis
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tab Content Panels */}
          <div className="lg:col-span-8">
            {activeTab === 'teori' ? (
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800/80 min-h-[300px]">
                {loadingTheory ? (
                  <p className="text-slate-400 text-sm">Memuat konten teori...</p>
                ) : theoryContent ? (
                  <article className="space-y-6">
                    <header className="pb-4 border-b border-slate-800/40">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Konten Teori</span>
                      <h2 className="text-xl font-bold text-white mt-1">{theoryContent.title}</h2>
                    </header>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                      {theoryContent.content}
                    </p>
                  </article>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                    <HelpCircle className="w-10 h-10 mb-2" />
                    <p className="text-sm">Pilih bab di sebelah kiri untuk membaca teori.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800/80 min-h-[300px] flex flex-col items-center justify-center text-center text-slate-500">
                <CheckSquare className="w-12 h-12 text-slate-400 mb-3" />
                <h4 className="text-slate-300 font-bold mb-1">Siap Uji Pemahamanmu?</h4>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed mb-4">
                  Klik tombol "Kuis" pada bab di panel kiri untuk memulai evaluasi pembelajaran bab tersebut.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
