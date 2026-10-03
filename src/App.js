import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { isSupabaseConfigured } from './lib/supabase';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import AppLayout from './components/AppLayout';
import SetupNotice from './components/SetupNotice';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Journals from './pages/Journals';
import JournalDetail from './pages/JournalDetail';
import EntryEditor from './pages/EntryEditor';
import Search from './pages/Search';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const toastOptions = {
  duration: 3500,
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
  },
};

export default function App() {
  if (!isSupabaseConfigured) return <SetupNotice />;

  return (
    <AuthProvider>
      <Toaster position="top-center" toastOptions={toastOptions} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="journals" element={<Journals />} />
            <Route path="journals/:journalId" element={<JournalDetail />} />
            <Route path="entries/:entryId" element={<EntryEditor />} />
            <Route path="search" element={<Search />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
