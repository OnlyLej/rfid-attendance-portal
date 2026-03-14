'use client';

/**
 * AppHeader  —  slim top bar alongside AppSidebar
 *   ● Sidebar toggle (mobile hamburger)
 *   ● Live status dot + page title + greeting
 *   ● Live PH clock (desktop)
 *   ● Keyboard shortcuts modal  (press ?)
 *   ● Notifications panel
 *   ● Theme toggle
 *   ● Refresh button
 *
 * MobileNav  —  floating liquid-glass pill bar (mobile, kept for mobile UX)
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sun, Moon, RefreshCw, Home, Users, FileText,
  Bell, X, AlertTriangle, CheckCircle, Info, XCircle, Keyboard,
  Menu,
} from 'lucide-react';
import { useApp } from '../_lib/AppContext';
import { useState, useEffect, useRef, useCallback } from 'react';

const PH_TZ = 'Asia/Manila';

const TABS = [
  { href: '/dashboard', icon: Home,     label: 'Dashboard', color: '#0ea5e9', glow: 'rgba(14,165,233,0.4)'  },
  { href: '/classroom', icon: Users,    label: 'Classroom', color: '#7c3aed', glow: 'rgba(124,58,237,0.4)' },
  { href: '/logs',      icon: FileText, label: 'Logs',      color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/classroom': 'Classroom',
  '/logs':      'Logs & Reports',
  '/parent':    'Parent Portal',
};

function usePHClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(n.toLocaleDateString('en-PH',  { timeZone: PH_TZ, weekday: 'short', month: 'short', day: 'numeric' }));
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

function Tooltip({ label, children, darkMode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <div
        className="absolute top-full left-1/2 mt-2 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap pointer-events-none z-[70] transition-all duration-150"
        style={{ transform: `translateX(-50%) translateY(${show ? '0' : '4px'})`, opacity: show ? 1 : 0, background: '#111827', color: '#f9fafb', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
      >
        {label}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: '#111827' }} />
      </div>
    </div>
  );
}

function ShortcutsModal({ darkMode, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-xs rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.35)', animation: 'hdr-modal .3s cubic-bezier(.34,1.5,.64,1) both' }}>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed)' }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Keyboard size={14} className="text-sky-500" />
              <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Keyboard Shortcuts</p>
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X size={14} />
            </button>
          </div>
          {[['R','Refresh data'],['T','Toggle theme'],['B','Toggle sidebar'],['?','Show this help'],['Esc','Close panels']].map(([k,d],i) => (
            <div key={i} className={`flex items-center justify-between py-2.5 border-b last:border-0 ${darkMode ? 'border-white/[0.05]' : 'border-gray-100'}`}>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{d}</span>
              <kbd className={`px-2.5 py-1 rounded-lg text-xs font-black border font-mono ${darkMode ? 'bg-white/8 border-white/12 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>{k}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const T_ICON  = { success: CheckCircle, error: XCircle, warn: AlertTriangle, info: Info };
const T_COLOR = { success: 'text-emerald-500', error: 'text-rose-500', warn: 'text-amber-500', info: 'text-sky-500' };
const T_DOT   = { success: 'bg-emerald-500', error: 'bg-rose-500', warn: 'bg-amber-500', info: 'bg-sky-500' };

function NotificationsPanel({ darkMode, onClose, notifications, onMarkAllRead }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className={`absolute right-0 top-full mt-2 w-[22rem] z-50 rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200/80'}`}
      style={{ boxShadow: '0 20px 56px rgba(0,0,0,0.25)', animation: 'hdr-slide-down .2s ease-out both' }}>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981)' }} />
      <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-white/6' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</p>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)' }}>
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button onClick={onMarkAllRead} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${darkMode ? 'text-sky-400 hover:bg-sky-500/10' : 'text-sky-600 hover:bg-sky-50'}`}>Mark all read</button>
          )}
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X size={13} />
          </button>
        </div>
      </div>
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
            const Icon = T_ICON[n.type] || Info;
            return (
              <div key={i} className={`relative flex gap-3 px-4 py-3.5 border-b last:border-0 transition-colors ${n.read ? 'opacity-55' : ''} ${darkMode ? 'border-white/[0.04] hover:bg-white/[0.04]' : 'border-gray-50 hover:bg-slate-50'}`}>
                {!n.read && <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${T_DOT[n.type]||'bg-sky-500'}`} />}
                <Icon size={15} className={`mt-0.5 flex-shrink-0 ${T_COLOR[n.type]||'text-sky-500'}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{n.title}</p>
                  {n.body && <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{n.body}</p>}
                  {n.time && <p className={`text-[10px] mt-1 font-medium ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{n.time}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppHeader({
  darkMode, toggleTheme, loading, onRefresh, isMobile,
  sidebarCollapsed, onToggleSidebar,
  notifications = [], onMarkAllRead, onToast,
}) {
  const { userInfo } = useApp();
  const pathname = usePathname();
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [refreshSpin,   setRefreshSpin]   = useState(false);
  const [mounted,       setMounted]       = useState(false);
  const [scrollDir,     setScrollDir]     = useState('up');
  const notifsRef   = useRef(null);
  const lastScrollY = useRef(0);
  const { time: phTime, date: phDate } = usePHClock();
  const pageTitle = PAGE_TITLES[pathname] || 'RFID Portal';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isMobile) return;
    const h = () => {
      const y = window.scrollY;
      setScrollDir(y > lastScrollY.current + 6 && y > 60 ? 'down' : 'up');
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [isMobile]);

  useEffect(() => {
    const h = (e) => { if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) handleRefresh();
      if (e.key === 't' && !e.metaKey && !e.ctrlKey) toggleTheme();
      if (e.key === 'b' && !e.metaKey && !e.ctrlKey) onToggleSidebar?.();
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

  const unread = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-2xl transition-all duration-300 ${darkMode ? 'bg-[#050810]/90 border-white/6' : 'bg-white/90 border-black/6'} shadow-[0_1px_0_rgba(0,0,0,0.05)] ${isMobile && scrollDir === 'down' ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="h-0.5 w-full transition-opacity duration-300" style={{ opacity: loading ? 1 : 0, background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981,#0ea5e9)', backgroundSize: '300% 100%', animation: 'hdr-sweep 1.8s linear infinite' }} />
        <div className="px-4 sm:px-5">
          <div className="h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {isMobile && (
                <Tooltip label="Menu (B)" darkMode={darkMode}>
                  <button onClick={onToggleSidebar} className={`p-2 rounded-xl flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}>
                    <Menu size={18} />
                  </button>
                </Tooltip>
              )}
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute h-2 w-2 rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <p className={`text-sm font-black tracking-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pageTitle}</p>
              </div>
              {!isMobile && mounted && (
                <p className={`hidden sm:block text-xs truncate max-w-[200px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  — {getGreeting()},{' '}
                  <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userInfo?.fullName || 'User'}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {mounted && !isMobile && (
                <div className={`hidden lg:flex flex-col items-end px-3 py-1.5 rounded-xl border mr-1 select-none ${darkMode ? 'bg-white/[0.03] border-white/6' : 'bg-gray-50 border-gray-200'}`}>
                  <span className={`text-xs font-black tabular-nums leading-tight tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{phTime}</span>
                  <span className={`text-[10px] font-semibold leading-tight ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{phDate}</span>
                </div>
              )}
              {!isMobile && (
                <Tooltip label="Shortcuts (?)" darkMode={darkMode}>
                  <button onClick={() => setShowShortcuts(true)} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/6 text-gray-500' : 'hover:bg-black/6 text-gray-400'}`}>
                    <Keyboard size={16} />
                  </button>
                </Tooltip>
              )}
              <div className="relative" ref={notifsRef}>
                <Tooltip label="Notifications" darkMode={darkMode}>
                  <button onClick={() => setShowNotifs(v => !v)} className={`relative p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90 ${showNotifs ? darkMode ? 'bg-white/8 text-sky-400' : 'bg-sky-50 text-sky-600' : darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}>
                    <Bell size={17} className={`transition-all duration-300 ${showNotifs ? 'scale-110' : ''}`} />
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 min-w-[14px] h-3.5 rounded-full text-white text-[9px] font-black flex items-center justify-center px-0.5"
                        style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', boxShadow: `0 0 0 2px ${darkMode ? '#050810' : 'white'}`, animation: 'badge-bounce .5s ease-out' }}>
                        {unread}
                      </span>
                    )}
                  </button>
                </Tooltip>
                {showNotifs && <NotificationsPanel darkMode={darkMode} onClose={() => setShowNotifs(false)} notifications={notifications} onMarkAllRead={() => { onMarkAllRead?.(); setShowNotifs(false); }} />}
              </div>
              <Tooltip label={`${darkMode ? 'Light' : 'Dark'} mode (T)`} darkMode={darkMode}>
                <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}>
                  <div style={{ transition: 'transform .45s cubic-bezier(.34,1.5,.64,1)', transform: darkMode ? 'rotate(0)' : 'rotate(-30deg)' }}>
                    {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                  </div>
                </button>
              </Tooltip>
              {onRefresh && (
                <Tooltip label="Refresh (R)" darkMode={darkMode}>
                  <button onClick={handleRefresh} disabled={loading} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90 disabled:opacity-40 ${darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}>
                    <RefreshCw size={17} className={`transition-colors duration-300 ${loading || refreshSpin ? 'animate-spin text-sky-500' : ''}`} />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
        <style jsx global>{`
          @keyframes hdr-sweep      { 0%{background-position:200% center} 100%{background-position:-200% center} }
          @keyframes hdr-modal      { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:none} }
          @keyframes hdr-slide-down { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:none} }
          @keyframes badge-bounce   { 0%,100%{transform:scale(1)} 40%{transform:scale(1.3)} 70%{transform:scale(0.9)} }
        `}</style>
      </header>
      {showShortcuts && <ShortcutsModal darkMode={darkMode} onClose={() => setShowShortcuts(false)} />}
    </>
  );
}

export function MobileNav({ darkMode }) {
  const pathname  = usePathname();
  const activeIdx = TABS.findIndex(t => pathname === t.href || pathname.startsWith(t.href + '/'));
  const safeIdx   = activeIdx === -1 ? 0 : activeIdx;
  const [pressed, setPressed] = useState(null);
  return (
    <div className="md:hidden fixed bottom-5 left-1/2 z-50" style={{ transform: 'translateX(-50%)', width: 'min(360px, calc(100vw - 32px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="absolute inset-x-8 -bottom-3 h-10 rounded-full blur-2xl opacity-55 pointer-events-none" style={{ background: `radial-gradient(ellipse, ${TABS[safeIdx].glow}, transparent 70%)`, transition: 'background 0.4s ease' }} />
      <nav className="relative rounded-[22px] overflow-hidden" style={{ padding: '4px', background: darkMode ? 'linear-gradient(135deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.04) 100%)' : 'linear-gradient(135deg,rgba(255,255,255,0.88) 0%,rgba(255,255,255,0.72) 100%)', backdropFilter: 'blur(32px) saturate(180%) brightness(1.05)', WebkitBackdropFilter: 'blur(32px) saturate(180%) brightness(1.05)', border: darkMode ? '1px solid rgba(255,255,255,0.11)' : '1px solid rgba(255,255,255,0.85)', boxShadow: darkMode ? '0 18px 70px rgba(0,0,0,0.7),0 4px 22px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.13)' : '0 18px 70px rgba(0,0,0,0.15),0 4px 18px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1)' }}>
        <div className="absolute top-1 bottom-1 rounded-[18px] pointer-events-none" style={{ left: `calc(${safeIdx} * 33.333% + 4px)`, width: 'calc(33.333% - 8px)', background: `linear-gradient(135deg,${TABS[safeIdx].color}f5,${TABS[safeIdx].color}99)`, boxShadow: `0 4px 26px ${TABS[safeIdx].glow},inset 0 1px 0 rgba(255,255,255,0.30)`, transition: 'left 0.42s cubic-bezier(0.34,1.3,0.64,1),background 0.3s,box-shadow 0.3s' }} />
        <div className="relative flex">
          {TABS.map((tab, i) => {
            const active = safeIdx === i;
            const isPress = pressed === i;
            return (
              <Link key={tab.href} href={tab.href} onTouchStart={() => setPressed(i)} onTouchEnd={() => setPressed(null)} onMouseDown={() => setPressed(i)} onMouseUp={() => setPressed(null)} onMouseLeave={() => setPressed(null)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-[18px] select-none"
                style={{ transition: 'transform 0.15s cubic-bezier(0.34,1.5,0.64,1)', transform: isPress ? 'scale(0.83)' : 'scale(1)' }}>
                <div style={{ position: 'relative', transition: 'transform 0.40s cubic-bezier(0.34,1.5,0.64,1)', transform: active ? 'scale(1.20) translateY(-2px)' : 'scale(1)' }}>
                  <tab.icon size={21} style={{ color: active ? '#ffffff' : darkMode ? 'rgba(255,255,255,0.38)' : 'rgba(15,23,42,0.38)', transition: 'color 0.25s,filter 0.25s', filter: active ? 'drop-shadow(0 0 7px rgba(255,255,255,0.6))' : 'none' }} />
                  {active && <span style={{ position:'absolute', top:'-7px', left:'50%', transform:'translateX(-50%)', width:'4px', height:'4px', borderRadius:'50%', background:'rgba(255,255,255,0.85)', boxShadow:'0 0 5px rgba(255,255,255,0.8)', animation:'nav-dot-pop 0.3s cubic-bezier(0.34,1.5,0.64,1) both' }} />}
                </div>
                <span className="font-black leading-none" style={{ fontSize:'10px', letterSpacing:'0.02em', color: active ? '#ffffff' : darkMode ? 'rgba(255,255,255,0.32)' : 'rgba(15,23,42,0.35)', transition:'color 0.25s' }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <style jsx global>{`@keyframes nav-dot-pop { from{opacity:0;transform:translateX(-50%) scale(0.3)} to{opacity:1;transform:translateX(-50%) scale(1)} }`}</style>
    </div>
  );
}
