'use client';

/**
 * AppHeader + Navigation System
 *
 * Desktop  → collapsible sidebar (left edge, slides open/closed)
 * Mobile   → floating liquid-glass tab bar (bottom, hovers above content)
 *
 * Liquid glass effect:
 *   backdrop-filter: blur + saturate + contrast
 *   layered semi-transparent gradients
 *   inner highlight border
 *   soft drop shadow
 *   the active pill slides between tabs with CSS transform
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sun, Moon, RefreshCw, LogOut, Home, Users, FileText, RadioTower,
  Bell, X, AlertTriangle, CheckCircle, Info, XCircle, Keyboard,
  ChevronLeft, ChevronRight, Menu,
} from 'lucide-react';
import { useApp } from '../_lib/AppContext';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const PH_TZ = 'Asia/Manila';
const TABS = [
  { href: '/dashboard', icon: Home,     label: 'Dashboard', color: '#0ea5e9' },
  { href: '/classroom', icon: Users,    label: 'Classroom', color: '#7c3aed' },
  { href: '/logs',      icon: FileText, label: 'Logs',      color: '#10b981' },
];

/* ─────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────── */
function usePHClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(n.toLocaleDateString('en-PH',  { timeZone: PH_TZ, weekday: 'short', month: 'short', day: 'numeric' }));
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return { time, date };
}

