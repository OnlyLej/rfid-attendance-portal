'use client';

import { useEffect, useState, useCallback } from 'react';
import { RouteGuard } from '../_lib/RouteGuard';
import { useApp } from '../_lib/AppContext';
import AppHeader from '../_components/AppHeader';
import AppSidebar from '../_components/AppSidebar';
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

function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);
  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', next ? 'true' : 'false');
      return next;
    });
  }, []);
  return [collapsed, toggle];
}

const SIDEBAR_W_EXPANDED  = 260;
const SIDEBAR_W_COLLAPSED = 64;

export default function DashboardPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { logs, students, classes, loading, stats, weeklyData, fetchData } = useApp();

  const sidebarW = isMobile ? 0 : (sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);

  return (
    <RouteGuard allowedRoles={['teacher']}>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f1117]' : 'bg-white'}`}>
        {/* Sidebar — hidden on mobile */}
        {!isMobile && (
          <AppSidebar
            darkMode={darkMode}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            isMobile={false}
          />
        )}

        {/* Mobile sidebar overlay */}
        <div
          className={`fixed inset-0 z-[39] transition-all duration-300 ${isMobile && !sidebarCollapsed ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{ opacity: isMobile && !sidebarCollapsed ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleSidebar} />
        </div>
        {isMobile && (
          <AppSidebar
            darkMode={darkMode}
            collapsed={false}
            onToggleCollapse={toggleSidebar}
            isMobile={true}
            mobileOpen={!sidebarCollapsed}
          />
        )}

        {/* Main content shifted right by sidebar width */}
        <div style={{ marginLeft: isMobile ? 0 : sidebarW, transition: 'margin-left 0.32s cubic-bezier(0.34,1.1,0.64,1)' }}>
          <AppHeader
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            loading={loading}
            onRefresh={fetchData}
            isMobile={isMobile}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />
          <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6`}>
            <div className="animate-fade-in-up">
              <DashboardTab darkMode={darkMode} stats={stats} weekData={weeklyData} students={students} logs={logs} classes={classes} loading={loading} />
            </div>
          </main>
        </div>
        <PageStyles />
      </div>
    </RouteGuard>
  );
}

function PageStyles() {
  return (
    <style jsx global>{`
      @keyframes fade-in-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      .animate-fade-in-up { animation: fade-in-up 0.45s ease-out both; }
      .skeleton-pulse { animation: skeleton-pulse 1.5s ease-in-out infinite; }
      html { scroll-behavior: smooth; }
      ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(148,163,184,0.3);border-radius:99px}
    `}</style>
  );
}