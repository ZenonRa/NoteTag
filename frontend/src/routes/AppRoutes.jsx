import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from '../state/useApp';
import Login from '../pages/Login/Login';
import NotesList from '../pages/NotesList/NotesList';
import NoteEditor from '../pages/NoteEditor/NoteEditor';
import Admin from '../pages/Admin/Admin';

function Home() {
  const { user } = useApp();
  return <Navigate to={user?.role === 'admin' ? '/admin' : user ? '/notes' : '/login'} replace />;
}

function ClientRoute({ children }) {
  const { user, loading, loadError, refresh } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (loading || loadError) return <DataGate loading={loading} error={loadError} retry={refresh} />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, loadError, refresh } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/notes" replace />;
  if (loading || loadError) return <DataGate loading={loading} error={loadError} retry={refresh} />;
  return children;
}

function DataGate({ loading, error, retry }) {
  return <main className="data-gate"><div className="data-gate-card"><span className="data-gate-mark">N.</span><h1>{loading ? 'Загружаем NoteTag…' : 'Не удалось загрузить данные'}</h1>{error && <><p>{error}</p><button className="button button-primary" type="button" onClick={() => retry().catch(() => {})}>Повторить</button></>}</div></main>;
}

function GuestRoute({ children }) {
  const { user } = useApp();
  return user ? <Home /> : children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<GuestRoute><Login mode="login" /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Login mode="register" /></GuestRoute>} />
      <Route path="/notes" element={<ClientRoute><NotesList /></ClientRoute>} />
      <Route path="/notes/new" element={<ClientRoute><NoteEditor /></ClientRoute>} />
      <Route path="/notes/:id" element={<ClientRoute><NoteEditor /></ClientRoute>} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
