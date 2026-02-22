'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sun, Moon, RefreshCw, LogOut, Home, Users, FileText, RadioTower } from 'lucide-react';
import { useAuth } from '../_lib/AuthContext';
import { useState } from 'react';

const PH_TZ = 'Asia/Manila';

const AppLogo = ({ size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const sz = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const iconSz = size === 'sm' ? 13 : 16;
  if (!imgError) {
    return (
      <div className={`${sz} rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-sky-500/20`}>
        <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" onError={() => setImgError(true)} />
      </div>
    );
  }
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/20`}>
      <RadioTower size={iconSz} className="text-white" />
    </div>
  );
};

function getGreeting() {
  const h = parseInt(new Date().toLocaleString('en-PH', { hour: 'numeric', hour12: false, timeZone: PH_TZ }));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function AppHeader({ darkMode, toggleTheme, loading, onRefresh, isMobile }) {
  const { userType, userInfo, handleLogout } = useAuth();
  const pathname = usePathname();

  const teacherTabs = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/classroom', icon: Users, label: 'Classroom' },
    { href: '/logs', icon: FileText, label: 'Logs' },
  ];

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-all duration-300 ${darkMode ? 'bg-[#0f1117]/90 border-gray-800/80' : 'bg-white/95 border-gray-200/80'} shadow-sm`}>
      {loading && (
        <div className="h-0.5 bg-gradient-to-r from-sky-400 via-violet-500 to-sky-400 animate-loading-bar" />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo + greeting */}
          <div className="flex items-center gap-3 min-w-0">
            <AppLogo size="sm" />
            <div className="min-w-0 hidden sm:block">
              <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {userType === 'teacher' ? 'Teacher Portal' : 'Parent Portal'}
              </p>
              <p className={`text-xs truncate max-w-[180px] md:max-w-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {getGreeting()},{' '}
                <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {userInfo?.fullName || 'User'}
                </span>
              </p>
            </div>
          </div>

          {/* Desktop nav tabs (teacher only) */}
          {!isMobile && userType === 'teacher' && (
            <div className={`flex items-center gap-1 p-1 rounded-xl ${darkMode ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
              {teacherTabs.map(tab => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95
                      ${active
                        ? darkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm'
                        : darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                      }`}
                  >
                    <tab.icon size={15} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <RefreshCw size={17} className={loading ? 'animate-spin text-sky-500' : ''} />
              </button>
            )}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <LogOut size={16} />
              {!isMobile && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* Mobile bottom nav for teacher */
export function MobileNav({ darkMode }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/classroom', icon: Users, label: 'Classroom' },
    { href: '/logs', icon: FileText, label: 'Logs' },
  ];
  return (
    <nav className={`fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl ${darkMode ? 'bg-[#0f1117]/95 border-gray-800' : 'bg-white border-gray-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]'}`}>
      <div className="flex">
        {tabs.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 active:scale-95 ${active ? 'text-sky-500' : darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'}`}
            >
              <tab.icon size={22} className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
              <span className="text-xs font-semibold">{tab.label}</span>
              <div className={`h-0.5 rounded-full transition-all duration-300 ${active ? 'w-5 bg-sky-500' : 'w-0'}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}