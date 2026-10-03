import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, House, LogOut, Search, Settings } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/journals', label: 'Journals', icon: BookOpen },
  { to: '/app/search', label: 'Search', icon: Search },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function Avatar({ name, size = 'md' }) {
  const letter = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true">
      {letter}
    </span>
  );
}

export default function AppLayout() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out. See you soon!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Logo to="/app" />
        </div>
        <nav className="sidebar-nav" aria-label="Main">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="sidebar-link">
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <Avatar name={displayName} />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{displayName}</span>
            <span className="sidebar-user-email">{user?.email}</span>
          </div>
          <button type="button" className="icon-btn" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <header className="mobile-header">
        <Logo to="/app" size="sm" />
        <div className="mobile-header-actions">
          <button type="button" className="icon-btn" onClick={handleSignOut} aria-label="Sign out">
            <LogOut size={20} />
          </button>
          <NavLink to="/app/settings" aria-label="Settings">
            <Avatar name={displayName} size="sm" />
          </NavLink>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="bottom-nav-link">
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
