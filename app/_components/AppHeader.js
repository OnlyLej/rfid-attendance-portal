'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sun, Moon, RefreshCw, LogOut, Home, Users, FileText, RadioTower,
  Bell, X, AlertTriangle, CheckCircle, Info, XCircle, Keyboard,
} from 'lucide-react';
import { useApp } from '../_lib/AppContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Tooltip } from './ui';

const PH_TZ = 'Asia/Manila';

/* ── Live PH clock ── */
function usePHClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-PH',  { timeZone: PH_TZ, weekday: 'short', month: 'short', day: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return { time, date };
}

function getGreeting() {
  const h = parseInt(new Date().toLocaleString('en-PH', { hour: 'numeric', hour12: false, timeZone: PH_TZ }));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/* ── AppLogo ── */
const AppLogo = ({ size = 'sm', darkMode }) => {
  const [err, setErr] = useState(false);
  const sz = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const ic = size === 'sm' ? 13 : 16;
  if (!err) return (
    <div className={`${sz} rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-sky-500/25`}>
      <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" onError={() => setErr(true)} />
    </div>
  );
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-sky-400 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/25`}>
      <RadioTower size={ic} className="text-white" />
    </div>
  );
};

/* ── Logout Modal ── */
const LogoutModal = ({ darkMode, onConfirm, onCancel }) => {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onCancel} />
      <div
        className={`relative w-full max-w-sm rounded-2xl border overflow-hidden
          ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)', animation: 'hdr-modal 0.3s cubic-bezier(0.34,1.5,0.64,1) both' }}
      >
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#f43f5e,#f59e0b,#f43f5e)', backgroundSize: '200%', animation: 'hdr-bar-sweep 3s linear infinite' }} />
        <div className="p-7 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/15">
            <AlertTriangle size={24} className="text-rose-500" />
          </div>
          <h3 className={`text-lg font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sign out?</h3>
          <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            You'll need to sign back in to access your portal.
          </p>
          <div className="flex gap-2.5">
            <button onClick={onCancel}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95
                ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/6' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              Stay
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/25"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Keyboard shortcuts modal ── */
const ShortcutsModal = ({ darkMode, onClose }) => {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const shortcuts = [
    { key: 'R', desc: 'Refresh data'         },
    { key: 'T', desc: 'Toggle dark/light mode'},
    { key: '?', desc: 'Show this help'        },
    { key: 'Esc', desc: 'Close modals / panels'},
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div
        className={`relative w-full max-w-xs rounded-2xl border overflow-hidden
          ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.35)', animation: 'hdr-modal 0.3s cubic-bezier(0.34,1.5,0.64,1) both' }}
      >
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed)' }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Keyboard size={15} className="text-sky-500" />
              <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Keyboard shortcuts</p>
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-all hover:scale-110 ${darkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {shortcuts.map((s, i) => (
              <div key={i} className={`flex items-center justify-between py-2 border-b last:border-0 ${darkMode ? 'border-white/[0.05]' : 'border-gray-100'}`}>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{s.desc}</span>
                <kbd className={`px-2.5 py-1 rounded-lg text-xs font-black border font-mono
                  ${darkMode ? 'bg-white/8 border-white/12 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Notification panel ── */
const typeIcon = { success: CheckCircle, error: XCircle, warn: AlertTriangle, info: Info };
const typeColor = { success: 'text-emerald-500', error: 'text-rose-500', warn: 'text-amber-500', info: 'text-sky-500' };
const typeDot   = { success: 'bg-emerald-500',   error: 'bg-rose-500',   warn: 'bg-amber-500',   info: 'bg-sky-500'   };

const NotificationsPanel = ({ darkMode, onClose, notifications, onMarkAllRead }) => {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className={`absolute right-0 top-full mt-2 w-[22rem] z-50 rounded-2xl border overflow-hidden
        ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200/80'}`}
      style={{ boxShadow: '0 20px 56px rgba(0,0,0,0.25)', animation: 'hdr-slide-down 0.2s ease-out both' }}
    >
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981)' }} />

      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-white/6' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</p>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)' }}>
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button onClick={onMarkAllRead} className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${darkMode ? 'text-sky-400 hover:bg-sky-500/10' : 'text-sky-600 hover:bg-sky-50'}`}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-all hover:scale-110 ${darkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      {notifications.length === 0 ? (
        <div className="p-10 text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
            <Bell size={20} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
          </div>
          <p className={`text-xs font-black ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>All caught up!</p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No new notifications</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((n, i) => {
            const Icon = typeIcon[n.type] || Info;
            return (
              <div key={i}
                className={`flex gap-3 px-4 py-3.5 border-b last:border-0 transition-colors relative
                  ${n.read ? 'opacity-60' : ''}
                  ${darkMode ? 'border-white/[0.04] hover:bg-white/[0.03]' : 'border-gray-50 hover:bg-slate-50/80'}`}
              >
                {!n.read && (
                  <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${typeDot[n.type] || 'bg-sky-500'}`} />
                )}
                <Icon size={15} className={`mt-0.5 flex-shrink-0 ${typeColor[n.type] || 'text-sky-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-black leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{n.title}</p>
                  {n.body && <p className={`text-xs mt-0.5 leading-snug ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{n.body}</p>}
                  {n.time && <p className={`text-[10px] mt-1 font-medium ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{n.time}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   APP HEADER
══════════════════════════════════════════════════════════ */
export default function AppHeader({
  darkMode, toggleTheme, loading, onRefresh, isMobile,
  notifications = [], onMarkAllRead,
  onToast, // (type, title, body) => void — passed from parent that has useToast
}) {
  const { userType, userInfo, handleLogout } = useApp();
  const pathname = usePathname();
  const { time: phTime, date: phDate } = usePHClock();

  const [showLogout,    setShowLogout]    = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [refreshSpin,   setRefreshSpin]   = useState(false);
  const [mounted,       setMounted]       = useState(false);
  const [scrollDir,     setScrollDir]     = useState('up'); // hide on scroll-down mobile

  const notifsRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  // Hide header on scroll-down (mobile)
  useEffect(() => {
    if (!isMobile) return;
    const h = () => {
      const y = window.scrollY;
      setScrollDir(y > lastScrollY.current + 4 && y > 60 ? 'down' : 'up');
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [isMobile]);

  // Close notif panel outside click
  useEffect(() => {
    const h = (e) => { if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) handleRefresh();
      if (e.key === 't' && !e.metaKey && !e.ctrlKey) toggleTheme();
      if (e.key === '?') setShowShortcuts(v => !v);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [loading]);

  const handleRefresh = useCallback(() => {
    if (loading || refreshSpin) return;
    setRefreshSpin(true);
    setTimeout(() => setRefreshSpin(false), 800);
    onRefresh?.();
    onToast?.('info', 'Refreshing…', 'Fetching latest attendance data');
  }, [loading, refreshSpin, onRefresh, onToast]);

  const handleLogoutConfirm = () => {
    setShowLogout(false);
    handleLogout();
  };

  const teacherTabs = [
    { href: '/dashboard', icon: Home,     label: 'Dashboard' },
    { href: '/classroom', icon: Users,    label: 'Classroom' },
    { href: '/logs',      icon: FileText, label: 'Logs'      },
  ];

  const unread = notifications.filter(n => !n.read).length;

  return (
    <>
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-2xl transition-all duration-300
          ${darkMode ? 'bg-[#050810]/90 border-white/6' : 'bg-white/92 border-black/6'}
          shadow-[0_1px_0_rgba(0,0,0,0.05)]
          ${isMobile && scrollDir === 'down' ? '-translate-y-full' : 'translate-y-0'}`}
      >
        {/* Animated progress bar */}
        <div
          className="h-0.5 w-full transition-opacity duration-300"
          style={{
            opacity: loading ? 1 : 0,
            background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981,#0ea5e9)',
            backgroundSize: '300% 100%',
            animation: 'hdr-sweep 1.8s linear infinite',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">

            {/* Logo + greeting */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <AppLogo size="sm" darkMode={darkMode} />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                  <span className={`relative rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 ${darkMode ? 'border-[#050810]' : 'border-white'}`} />
                </span>
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className={`text-sm font-black tracking-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {userType === 'teacher' ? 'Teacher Portal' : 'Parent Portal'}
                </p>
                <p className={`text-xs truncate max-w-[180px] md:max-w-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {getGreeting()},{' '}
                  <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {userInfo?.fullName || 'User'}
                  </span>
                </p>
              </div>
            </div>

            {/* Desktop nav tabs */}
            {!isMobile && userType === 'teacher' && (
              <nav className={`flex items-center gap-0.5 p-1 rounded-2xl ${darkMode ? 'bg-white/[0.05] border border-white/8' : 'bg-gray-100/80 border border-gray-200/60'}`}>
                {teacherTabs.map(tab => {
                  const active = pathname === tab.href;
                  return (
                    <Link key={tab.href} href={tab.href}
                      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold
                        transition-all duration-200 hover:scale-105 active:scale-95
                        ${active
                          ? darkMode ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                          : darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-white/6' : 'text-gray-500 hover:text-gray-700 hover:bg-white/70'
                        }`}
                    >
                      {active && <span className="absolute bottom-0.5 left-3.5 right-3.5 h-px rounded-full" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed)' }} />}
                      <tab.icon size={14} />
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">

              {/* Live clock */}
              {mounted && !isMobile && (
                <div className={`hidden lg:flex flex-col items-end px-3 py-1.5 rounded-xl mr-1 border text-right select-none
                  ${darkMode ? 'bg-white/[0.03] border-white/6' : 'bg-gray-50 border-gray-200'}`}>
                  <span className={`text-xs font-black tabular-nums leading-tight tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{phTime}</span>
                  <span className={`text-[10px] font-semibold leading-tight ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{phDate}</span>
                </div>
              )}

              {/* Keyboard shortcuts */}
              {!isMobile && (
                <Tooltip label="Shortcuts (?)" darkMode={darkMode}>
                  <button onClick={() => setShowShortcuts(true)}
                    className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95
                      ${darkMode ? 'hover:bg-white/6 text-gray-500' : 'hover:bg-black/6 text-gray-400'}`}>
                    <Keyboard size={16} />
                  </button>
                </Tooltip>
              )}

              {/* Notifications */}
              <div className="relative" ref={notifsRef}>
                <Tooltip label="Notifications" darkMode={darkMode}>
                  <button onClick={() => setShowNotifs(v => !v)}
                    className={`relative p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95
                      ${showNotifs
                        ? darkMode ? 'bg-white/8 text-sky-400' : 'bg-sky-50 text-sky-600'
                        : darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'
                      }`}
                  >
                    <Bell size={17} className={`transition-all duration-300 ${showNotifs ? 'scale-110' : ''}`} />
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 min-w-[14px] h-3.5 rounded-full text-white text-[9px] font-black flex items-center justify-center px-0.5 animate-bounce-once"
                        style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', boxShadow: `0 0 0 2px ${darkMode ? '#050810' : 'white'}` }}>
                        {unread}
                      </span>
                    )}
                  </button>
                </Tooltip>
                {showNotifs && (
                  <NotificationsPanel
                    darkMode={darkMode}
                    onClose={() => setShowNotifs(false)}
                    notifications={notifications}
                    onMarkAllRead={() => { onMarkAllRead?.(); setShowNotifs(false); }}
                  />
                )}
              </div>

              {/* Theme toggle */}
              <Tooltip label={`${darkMode ? 'Light' : 'Dark'} mode (T)`} darkMode={darkMode}>
                <button onClick={toggleTheme}
                  className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95
                    ${darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}
                >
                  <div style={{ transition: 'transform 0.45s cubic-bezier(0.34,1.5,0.64,1)', transform: darkMode ? 'rotate(0deg)' : 'rotate(-45deg)' }}>
                    {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                  </div>
                </button>
              </Tooltip>

              {/* Refresh */}
              {onRefresh && (
                <Tooltip label="Refresh (R)" darkMode={darkMode}>
                  <button onClick={handleRefresh} disabled={loading}
                    className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-40
                      ${darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}
                  >
                    <RefreshCw size={17} className={`transition-colors duration-300 ${loading || refreshSpin ? 'animate-spin text-sky-500' : ''}`} />
                  </button>
                </Tooltip>
              )}

              {/* Logout */}
              <Tooltip label="Sign out" darkMode={darkMode}>
                <button onClick={() => setShowLogout(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold
                    transition-all duration-200 hover:scale-105 active:scale-95
                    ${darkMode ? 'hover:bg-rose-500/10 text-gray-400 hover:text-rose-400' : 'hover:bg-rose-50 text-gray-500 hover:text-rose-600'}`}
                >
                  <LogOut size={15} />
                  {!isMobile && <span>Logout</span>}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes hdr-sweep      { 0%{background-position:200% center} 100%{background-position:-200% center} }
          @keyframes hdr-modal      { from{opacity:0;transform:translateY(16px) scale(0.96)} to{opacity:1;transform:none} }
          @keyframes hdr-slide-down { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:none} }
          @keyframes hdr-bar-sweep  { 0%{background-position:200% center} 100%{background-position:-200% center} }
          @keyframes bounce-once    { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} 70%{transform:translateY(-2px)} }
          .animate-bounce-once { animation: bounce-once 0.5s ease-out; }
        `}</style>
      </header>

      {showLogout    && <LogoutModal    darkMode={darkMode} onConfirm={handleLogoutConfirm} onCancel={() => setShowLogout(false)} />}
      {showShortcuts && <ShortcutsModal darkMode={darkMode} onClose={() => setShowShortcuts(false)} />}
    </>
  );
}

/* ══ Mobile bottom nav ══ */
export function MobileNav({ darkMode }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/dashboard', icon: Home,     label: 'Dashboard' },
    { href: '/classroom', icon: Users,    label: 'Classroom' },
    { href: '/logs',      icon: FileText, label: 'Logs'      },
  ];

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-2xl
        ${darkMode ? 'bg-[#050810]/95 border-white/6' : 'bg-white/95 border-gray-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}
    >
      <div className="flex">
        {tabs.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 select-none active:scale-90
                ${active ? 'text-sky-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              {/* Icon with active scale + glow dot */}
              <div className="relative">
                <tab.icon size={22} className={`transition-all duration-200 ${active ? 'scale-110' : 'scale-100'}`} />
                {active && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-sky-500"
                    style={{ boxShadow: '0 0 6px #0ea5e9' }} />
                )}
              </div>
              <span className="text-xs font-bold">{tab.label}</span>
              {/* Animated underline pill */}
              <div
                className="h-0.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: active ? '20px' : '0px',
                  background: active ? 'linear-gradient(90deg,#0ea5e9,#7c3aed)' : 'transparent',
                }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}