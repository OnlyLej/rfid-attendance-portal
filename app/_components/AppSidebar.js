'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Users, BarChart3,
  RadioTower, User, CalendarDays,
  GraduationCap, ClipboardList, TrendingUp,
  LogOut, PanelLeftClose, PanelLeftOpen,
  AlertTriangle, Home,
} from 'lucide-react';
import { useApp } from '../_lib/AppContext';
import { useState, Suspense } from 'react';

const SIDEBAR_W_EXPANDED  = 260;
const SIDEBAR_W_COLLAPSED = 64;

const TEACHER_SECTIONS = {
  main: [
    { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard, color: '#0ea5e9', href: '/dashboard',  matchExact: true  },
    { id: 'classroom',  label: 'Classroom',   icon: GraduationCap,   color: '#7c3aed', href: '/classroom',  matchExact: false },
    { id: 'students',   label: 'Students',    icon: Users,           color: '#8b5cf6', href: '/students',   matchExact: false },
    { id: 'logs',       label: 'Logs',        icon: ClipboardList,   color: '#10b981', href: '/logs',       matchExact: false },
    { id: 'reports',    label: 'Reports',     icon: BarChart3,       color: '#f59e0b', href: '/reports',    matchExact: false },
    { id: 'alerts',     label: 'Alerts',      icon: AlertTriangle,   color: '#f43f5e', href: '/alerts',     matchExact: false },
  ],
  system: [
    { id: 'signout', label: 'Sign Out', icon: LogOut, color: '#f43f5e', href: '#signout', isSignOut: true },
  ],
};

const PARENT_SECTIONS = {
  main: [
    { id: 'home',          label: 'Home',          icon: Home,         color: '#0ea5e9', href: '/parent',        matchExact: true  },
    { id: 'child-profile', label: 'Child Profile', icon: User,         color: '#7c3aed', href: '/child-profile', matchExact: false },
    { id: 'calendar',      label: 'Calendar',      icon: CalendarDays, color: '#10b981', href: '/calendar',      matchExact: false },
    { id: 'progress',      label: 'Progress',      icon: TrendingUp,   color: '#f59e0b', href: '/progress',      matchExact: false },
  ],
  system: [
    { id: 'signout', label: 'Sign Out', icon: LogOut, color: '#f43f5e', href: '#signout', isSignOut: true },
  ],
};

