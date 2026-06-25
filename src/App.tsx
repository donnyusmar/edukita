import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { BookOpen, Award, LogOut, User, BarChart, History, PlusCircle, CheckSquare, Layers, Shield, Menu, X } from 'lucide-react';

import Login from './pages/Login';
import MuridDashboard from './pages/murid/Dashboard';
import SubjectDetail from './pages/murid/SubjectDetail';
import ExerciseResult from './pages/murid/ExerciseResult';
import MuridBadges from './pages/murid/Badges';

import AdminDashboard from './pages/admin/Dashboard';
import SubjectManagement from './pages/admin/SubjectManagement';
import QuestionManagement from './pages/admin/QuestionManagement';
import MonitoringScores from './pages/admin/MonitoringScores';
import ExerciseHistory from './pages/admin/ExerciseHistory';
import GamificationManagement from './pages/admin/GamificationManagement';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsSidebarOpen(false);
    navigate('/login');
  };

  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen flex bg-[#080b11] text-slate-100">
      {user && currentPath !== '/login' && (
        <>
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-slate-800/50 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static md:h-screen ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/40">
              <Link to="/" className="flex items-center gap-2" onClick={() => setIsSidebarOpen(false)}>
                <div className="p-1.5 bg-indigo-600 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">EDUKITA</span>
              </Link>
              <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile */}
            <div className="p-5 border-b border-slate-800/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white uppercase shadow-md shadow-indigo-500/10">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-semibold text-sm text-slate-200 truncate">{user.name}</h4>
                <p className="text-xs text-slate-400 font-medium capitalize flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-rose-500' : 'bg-green-500'}`} />
                  {user.role}
                </p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {user.role === 'murid' ? (
                <>
                  <Link 
                    to="/" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPath === '/' ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                  >
                    <BookOpen className="w-5 h-5" />
                    Mata Pelajaran
                  </Link>
                  <Link 
                    to="/badges" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPath === '/badges' ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                  >
                    <Award className="w-5 h-5" />
                    Lencana Saya
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/admin" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPath === '/admin' ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                  >
                    <Shield className="w-5 h-5" />
                    Dashboard Admin
                  </Link>
                  <Link 
                    to="/admin/subjects" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPath === '/admin/subjects' ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                  >
                    <Layers className="w-5 h-5" />
                    Mata Pelajaran & Bab
                  </Link>
                  <Link 
                    to="/admin/questions" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPath === '/admin/questions' ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                  >
                    <CheckSquare className="w-5 h-5" />
                    Manajemen Soal
                  </Link>
                  <Link 
                    to="/admin/scores" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPath === '/admin/scores' ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                  >
                    <BarChart className="w-5 h-5" />
                    Monitoring Nilai
                  </Link>
                  <Link 
                    to="/admin/history" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPath === '/admin/history' ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                  >
                    <History className="w-5 h-5" />
                    Riwayat Latihan
                  </Link>
                  <Link 
                    to="/admin/gamification" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentPath === '/admin/gamification' ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                  >
                    <Award className="w-5 h-5" />
                    Gamifikasi Lencana
                  </Link>
                </>
              )}
            </nav>

            <div className="p-4 border-t border-slate-800/40">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        {user && currentPath !== '/login' && (
          <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/40 bg-slate-900/10 backdrop-blur-md sticky top-0 z-30">
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <User className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-slate-300">{user.email}</span>
            </div>
          </header>
        )}

        <main className="flex-1 p-6 md:p-8">
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            
            {/* Murid Routes */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['murid']}>
                <MuridDashboard />
              </ProtectedRoute>
            } />
            <Route path="/subjects/:id" element={
              <ProtectedRoute allowedRoles={['murid']}>
                <SubjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/results/:id" element={
              <ProtectedRoute allowedRoles={['murid']}>
                <ExerciseResult />
              </ProtectedRoute>
            } />
            <Route path="/badges" element={
              <ProtectedRoute allowedRoles={['murid']}>
                <MuridBadges />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/subjects" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SubjectManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/questions" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <QuestionManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/scores" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MonitoringScores />
              </ProtectedRoute>
            } />
            <Route path="/admin/history" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExerciseHistory />
              </ProtectedRoute>
            } />
            <Route path="/admin/gamification" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <GamificationManagement />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
