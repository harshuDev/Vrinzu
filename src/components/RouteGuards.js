import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import useMediaQuery from '../lib/useMediaQuery';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  // Phones (and the installed app) start at the welcome slides; desktop goes straight to sign in.
  const isPhone = useMediaQuery('(max-width: 768px)');
  if (loading) return <Spinner fullscreen />;
  if (!user) return <Navigate to={isPhone ? '/welcome' : '/login'} replace state={{ from: location }} />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner fullscreen />;
  if (user) return <Navigate to={location.state?.from?.pathname || '/app'} replace />;
  return <Outlet />;
}