function checkActive(item, pathname, search) {
  if (item.isSignOut)   return false;
  if (item.matchExact)  return pathname === item.href && !search;
  if (item.matchSearch) return pathname === item.href.split('?')[0] && search.includes(item.matchSearch);
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

function SidebarLogo({ darkMode }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="flex items-center gap-3 overflow-hidden min-w-0">
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow overflow-hidden"
        style={{ background: darkMode ? '#1e2333' : '#f1f5f9' }}
      >
        {imgErr
          ? <RadioTower size={15} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
          : <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        }
      </div>
      <div className="min-w-0">
        <p className={`text-[13px] font-black tracking-tight leading-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>RFID Portal</p>
        <p className={`text-[10px] font-semibold leading-tight truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Attendance System</p>
      </div>
    </div>
  );
}

function NavItem({ item, active, darkMode, collapsed, onSignOut }) {
  const Icon = item.icon;

  if (item.isSignOut) {
    return (
      <button
        onClick={onSignOut}
        title={collapsed ? item.label : undefined}
        className={[
          'relative flex items-center gap-3 w-full rounded-xl transition-colors duration-150 select-none overflow-hidden',
          collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5',
          darkMode
            ? 'text-gray-400 hover:text-rose-400 hover:bg-rose-500/10'
            : 'text-gray-500 hover:text-rose-500 hover:bg-rose-50',
        ].join(' ')}
      >
        <Icon size={17} className="flex-shrink-0" />
        {!collapsed && (
          <span className="text-[13px] font-semibold truncate leading-none flex-1">{item.label}</span>
        )}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={[
        'relative flex items-center gap-3 w-full rounded-xl transition-colors duration-150 select-none overflow-hidden',
        collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5',
        active
          ? 'text-white'
          : darkMode
            ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
            : 'text-gray-500 hover:text-gray-900 hover:bg-black/[0.05]',
      ].join(' ')}
      style={active ? { background: `linear-gradient(135deg,${item.color}d0,${item.color}88)` } : undefined}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ background: 'rgba(255,255,255,0.7)' }} />
      )}
      <Icon size={17} className="flex-shrink-0" style={{ color: active ? '#fff' : undefined }} />
      {!collapsed && (
        <span className="text-[13px] font-semibold truncate leading-none flex-1">{item.label}</span>
      )}
      {!collapsed && item.badge > 0 && (
        <span className="ml-auto min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-black flex items-center justify-center px-1 flex-shrink-0" style={{ background: '#f43f5e' }}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ label, darkMode, collapsed }) {
  if (collapsed) return <div className={`mx-3 my-2 h-px ${darkMode ? 'bg-white/[0.07]' : 'bg-black/[0.07]'}`} />;
  return (
    <p className={`px-3 pt-4 pb-1.5 text-[10px] font-black uppercase tracking-[0.12em] select-none ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
      {label}
    </p>
  );
}

function UserCard({ darkMode, collapsed, userInfo, userType }) {
  const initial = (userInfo?.fullName || userInfo?.username || 'U').charAt(0).toUpperCase();
  return (
    <div className={`flex-shrink-0 border-t px-3 py-3 ${darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]'}`} style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
      <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
        <div
          className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[13px] font-black shadow-md"
          style={{ background: userType === 'teacher' ? 'linear-gradient(135deg,#0ea5e9,#7c3aed)' : 'linear-gradient(135deg,#10b981,#0ea5e9)' }}
        >
          {initial}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className={`text-[12px] font-black truncate leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {userInfo?.fullName || userInfo?.username || 'User'}
            </p>
            <p className={`text-[10px] font-semibold truncate leading-tight capitalize ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {userType || 'Guest'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LogoutModal({ darkMode, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={onCancel} />
      <div
        className={`relative w-full max-w-sm rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)', animation: 'sidebar-modal .3s cubic-bezier(.34,1.5,.64,1) both' }}
      >
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#f43f5e,#f59e0b)' }} />
        <div className="p-7 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center mx-auto mb-4">
            <LogOut size={24} className="text-rose-500" />
          </div>
          <h3 className={`text-lg font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sign out?</h3>
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>You'll need to sign back in.</p>
          <div className="flex gap-2.5">
            <button onClick={onCancel} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95 ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/6' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Stay</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/30" style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarInner({ darkMode, collapsed, onToggleCollapse, isMobile, mobileOpen = false }) {
  const { userType, userInfo, handleLogout } = useApp();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const search       = searchParams.toString();
  const [showLogout, setShowLogout] = useState(false);

  const tree        = userType === 'teacher' ? TEACHER_SECTIONS : PARENT_SECTIONS;
  const mainItems   = tree.main;
  const systemItems = tree.system;
  const isCollapsed = isMobile ? false : collapsed;

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-40 flex flex-col overflow-hidden"
        style={{
          width: isMobile ? SIDEBAR_W_EXPANDED : (isCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED),
          height: '100vh',
          ...(typeof CSS !== 'undefined' && CSS.supports?.('height', '100dvh') ? { height: '100dvh' } : {}),
          transform: isMobile ? (mobileOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W_EXPANDED}px)`) : 'none',
          transition: isMobile
            ? 'transform 0.32s cubic-bezier(0.34,1.1,0.64,1)'
            : 'width 0.32s cubic-bezier(0.34,1.1,0.64,1)',
          background: darkMode ? 'linear-gradient(180deg,#0a0e1c 0%,#060914 100%)' : 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',
          borderRight: darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
          boxShadow: darkMode ? '4px 0 40px rgba(0,0,0,0.5)' : '4px 0 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Top accent line */}
        <div className="h-[2px] flex-shrink-0" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981)' }} />

        {/* Header */}
        <div className="flex-shrink-0 flex items-center px-3 py-4" style={{ justifyContent: isCollapsed ? 'center' : 'space-between' }}>
          {/* Logo — hidden when collapsed */}
          {!isCollapsed && <SidebarLogo darkMode={darkMode} />}

          {/* Toggle button — centered when collapsed, right-aligned when expanded */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={[
              'flex-shrink-0 p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90',
              darkMode
                ? 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.06]'
                : 'text-gray-400 hover:text-gray-700 hover:bg-black/[0.06]',
            ].join(' ')}
          >
            {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 sidebar-scroll">
          <SectionLabel label="Menu" darkMode={darkMode} collapsed={isCollapsed} />
          <div className="space-y-0.5">
            {mainItems.map(item => (
              <NavItem key={item.id} item={item} active={checkActive(item, pathname, search)} darkMode={darkMode} collapsed={isCollapsed} onSignOut={() => setShowLogout(true)} />
            ))}
          </div>

          <SectionLabel label="Account" darkMode={darkMode} collapsed={isCollapsed} />
          <div className="space-y-0.5">
            {systemItems.map(item => (
              <NavItem key={item.id} item={item} active={false} darkMode={darkMode} collapsed={isCollapsed} onSignOut={() => setShowLogout(true)} />
            ))}
          </div>
        </nav>

        {/* User card */}
        <UserCard darkMode={darkMode} collapsed={isCollapsed} userInfo={userInfo} userType={userType} />
      </aside>

      {showLogout && (
        <LogoutModal
          darkMode={darkMode}
          onConfirm={() => { setShowLogout(false); handleLogout(); }}
          onCancel={() => setShowLogout(false)}
        />
      )}

      <style jsx global>{`
        @keyframes sidebar-modal {
          from { opacity:0; transform:translateY(12px) scale(0.97) }
          to   { opacity:1; transform:none }
        }
        .sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.2); border-radius: 99px; }
      `}</style>
    </>
  );
}

export default function AppSidebar(props) {
  return (
    <Suspense fallback={null}>
      <SidebarInner {...props} />
    </Suspense>
  );
}
