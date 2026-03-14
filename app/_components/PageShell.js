'use client';
import AppHeader, { MobileNav } from './AppHeader';
import AppSidebar from './AppSidebar';
import { SIDEBAR_W_EXPANDED, SIDEBAR_W_COLLAPSED } from '../_lib/usePageLayout';

export default function PageShell({
  darkMode, toggleTheme, isMobile,
  sidebarCollapsed, toggleSidebar,
  loading, onRefresh,
  children, mobilePadding = true,
}) {
  const sidebarW = isMobile ? 0 : (sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f1117]' : 'bg-slate-50/80'}`}>
      {!isMobile && (
        <AppSidebar darkMode={darkMode} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      )}
      {isMobile && !sidebarCollapsed && (
        <>
          <div className="fixed inset-0 z-[39] bg-black/50 backdrop-blur-sm" onClick={toggleSidebar} />
          <AppSidebar darkMode={darkMode} collapsed={false} onToggleCollapse={toggleSidebar} />
        </>
      )}
      <div style={{ marginLeft: isMobile ? 0 : sidebarW, transition: 'margin-left 0.3s cubic-bezier(0.34,1.1,0.64,1)' }}>
        <AppHeader
          darkMode={darkMode} toggleTheme={toggleTheme}
          loading={loading} onRefresh={onRefresh}
          isMobile={isMobile}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 ${isMobile && mobilePadding ? 'pb-28' : ''}`}>
          {children}
        </main>
        {isMobile && <MobileNav darkMode={darkMode} />}
      </div>
      <style jsx global>{`
        @keyframes fade-in-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fade-in-up { animation: fade-in-up 0.4s ease-out both; }
        .skeleton-pulse { animation: skeleton-pulse 1.5s ease-in-out infinite; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(148,163,184,0.3);border-radius:99px}
      `}</style>
    </div>
  );
}