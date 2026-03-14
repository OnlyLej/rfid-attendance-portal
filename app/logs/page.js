'use client';

import { useEffect, useState, useCallback } from 'react';
import { RouteGuard } from '../_lib/RouteGuard';
import { useApp } from '../_lib/AppContext';
import AppHeader, { MobileNav } from '../_components/AppHeader';
import AppSidebar from '../_components/AppSidebar';
import LogsTab from '../_components/LogsTab';
import ExcelJS from 'exceljs';
import { getPhTodayStr } from '../_lib/data';

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

async function exportToExcel(logsToExport = [], filenameSuffix = '') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Records');
  worksheet.columns = [
    { header: 'Timestamp (PH Time)', key: 'timestamp', width: 25 },
    { header: 'Student ID',          key: 'studentId', width: 18 },
    { header: 'Name',                key: 'name',      width: 35 },
    { header: 'Class',               key: 'class',     width: 18 },
    { header: 'Status',              key: 'status',    width: 12 },
  ];
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  logsToExport.forEach(log => worksheet.addRow({ timestamp: log.timestamp, studentId: log.studentId, name: log.name, class: log.class, status: log.status }));
  worksheet.eachRow((row, rn) => {
    if (rn === 1) return;
    row.eachCell((cell, cn) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rn % 2 === 0 ? 'FFF0F9FF' : 'FFFFFFFF' } };
      cell.font = { size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: cn === 3 ? 'left' : 'center' };
      cell.border = { top:{style:'thin',color:{argb:'FFE5E7EB'}}, bottom:{style:'thin',color:{argb:'FFE5E7EB'}}, left:{style:'thin',color:{argb:'FFE5E7EB'}}, right:{style:'thin',color:{argb:'FFE5E7EB'}} };
      if (cn === 5) cell.font = { ...cell.font, bold: true, color: { argb: cell.value === 'IN' ? 'FF059669' : 'FFE11D48' } };
    });
  });
  worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: worksheet.rowCount, column: 5 } };
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `attendance_${getPhTodayStr()}${filenameSuffix}.xlsx`; a.click();
  URL.revokeObjectURL(url);
}

export default function LogsPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { logs, loading, fetchData } = useApp();

  const exportToCSV = (logsToExport, filenameSuffix = '') => exportToExcel(logsToExport || logs, filenameSuffix);

  const sidebarW = isMobile ? 0 : (sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);

  return (
    <RouteGuard allowedRoles={['teacher']}>
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
          <AppHeader darkMode={darkMode} toggleTheme={toggleTheme} loading={loading} onRefresh={fetchData} isMobile={isMobile} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
          <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 ${isMobile ? 'pb-24' : ''}`}>
            <div className="animate-fade-in-up">
              <LogsTab darkMode={darkMode} loading={loading} logs={logs} exportToCSV={exportToCSV} />
            </div>
          </main>
          {isMobile && <MobileNav darkMode={darkMode} />}
        </div>
        <PageStyles />
      </div>
    </RouteGuard>
  );
}

function PageStyles() {
  return (
    <style jsx global>{`
      @keyframes fade-in-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      .animate-fade-in-up{animation:fade-in-up 0.45s ease-out both}
      html{scroll-behavior:smooth}
      ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(148,163,184,0.3);border-radius:99px}
    `}</style>
  );
}