function getGreeting() {
  const h = parseInt(new Date().toLocaleString('en-PH', { hour: 'numeric', hour12: false, timeZone: PH_TZ }));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/* ─────────────────────────────────────────────────────────
   APP LOGO
───────────────────────────────────────────────────────── */
function AppLogo({ size = 'md', collapsed = false }) {
  const [err, setErr] = useState(false);
  const sz = size === 'sm' ? 'w-8 h-8' : size === 'xs' ? 'w-6 h-6' : 'w-10 h-10';
  const ic = size === 'sm' ? 14 : size === 'xs' ? 11 : 18;
  const logo = err ? null : (
    <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" onError={() => setErr(true)} />
  );
  return (
    <div className={`${sz} rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-sky-400 to-violet-600 flex items-center justify-center shadow-lg shadow-sky-500/30`}>
      {!err ? <img src="/favicon.ico" alt="" className="w-full h-full object-cover" onError={() => setErr(true)} /> : <RadioTower size={ic} className="text-white" />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   LIQUID GLASS HELPERS
   We build the glass look with inline styles so it works
   even without Tailwind arbitrary-value support.
───────────────────────────────────────────────────────── */
function glassStyle(darkMode, extra = {}) {
  return {
    background: darkMode
      ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.48) 100%)',
    backdropFilter: 'blur(24px) saturate(180%) brightness(1.05)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(1.05)',
    border: darkMode
      ? '1px solid rgba(255,255,255,0.09)'
      : '1px solid rgba(255,255,255,0.75)',
    boxShadow: darkMode
      ? '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)'
      : '0 8px 40px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
    ...extra,
  };
}

/* ─────────────────────────────────────────────────────────
   LOGOUT MODAL
───────────────────────────────────────────────────────── */
function LogoutModal({ darkMode, onConfirm, onCancel }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden nav-modal-in"
        style={glassStyle(darkMode, { boxShadow: '0 32px 80px rgba(0,0,0,0.45)' })}>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#f43f5e,#f59e0b)' }} />
        <div className="p-7 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-rose-500" />
          </div>
          <h3 className={`text-lg font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sign out?</h3>
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>You'll need to sign back in.</p>
          <div className="flex gap-2.5">
            <button onClick={onCancel}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95 ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/6' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              Stay
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)', boxShadow: '0 4px 20px rgba(244,63,94,0.35)' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SHORTCUTS MODAL
───────────────────────────────────────────────────────── */
function ShortcutsModal({ darkMode, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xs rounded-2xl overflow-hidden nav-modal-in"
        style={glassStyle(darkMode, { boxShadow: '0 24px 64px rgba(0,0,0,0.4)' })}>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed)' }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Keyboard size={14} className="text-sky-500" />
              <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Keyboard Shortcuts</p>
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-all hover:scale-110 ${darkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
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

/* ─────────────────────────────────────────────────────────
   NOTIFICATIONS PANEL
───────────────────────────────────────────────────────── */
const T_ICON  = { success: CheckCircle, error: XCircle, warn: AlertTriangle, info: Info };
const T_COLOR = { success:'text-emerald-500', error:'text-rose-500', warn:'text-amber-500', info:'text-sky-500' };
const T_DOT   = { success:'bg-emerald-500',   error:'bg-rose-500',   warn:'bg-amber-500',   info:'bg-sky-500'   };

function NotificationsPanel({ darkMode, onClose, notifications = [], onMarkAllRead }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl overflow-hidden nav-slide-down"
      style={glassStyle(darkMode, { boxShadow: '0 20px 56px rgba(0,0,0,0.25)' })}>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981)' }} />
      <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-white/6' : 'border-gray-200/60'}`}>
        <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</p>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button onClick={onMarkAllRead} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${darkMode ? 'text-sky-400 hover:bg-sky-500/10' : 'text-sky-600 hover:bg-sky-50'}`}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-all hover:scale-110 ${darkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X size={13} />
          </button>
        </div>
      </div>
      {notifications.length === 0 ? (
        <div className="p-10 text-center">
          <Bell size={22} className={`mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`text-xs font-black ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>All caught up!</p>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          {notifications.map((n, i) => {
            const Icon = T_ICON[n.type] || Info;
            return (
              <div key={i} className={`flex gap-3 px-4 py-3.5 border-b last:border-0 transition-colors ${n.read ? 'opacity-55' : ''} ${darkMode ? 'border-white/[0.04] hover:bg-white/[0.04]' : 'border-gray-50 hover:bg-slate-50'}`}>
                {!n.read && <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${T_DOT[n.type] || 'bg-sky-500'}`} />}
                <Icon size={15} className={`mt-0.5 flex-shrink-0 ${T_COLOR[n.type] || 'text-sky-500'}`} />
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

/* ─────────────────────────────────────────────────────────
   DESKTOP SIDEBAR
───────────────────────────────────────────────────────── */
export function DesktopSidebar({ darkMode, toggleTheme, loading, onRefresh, notifications = [], onMarkAllRead, onToast, sidebarOpen, setSidebarOpen }) {
  const { userType, userInfo, handleLogout } = useApp();
  const pathname = usePathname();
  const { time, date } = usePHClock();

  const [showLogout,    setShowLogout]    = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [refreshSpin,   setRefreshSpin]   = useState(false);
  const [mounted,       setMounted]       = useState(false);
  const notifsRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Active tab index for sliding indicator
  const activeIdx = TABS.findIndex(t => pathname.startsWith(t.href));
  const activeTab = TABS[activeIdx] || TABS[0];

  // Close notifs on outside click
  useEffect(() => {
    const h = (e) => { if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'r' && !e.metaKey) handleRefresh();
      if (e.key === 't' && !e.metaKey) toggleTheme();
      if (e.key === 'b' && !e.metaKey) setSidebarOpen(v => !v);
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
    onToast?.('info', 'Refreshing…', 'Fetching latest data');
  }, [loading, refreshSpin, onRefresh, onToast]);

  const unread = notifications.filter(n => !n.read).length;

  // Sidebar widths
  const W_OPEN   = 240;
  const W_CLOSED = 64;
  const w = sidebarOpen ? W_OPEN : W_CLOSED;

  return (
    <>
      {/* ── Sidebar panel ── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 overflow-hidden"
        style={{
          width: w,
          transition: 'width 0.35s cubic-bezier(0.34,1.1,0.64,1)',
          ...glassStyle(darkMode, {
            borderRadius: '0 20px 20px 0',
            boxShadow: darkMode
              ? '4px 0 48px rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.06)'
              : '4px 0 48px rgba(0,0,0,0.1), inset -1px 0 0 rgba(255,255,255,0.8)',
            border: 'none',
            borderRight: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          }),
        }}
      >
        {/* Loading stripe */}
        <div className="h-0.5 flex-shrink-0 transition-opacity duration-300" style={{ opacity: loading ? 1 : 0, background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981,#0ea5e9)', backgroundSize: '300%', animation: 'nav-sweep 1.8s linear infinite' }} />

        {/* Logo + brand */}
        <div className={`flex items-center gap-3 px-3.5 py-4 flex-shrink-0 border-b ${darkMode ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
          <div className="flex-shrink-0">
            <AppLogo size="sm" />
          </div>
          <div className="overflow-hidden" style={{ opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s', width: sidebarOpen ? 'auto' : 0 }}>
            <p className={`text-sm font-black tracking-tight whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {userType === 'teacher' ? 'Teacher Portal' : 'Parent Portal'}
            </p>
            <p className={`text-[10px] font-semibold whitespace-nowrap ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {getGreeting()}, <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{userInfo?.fullName?.split(' ')[0] || 'User'}</span>
            </p>
          </div>
          {/* Collapse toggle — only shown on open sidebar */}
        </div>

        {/* Nav tabs (teacher only) */}
        {userType === 'teacher' && (
          <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-hidden">
            {/* Sliding active pill background */}
            <div className="relative">
              {/* Ghost items to measure height */}
              {TABS.map((tab, i) => {
                const active = pathname.startsWith(tab.href);
                return (
                  <Link key={tab.href} href={tab.href}
                    className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group mb-0.5
                      ${active ? 'text-white' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    style={{ overflow: 'hidden' }}
                  >
                    {/* Active sliding bg */}
                    {active && (
                      <span
                        className="absolute inset-0 rounded-xl nav-pill-in"
                        style={{
                          background: `linear-gradient(135deg,${tab.color}cc,${tab.color}88)`,
                          boxShadow: `0 4px 20px ${tab.color}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
                        }}
                      />
                    )}
                    {/* Hover bg */}
                    {!active && (
                      <span className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${darkMode ? 'bg-white/6' : 'bg-black/5'}`} />
                    )}

                    <tab.icon
                      size={18}
                      className="relative z-10 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ filter: active ? 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' : undefined }}
                    />

                    {/* Label — hidden when collapsed */}
                    <span
                      className="relative z-10 text-sm font-bold whitespace-nowrap overflow-hidden"
                      style={{
                        maxWidth: sidebarOpen ? '140px' : '0px',
                        opacity: sidebarOpen ? 1 : 0,
                        transition: 'max-width 0.28s cubic-bezier(0.34,1.1,0.64,1), opacity 0.2s',
                      }}
                    >
                      {tab.label}
                    </span>

                    {/* Active dot when collapsed */}
                    {active && !sidebarOpen && (
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" style={{ boxShadow: `0 0 6px ${tab.color}` }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Bottom section: clock + actions */}
        <div className={`flex-shrink-0 px-2.5 pb-4 space-y-1 border-t ${darkMode ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>

          {/* Live clock */}
          {mounted && sidebarOpen && (
            <div className={`mx-1 mt-3 mb-1 px-3 py-2 rounded-xl text-center ${darkMode ? 'bg-white/[0.04]' : 'bg-black/[0.03]'}`}>
              <p className={`text-sm font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>{time}</p>
              <p className={`text-[10px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{date}</p>
            </div>
          )}
          {mounted && !sidebarOpen && (
            <div className="flex justify-center pt-3 pb-1">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
            </div>
          )}

          {/* Action buttons */}
          {[
            { icon: Bell,     label: 'Notifications', action: () => setShowNotifs(v => !v), badge: unread,  active: showNotifs },
            { icon: darkMode ? Sun : Moon, label: darkMode ? 'Light mode' : 'Dark mode', action: toggleTheme, badge: 0 },
            { icon: RefreshCw, label: 'Refresh (R)', action: handleRefresh, spin: loading || refreshSpin },
            { icon: Keyboard,  label: 'Shortcuts (?)', action: () => setShowShortcuts(true) },
            { icon: LogOut,    label: 'Sign out',    action: () => setShowLogout(true), danger: true },
          ].map((btn, i) => (
            <div key={i} className="relative" ref={i === 0 ? notifsRef : undefined}>
              <button
                onClick={btn.action}
                disabled={btn.spin && btn.label.includes('Refresh') && loading}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold
                  transition-all duration-200 group overflow-hidden
                  ${btn.active
                    ? darkMode ? 'bg-white/8 text-sky-400' : 'bg-sky-50 text-sky-600'
                    : btn.danger
                      ? darkMode ? 'text-gray-400 hover:text-rose-400' : 'text-gray-500 hover:text-rose-600'
                      : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                <span className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  ${btn.danger ? darkMode ? 'bg-rose-500/10' : 'bg-rose-50' : darkMode ? 'bg-white/6' : 'bg-black/5'}`} />
                <btn.icon
                  size={18}
                  className={`relative z-10 flex-shrink-0 transition-all duration-300 group-hover:scale-110
                    ${btn.spin ? 'animate-spin text-sky-500' : ''}`}
                />
                {btn.badge > 0 && (
                  <span className="absolute left-5 top-1.5 min-w-[14px] h-3.5 rounded-full text-white text-[8px] font-black flex items-center justify-center px-0.5"
                    style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', boxShadow: `0 0 0 2px ${darkMode ? 'rgba(5,8,16,0.9)' : 'rgba(255,255,255,0.9)'}` }}>
                    {btn.badge}
                  </span>
                )}
                <span className="relative z-10 whitespace-nowrap overflow-hidden"
                  style={{ maxWidth: sidebarOpen ? '140px' : '0px', opacity: sidebarOpen ? 1 : 0, transition: 'max-width 0.28s cubic-bezier(0.34,1.1,0.64,1), opacity 0.2s' }}>
                  {btn.label}
                </span>
              </button>
              {i === 0 && showNotifs && (
                <NotificationsPanel darkMode={darkMode} onClose={() => setShowNotifs(false)} notifications={notifications} onMarkAllRead={() => { onMarkAllRead?.(); setShowNotifs(false); }} />
              )}
            </div>
          ))}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className={`absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center
            transition-all duration-300 hover:scale-110 active:scale-90 z-10`}
          style={glassStyle(darkMode, { boxShadow: '0 4px 16px rgba(0,0,0,0.2)', border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)' })}
        >
          <div style={{ transition: 'transform 0.35s cubic-bezier(0.34,1.3,0.64,1)', transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            <ChevronLeft size={13} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          </div>
        </button>
      </aside>

      {showLogout    && <LogoutModal    darkMode={darkMode} onConfirm={() => { setShowLogout(false); handleLogout(); }} onCancel={() => setShowLogout(false)} />}
      {showShortcuts && <ShortcutsModal darkMode={darkMode} onClose={() => setShowShortcuts(false)} />}

      <style jsx global>{`
        @keyframes nav-sweep  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes nav-modal-in { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:none} }
        @keyframes nav-slide-down { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        @keyframes nav-pill-in { from{opacity:0;transform:scaleX(0.8)} to{opacity:1;transform:scaleX(1)} }
        .nav-modal-in   { animation: nav-modal-in   0.3s cubic-bezier(0.34,1.5,0.64,1) both; }
        .nav-slide-down { animation: nav-slide-down 0.2s ease-out both; }
        .nav-pill-in    { animation: nav-pill-in    0.25s cubic-bezier(0.34,1.3,0.64,1) both; }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   TOP HEADER BAR (desktop — sits above content, slim)
   Shows loading bar + user name + page title
───────────────────────────────────────────────────────── */
export default function AppHeader({ darkMode, loading, sidebarOpen }) {
  const { userType, userInfo } = useApp();
  const pathname = usePathname();
  const activeTab = TABS.find(t => pathname.startsWith(t.href)) || TABS[0];

  return (
    <header
      className="hidden md:flex sticky top-0 z-30 items-center h-14 px-5 gap-4 flex-shrink-0 transition-all duration-300"
      style={glassStyle(false, {
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        boxShadow: 'none',
        border: 'none',
        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)',
      })}
    >
      {/* Loading bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-300"
        style={{ opacity: loading ? 1 : 0, background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981,#0ea5e9)', backgroundSize: '300%', animation: 'nav-sweep 1.8s linear infinite' }} />

      {/* Page title with color dot */}
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: activeTab.color, boxShadow: `0 0 10px ${activeTab.color}88` }} />
        <h1 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeTab.label}</h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User pill */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-white/[0.05] text-gray-300' : 'bg-black/[0.04] text-gray-600'}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-70" />
          <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        {userInfo?.fullName || 'User'}
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   MOBILE LIQUID GLASS FLOATING TAB BAR
───────────────────────────────────────────────────────── */
export function MobileNav({ darkMode }) {
  const pathname = usePathname();
  const activeIdx = TABS.findIndex(t => pathname.startsWith(t.href));
  const safeIdx = activeIdx === -1 ? 0 : activeIdx;
  const [pressedIdx, setPressedIdx] = useState(null);

  // The pill slides left/right using translateX
  // Each tab takes 1/3 of the bar width, pill is slightly smaller
  const PILL_OFFSET = `calc(${safeIdx} * 33.333% + 4px)`;

  return (
    <div
      className="md:hidden fixed bottom-5 left-1/2 z-50"
      style={{
        transform: 'translateX(-50%)',
        width: 'min(360px, calc(100vw - 32px))',
        paddingBottom: 'env(safe-area-inset-bottom,0px)',
      }}
    >
      {/* Outer glow orb behind the bar */}
      <div
        className="absolute inset-x-4 -bottom-2 h-8 blur-xl rounded-full opacity-40 pointer-events-none"
        style={{ background: `linear-gradient(90deg,${TABS[safeIdx].color}88,${TABS[(safeIdx + 1) % 3].color}55)`, transition: 'background 0.4s' }}
      />

      <nav
        className="relative rounded-[22px] p-1 overflow-hidden"
        style={glassStyle(darkMode, {
          borderRadius: '22px',
          padding: '4px',
          boxShadow: darkMode
            ? '0 16px 60px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 16px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.95)',
        })}
      >
        {/* Inner top highlight */}
        <div className="absolute top-0 left-6 right-6 h-px rounded-full pointer-events-none"
          style={{ background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,1)' }} />

        {/* Sliding color pill */}
        <div
          className="absolute top-1 bottom-1 rounded-[18px] pointer-events-none"
          style={{
            left: PILL_OFFSET,
            width: 'calc(33.333% - 8px)',
            background: `linear-gradient(135deg,${TABS[safeIdx].color}ee,${TABS[safeIdx].color}99)`,
            boxShadow: `0 4px 20px ${TABS[safeIdx].color}66, inset 0 1px 0 rgba(255,255,255,0.25)`,
            transition: 'left 0.38s cubic-bezier(0.34,1.3,0.64,1), background 0.3s, box-shadow 0.3s',
          }}
        >
          {/* Pill inner top gloss */}
          <div className="absolute top-0 left-4 right-4 h-px rounded-full bg-white/40" />
          {/* Pill inner shine blob */}
          <div className="absolute top-1 left-2 right-2 h-3 rounded-full bg-white/10 blur-sm" />
        </div>

        {/* Tab buttons */}
        <div className="relative flex">
          {TABS.map((tab, i) => {
            const active   = safeIdx === i;
            const pressed  = pressedIdx === i;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onTouchStart={() => setPressedIdx(i)}
                onTouchEnd={() => setPressedIdx(null)}
                onMouseDown={() => setPressedIdx(i)}
                onMouseUp={() => setPressedIdx(null)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-[18px] select-none"
                style={{
                  transition: 'transform 0.15s',
                  transform: pressed ? 'scale(0.88)' : 'scale(1)',
                }}
              >
                {/* Icon */}
                <div
                  className="relative"
                  style={{
                    transition: 'transform 0.35s cubic-bezier(0.34,1.5,0.64,1)',
                    transform: active ? 'scale(1.15) translateY(-1px)' : 'scale(1)',
                  }}
                >
                  <tab.icon
                    size={20}
                    style={{
                      color: active ? '#ffffff' : darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
                      transition: 'color 0.25s',
                      filter: active ? `drop-shadow(0 0 6px rgba(255,255,255,0.5))` : 'none',
                    }}
                  />
                  {/* Active inner glow dot above icon */}
                  {active && (
                    <span
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/80"
                      style={{ animation: 'nav-dot-in 0.3s ease-out both', boxShadow: '0 0 4px rgba(255,255,255,0.8)' }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className="text-[10px] font-black leading-none"
                  style={{
                    color: active ? '#ffffff' : darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                    transition: 'color 0.25s',
                    letterSpacing: active ? '0.02em' : '0',
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MOBILE TOP HEADER (slim, shows page + actions)
───────────────────────────────────────────────────────── */
export function MobileHeader({ darkMode, toggleTheme, loading, onRefresh, notifications = [], onMarkAllRead, onToast }) {
  const { userType, userInfo, handleLogout } = useApp();
  const pathname = usePathname();
  const activeTab = TABS.find(t => pathname.startsWith(t.href)) || TABS[0];
  const { time } = usePHClock();
  const [mounted, setMounted] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [refreshSpin, setRefreshSpin] = useState(false);
  const [scrollDir, setScrollDir] = useState('up');
  const lastY = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const h = () => {
      const y = window.scrollY;
      setScrollDir(y > lastY.current + 6 && y > 50 ? 'down' : 'up');
      lastY.current = y;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const handleRefresh = () => {
    if (loading || refreshSpin) return;
    setRefreshSpin(true);
    setTimeout(() => setRefreshSpin(false), 700);
    onRefresh?.();
    onToast?.('info', 'Refreshing…');
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <>
      <header
        className={`md:hidden sticky top-0 z-30 flex items-center h-14 px-4 gap-3
          transition-all duration-300 ${scrollDir === 'down' ? '-translate-y-full' : 'translate-y-0'}`}
        style={glassStyle(darkMode, {
          borderRadius: 0,
          borderBottom: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
          boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
          border: 'none',
          borderBottom: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
        })}
      >
        {/* Loading bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-300"
          style={{ opacity: loading ? 1 : 0, background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981,#0ea5e9)', backgroundSize: '300%', animation: 'nav-sweep 1.8s linear infinite' }} />

        {/* Logo */}
        <AppLogo size="xs" />

        {/* Page title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300"
            style={{ background: activeTab.color, boxShadow: `0 0 8px ${activeTab.color}88` }} />
          <p className={`text-sm font-black truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeTab.label}</p>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          {mounted && (
            <div className={`text-[10px] font-black tabular-nums px-2 py-1 rounded-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{time}</div>
          )}
          <button onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div style={{ transition: 'transform 0.4s cubic-bezier(0.34,1.5,0.64,1)', transform: darkMode ? 'rotate(0)' : 'rotate(-30deg)' }}>
              {darkMode ? <Sun size={16}/> : <Moon size={16}/>}
            </div>
          </button>
          <button onClick={handleRefresh} disabled={loading}
            className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 disabled:opacity-40 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <RefreshCw size={16} className={loading || refreshSpin ? 'animate-spin text-sky-500' : ''} />
          </button>
          <button onClick={() => setShowLogout(true)}
            className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${darkMode ? 'text-gray-400 hover:text-rose-400' : 'text-gray-500 hover:text-rose-600'}`}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {showLogout && (
        <LogoutModal darkMode={darkMode}
          onConfirm={() => { setShowLogout(false); handleLogout(); }}
          onCancel={() => setShowLogout(false)} />
      )}

      <style jsx global>{`
        @keyframes nav-dot-in { from{opacity:0;transform:translateX(-50%) scale(0)} to{opacity:1;transform:translateX(-50%) scale(1)} }
      `}</style>
    </>
  );
  }
