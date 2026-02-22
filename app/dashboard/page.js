'use client';

import { useEffect, useState } from 'react';
import { RouteGuard } from '../_lib/RouteGuard';
import { useApp } from '../_lib/AppContext';
import AppHeader, { MobileNav } from '../_components/AppHeader';
import DashboardTab from '../_components/DashboardTab';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') { setDarkMode(true); document.documentElement.classList.add('dark'); }
  }, []);
  const toggleTheme = () => setDarkMode(prev => {
    const next = !prev;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    return next;
  });
  return [darkMode, toggleTheme];
}

export default function DashboardPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const { logs, students, classes, loading, stats, weeklyData, fetchData } = useApp();

  return (
    <RouteGuard allowedRoles={['teacher']}>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f1117]' : 'bg-slate-50/80'}`}>
        <AppHeader darkMode={darkMode} toggleTheme={toggleTheme} loading={loading} onRefresh={fetchData} isMobile={isMobile} />
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 ${isMobile ? 'pb-24' : ''}`}>
          <div className="animate-fade-in-up">
            <DashboardTab darkMode={darkMode} stats={stats} weekData={weeklyData} students={students} logs={logs} classes={classes} loading={loading} />
          </div>
        </main>
        {isMobile && <MobileNav darkMode={darkMode} />}
        <PageStyles />
      </div>
    </RouteGuard>
  );
}

function PageStyles() {
  return (
    <style jsx global>{`
      @keyframes fade-in-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes loading-bar { 0%{transform:translateX(-100%)} 50%{transform:translateX(0%)} 100%{transform:translateX(100%)} }
      @keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      .animate-fade-in-up { animation: fade-in-up 0.45s ease-out both; }
      .animate-loading-bar { animation: loading-bar 1.6s ease-in-out infinite; }
      .skeleton-pulse { animation: skeleton-pulse 1.5s ease-in-out infinite; }
      html { scroll-behavior: smooth; }
      ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(148,163,184,0.3);border-radius:99px}
    `}</style>
  );
}
