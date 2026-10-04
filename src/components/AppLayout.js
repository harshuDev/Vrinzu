import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChartColumn, BookOpen, CalendarDays, CloudOff, House, LogOut, Plus, Search, Settings } from 'lucide-react';
import Logo from './Logo';
import LockScreen from './LockScreen';
import { JournalLockProvider } from '../context/JournalLockContext';
import { StartEntryProvider, useStartEntry } from '../context/StartEntryContext';
import { RELOCK_AFTER_MS } from '../lib/pin';
import { useAuth } from '../context/AuthContext';
import useOnline from '../lib/useOnline';
import { cleanupStaleBlankEntries } from '../lib/api';

const NAV_ITEMS = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/journals', label: 'Journals', icon: BookOpen },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/insights', label: 'Insights', icon: ChartColumn },
  { to: '/app/search', label: 'Search', icon: Search },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

// Phones: four tabs around a centre "+" (Search sits in the header, Settings on the avatar).
const BOTTOM_LEFT = NAV_ITEMS.slice(0, 2);
const BOTTOM_RIGHT = NAV_ITEMS.slice(2, 4);

function BottomTab({ to, label, icon: Icon, end }) {
  return (
    <NavLink to={to} end={end} className="bottom-nav-link">
      <Icon size={22} />
      <span>{label}</span>
    </NavLink>
  );
}

function NewEntryFab() {
  const startEntry = useStartEntry();
  return (
    <div className="bottom-nav-fab-slot">
      <button type="button" className="fab" onClick={() => startEntry()} aria-label="New entry">
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function SidebarNewEntry() {
  const startEntry = useStartEntry();
  return (
    <button type="button" className="btn btn-primary btn-block sidebar-new" onClick={() => startEntry()}>
      <Plus size={18} /> New entry
    </button>
  );
}

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
  const hasPin = Boolean(user?.user_metadata?.pin_hash);
  // Locked when the app opens (a fresh page load) if a passcode is set.
  const [locked, setLocked] = useState(hasPin);
  const hiddenAt = useRef(null);
  const online = useOnline();

  // Tidy up blank entries left behind when the app was closed mid-entry.
  useEffect(() => {
    cleanupStaleBlankEntries();
  }, []);

  // Lock again after the app has been in the background for a while.
  useEffect(() => {
    if (!hasPin) return undefined;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_AFTER_MS) {
        setLocked(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [hasPin]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out. See you soon!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (locked && hasPin) return <LockScreen onUnlock={() => setLocked(false)} />;

  return (
    <JournalLockProvider>
      <StartEntryProvider>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-top">
              <Logo to="/app" />
            </div>
            <SidebarNewEntry />
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
              <NavLink to="/app/search" className="icon-btn" aria-label="Search">
                <Search size={21} />
              </NavLink>
              <NavLink to="/app/settings" aria-label="Settings">
                <Avatar name={displayName} size="sm" />
              </NavLink>
            </div>
          </header>

          <main className="app-main">
            {!online && (
              <div className="offline-banner" role="status">
                <CloudOff size={16} /> You’re offline. What you write is kept on this device and syncs when you’re back.
              </div>
            )}
            <Outlet />
          </main>

          <nav className="bottom-nav" aria-label="Main">
            {BOTTOM_LEFT.map((item) => (
              <BottomTab key={item.to} {...item} />
            ))}
            <NewEntryFab />
            {BOTTOM_RIGHT.map((item) => (
              <BottomTab key={item.to} {...item} />
            ))}
          </nav>
        </div>
      </StartEntryProvider>
    </JournalLockProvider>
  );
}
