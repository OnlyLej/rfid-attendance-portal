'use client';

import { useEffect, useState } from 'react';
import { RouteGuard } from '../_lib/RouteGuard';
import { useAttendanceData } from '../_lib/data';
import AppHeader, { MobileNav } from '../_components/AppHeader';
import LogsTab from '../_components/LogsTab';
import ExcelJS from 'exceljs';
import { getPhTodayStr } from '../_lib/data';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') { setDarkMode(true); document.documentElement.classList.add('dark'); }
  }, []);
  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };
  return [darkMode, toggleTheme];
}

export default function LogsPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const { logs, loading, fetchData } = useAttendanceData('teacher');

  useEffect(() => { fetchData(); }, []);

  const exportToExcel = async (logsToExport = [], filenameSuffix = '') => {
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
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
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
  };

  const exportToCSV = (logsToExport, filenameSuffix = '') => exportToExcel(logsToExport || logs, filenameSuffix);

  return (
    <RouteGuard allowedRoles={['teacher']}>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f1117]' : 'bg-slate-50/80'}`}>
        <AppHeader darkMode={darkMode} toggleTheme={toggleTheme} loading={loading} onRefresh={fetchData} isMobile={isMobile} />
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 ${isMobile ? 'pb-24' : ''}`}>
          <div className="animate-fade-in-up">
            <LogsTab darkMode={darkMode} loading={loading} logs={logs} exportToCSV={exportToCSV} />
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
      .animate-fade-in-up { animation: fade-in-up 0.45s ease-out both; }
      .animate-loading-bar { animation: loading-bar 1.6s ease-in-out infinite; }
      html { scroll-behavior: smooth; }
      ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 99px; }
    `}</style>
  );
}