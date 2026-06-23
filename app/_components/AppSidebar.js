'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
    { id: 'dashboard',  labelKey: 'dashboard',   icon: LayoutDashboard, color: '#0ea5e9', href: '/dashboard',  matchExact: true  },
    { id: 'classroom',  labelKey: 'classroom',   icon: GraduationCap,   color: '#0ea5e9', href: '/classroom',  matchExact: false },
    { id: 'students',   labelKey: 'students',    icon: Users,           color: '#0ea5e9', href: '/students',   matchExact: false },
    { id: 'logs',       labelKey: 'logs',        icon: ClipboardList,   color: '#0ea5e9', href: '/logs',       matchExact: false },
    { id: 'reports',    labelKey: 'reports',     icon: BarChart3,       color: '#0ea5e9', href: '/reports',    matchExact: false },
    { id: 'alerts',     labelKey: 'alerts',      icon: AlertTriangle,   color: '#0ea5e9', href: '/alerts',     matchExact: false },
  ],
  system: [
    { id: 'signout', labelKey: 'signOut', icon: LogOut, color: '#f43f5e', href: '#signout', isSignOut: true },
  ],
};

const PARENT_SECTIONS = {
  main: [
    { id: 'home',          labelKey: 'home',          icon: Home,         color: '#0ea5e9', href: '/parent',        matchExact: true  },
    { id: 'child-profile', labelKey: 'childProfile', icon: User,         color: '#0ea5e9', href: '/child-profile', matchExact: false },
    { id: 'calendar',      labelKey: 'calendar',      icon: CalendarDays, color: '#0ea5e9', href: '/calendar',      matchExact: false },
    { id: 'progress',      labelKey: 'progress',      icon: TrendingUp,   color: '#0ea5e9', href: '/progress',      matchExact: false },
  ],
  system: [
    { id: 'signout', labelKey: 'signOut', icon: LogOut, color: '#f43f5e', href: '#signout', isSignOut: true },
  ],
};

function checkActive(item, pathname, search) {
  if (item.isSignOut)   return false;
  if (item.matchExact)  return pathname === item.href && !search;
  if (item.matchSearch) return pathname === item.href.split('?')[0] && search.includes(item.matchSearch);
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

function SidebarLogo({ darkMode, t }) {
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
        <p className={`text-[13px] font-black tracking-tight leading-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('common.appName')}</p>
        <p className={`text-[10px] font-semibold leading-tight truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('common.appSubtitle')}</p>
      </div>
    </div>
  );
}

function NavItem({ item, active, darkMode, collapsed, onSignOut, t }) {
  const Icon = item.icon;
  const label = t(`nav.${item.labelKey}`);

  if (item.isSignOut) {
    return (
      <button
        onClick={onSignOut}
        title={collapsed ? label : undefined}
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
          <span className="text-[13px] font-semibold truncate leading-none flex-1">{label}</span>
        )}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? label : undefined}
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
      <Icon size={17} className="flex-shrink-0" style={{ color: active ? '#fff' : undefined }} />
      {!collapsed && (
        <span className="text-[13px] font-semibold truncate leading-none flex-1">{label}</span>
      )}
      {!collapsed && item.badge > 0 && (
        <span className="ml-auto min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-black flex items-center justify-center px-1 flex-shrink-0" style={{ background: '#f43f5e' }}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ labelKey, darkMode, collapsed, t }) {
  if (collapsed) return <div className={`mx-3 my-2 h-px ${darkMode ? 'bg-white/[0.07]' : 'bg-black/[0.07]'}`} />;
  return (
    <p className={`px-3 pt-4 pb-1.5 text-[10px] font-black uppercase tracking-[0.12em] select-none ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
      {t(`nav.${labelKey}`)}
    </p>
  );
}

function UserCard({ darkMode, collapsed, userInfo, userType }) {
  return (
    <div className={`flex-shrink-0 border-t px-3 py-3 ${darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]'}`} style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
      <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed ? (
          <div className="flex-1 min-w-0 px-1">
            <p className={`text-[13px] font-black truncate leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {userInfo?.fullName || userInfo?.username || 'User'}
            </p>
            <p className={`text-[10px] font-semibold truncate leading-tight capitalize ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {userType || 'Guest'}
            </p>
          </div>
        ) : (
          <User size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
        )}
      </div>
    </div>
  );
}

function LogoutModal({ darkMode, onConfirm, onCancel, t }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={onCancel} />
      <div
        className={`relative w-full max-w-sm rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)', animation: 'sidebar-modal .3s cubic-bezier(.34,1.5,.64,1) both' }}
      >
        <div className="p-7 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center mx-auto mb-4">
            <LogOut size={24} className="text-rose-500" />
          </div>
          <h3 className={`text-lg font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('auth.logoutConfirm')}</h3>
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('auth.logoutMessage')}</p>
          <div className="flex gap-2.5">
            <button onClick={onCancel} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95 ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/6' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t('auth.stay')}</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95" style={{ background: '#e11d48' }}>{t('auth.signOutBtn')}</button>
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
  const t = useTranslations();
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
        {/* Header */}
        <div className="flex-shrink-0 flex items-center px-3 py-4" style={{ justifyContent: isCollapsed ? 'center' : 'space-between' }}>
          {/* Logo — hidden when collapsed */}
          {!isCollapsed && <SidebarLogo darkMode={darkMode} t={t} />}

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
          <SectionLabel labelKey="menu" darkMode={darkMode} collapsed={isCollapsed} t={t} />
          <div className="space-y-0.5">
            {mainItems.map(item => (
              <NavItem key={item.id} item={item} active={checkActive(item, pathname, search)} darkMode={darkMode} collapsed={isCollapsed} onSignOut={() => setShowLogout(true)} t={t} />
            ))}
          </div>

          <SectionLabel labelKey="account" darkMode={darkMode} collapsed={isCollapsed} t={t} />
          <div className="space-y-0.5">
            {systemItems.map(item => (
              <NavItem key={item.id} item={item} active={false} darkMode={darkMode} collapsed={isCollapsed} onSignOut={() => setShowLogout(true)} t={t} />
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
          t={t}
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
