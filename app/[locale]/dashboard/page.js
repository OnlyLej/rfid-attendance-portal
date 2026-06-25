'use client';
import { RouteGuard } from '../../_lib/RouteGuard';
import { useApp } from '../../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../../_lib/usePageLayout';
import PageShell from '../../_components/PageShell';
import DashboardTab from '../../_components/DashboardTab';

export default function DashboardPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { logs, students, classes, loading, stats, weeklyData, fetchData } = useApp();

  return (
    <RouteGuard allowedRoles={['teacher']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>
        <div className="fade-in-up">
          <DashboardTab darkMode={darkMode} stats={stats} weekData={weeklyData} students={students} logs={logs} classes={classes} loading={loading} />
        </div>
      </PageShell>
    </RouteGuard>
  );
}