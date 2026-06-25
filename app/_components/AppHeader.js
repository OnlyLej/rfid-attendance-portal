'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Sun, Moon, RefreshCw,
  Menu,
} from 'lucide-react';
import { useApp } from '../_lib/AppContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

const PH_TZ = 'Asia/Manila';

const PAGE_TITLES = {
  '/dashboard':    'dashboard',
  '/classroom':    'classroom',
  '/logs':         'logs',
  '/parent':       'parent',
  '/students':     'students',
  '/reports':      'reports',
  '/alerts':       'alerts',
  '/child-profile':'childProfile',
  '/calendar':     'calendar',
  '/progress':     'progress',
};

function getGreeting(t) {
  const h = parseInt(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false }));
  if (h < 12) return t('greetings.morning');
  if (h < 18) return t('greetings.afternoon');
  return t('greetings.evening');
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

export default function AppHeader({
  darkMode, toggleTheme, loading, onRefresh, isMobile,
  sidebarCollapsed, onToggleSidebar, onToast,
}) {
  const { userInfo } = useApp();
  const pathname = usePathname();
  const t = useTranslations();
  const [refreshSpin,   setRefreshSpin]   = useState(false);
  const [mounted,       setMounted]       = useState(false);
  const [scrollDir,     setScrollDir]     = useState('up');
  const lastScrollY = useRef(0);
  const pageTitleKey = PAGE_TITLES[pathname] || 'common.appName';
  const pageTitle = t(pageTitleKey);

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

  const handleRefresh = useCallback(() => {
    if (loading || refreshSpin) return;
    setRefreshSpin(true);
    setTimeout(() => setRefreshSpin(false), 800);
    onRefresh?.();
    onToast?.('info', t('common.refresh'), t('common.loading'));
  }, [loading, refreshSpin, onRefresh, onToast, t]);



  return (
    <>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-2xl transition-all duration-300 ${darkMode ? 'bg-[#050810]/90 border-white/6' : 'bg-white/90 border-black/6'} shadow-[0_1px_0_rgba(0,0,0,0.05)] ${isMobile && scrollDir === 'down' ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="px-4 sm:px-5">
          <div className="h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {isMobile && (
                <button onClick={onToggleSidebar} className={`p-2 rounded-xl flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}>
                  <Menu size={18} />
                </button>
              )}
              <div className="flex items-center gap-2 min-w-0">
                <p className={`text-sm font-black tracking-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pageTitle}</p>
              </div>
              {!isMobile && mounted && (
                <p className={`hidden sm:block text-xs truncate max-w-[200px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  — {getGreeting(t)},{' '}
                  <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userInfo?.fullName || t('common.username')}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <LanguageSwitcher darkMode={darkMode} />
              <Tooltip label={darkMode ? t('common.lightMode') : t('common.darkMode')} darkMode={darkMode}>
                <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}>
                  <div style={{ transition: 'transform .45s cubic-bezier(.34,1.5,.64,1)', transform: darkMode ? 'rotate(0)' : 'rotate(-30deg)' }}>
                    {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                  </div>
                </button>
              </Tooltip>
              {onRefresh && (
                <Tooltip label={t('common.refresh')} darkMode={darkMode}>
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
    </>
  );
}
