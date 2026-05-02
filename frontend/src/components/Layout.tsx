import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  FolderIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  FolderIcon as FolderSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon, iconActive: HomeSolid },
  { to: '/projects', label: 'Projects', icon: FolderIcon, iconActive: FolderSolid },
];

const SIDEBAR_STYLE = {
  background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
};

function SidebarContent({ onClose, user, logout, navigate }: {
  onClose?: () => void;
  user: any;
  logout: () => void;
  navigate: (to: string) => void;
}) {
  return (
    <>
      {/* Decorative blobs */}
      <div className="absolute top-[-60px] left-[-40px] w-48 h-48 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      <div className="absolute bottom-[80px] right-[-50px] w-40 h-40 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />

      {/* Logo */}
      <div className="relative px-5 pt-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none tracking-tight">TaskFlow</p>
            <p className="text-purple-300 text-[10px] mt-0.5 font-medium tracking-widest uppercase">Workspace</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Nav */}
      <nav className="relative flex-1 px-3 py-5 space-y-1">
        <p className="px-3 mb-3 text-[10px] font-semibold text-purple-300/60 uppercase tracking-widest">Menu</p>
        {navItems.map(({ to, label, icon: Icon, iconActive: IconActive }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              isActive
                ? 'nav-active-glow flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all'
                : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-200/60 hover:text-white hover:bg-white/8 transition-all'
            }
            style={({ isActive }) =>
              isActive ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(168,85,247,0.8))' } : {}
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? <IconActive className="h-5 w-5 shrink-0" /> : <Icon className="h-5 w-5 shrink-0" />}
                {label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="relative px-3 pb-5">
        <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-semibold truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-purple-300/70 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-purple-200/70 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex w-[230px] shrink-0 flex-col relative overflow-hidden"
        style={SIDEBAR_STYLE}
      >
        <SidebarContent user={user} logout={logout} navigate={navigate} />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          {/* drawer */}
          <aside
            className="relative w-[240px] flex flex-col overflow-hidden animate-slide-left"
            style={SIDEBAR_STYLE}
          >
            <SidebarContent user={user} logout={logout} navigate={navigate} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3 shrink-0 border-b border-white/10"
          style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm">TaskFlow</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
