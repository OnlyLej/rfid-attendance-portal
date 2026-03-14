'use client';
import { RouteGuard } from '../_lib/RouteGuard';
import { useApp } from '../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../_lib/usePageLayout';
import PageShell from '../_components/PageShell';
import { Skeleton } from '../_components/ui';
import { normalizeId, getPhTodayStr, getPhLocalDate, parsePhTimestamp } from '../_lib/data';
import { useMemo, useState } from 'react';
import { BarChart3, Download, FileText, TrendingUp, Users, Calendar, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ExcelJS from 'exceljs';

const PH_TZ = 'Asia/Manila';

function StatBox({ label, value, sub, color, darkMode }) {
  return (
    <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
      <p className={`text-3xl font-black leading-none mb-1`} style={{ color }}>{value}</p>
      <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
      {sub && <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { students, logs, classes, loading, fetchData } = useApp();
  const [range, setRange] = useState('30');
  const [exporting, setExporting] = useState(false);

  const today = getPhTodayStr();

  const rangeNum = parseInt(range);

  const dateRange = useMemo(() => {
    return Array.from({ length: rangeNum }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (rangeNum - 1 - i));
      return d.toLocaleDateString('en-CA', { timeZone: PH_TZ });
    });
  }, [rangeNum]);

  const dailyData = useMemo(() => dateRange.map(date => {
    const dayLogs = logs.filter(l => getPhLocalDate(l.timestamp) === date);
    const present = new Set(dayLogs.filter(l => l.status === 'IN').map(l => normalizeId(l.studentId))).size;
    const d = new Date(date + 'T00:00:00');
    const label = d.toLocaleDateString('en-PH', { timeZone: PH_TZ, month: 'short', day: 'numeric' });
    return { date, label, present, absent: Math.max(0, students.length - present), rate: students.length > 0 ? Math.round((present / students.length) * 100) : 0 };
  }), [dateRange, logs, students]);

  const classData = useMemo(() => classes.map(cls => {
    const clsStudents = students.filter(s => s.class === cls);
    const todayLogs = logs.filter(l => getPhLocalDate(l.timestamp) === today);
    const present = new Set(
      todayLogs.filter(l => l.status === 'IN' && clsStudents.some(s => normalizeId(s.studentId) === normalizeId(l.studentId))).map(l => normalizeId(l.studentId))
    ).size;
    return { cls, total: clsStudents.length, present, rate: clsStudents.length > 0 ? Math.round((present / clsStudents.length) * 100) : 0 };
  }).sort((a, b) => b.rate - a.rate), [classes, students, logs, today]);

  const overallRate = useMemo(() => {
    if (!dailyData.length) return 0;
    return Math.round(dailyData.reduce((s, d) => s + d.rate, 0) / dailyData.filter(d => d.present > 0 || d.absent > 0).length || 1);
  }, [dailyData]);

  const peakDay = useMemo(() => dailyData.reduce((m, d) => d.present > m.present ? d : m, dailyData[0] || {}), [dailyData]);
  const totalPresences = useMemo(() => dailyData.reduce((s, d) => s + d.present, 0), [dailyData]);

  async function handleExport() {
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Attendance Report');
      ws.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Present', key: 'present', width: 12 },
        { header: 'Absent', key: 'absent', width: 12 },
        { header: 'Rate (%)', key: 'rate', width: 12 },
      ];
      const hRow = ws.getRow(1);
      hRow.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF0EA5E9'} }; c.font = { bold:true, color:{argb:'FFFFFFFF'} }; });
      dailyData.forEach(d => ws.addRow(d));
      const buf = await wb.xlsx.writeBuffer();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      a.download = `report_${today}.xlsx`; a.click();
    } finally { setExporting(false); }
  }

  const gridColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tickColor = darkMode ? '#475569' : '#94a3b8';

  return (
    <RouteGuard allowedRoles={['teacher']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>
        <div className="fade-in-up space-y-5">

          {/* Controls row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Attendance Reports</h2>
            <div className="flex gap-2 items-center">
              <div className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${darkMode ? 'bg-white/[0.04] border-white/8 text-white' : 'bg-white border-gray-200 text-gray-700 shadow-sm'}`}>
                <Calendar size={14} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                <select value={range} onChange={e => setRange(e.target.value)} className="bg-transparent outline-none cursor-pointer">
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="60">Last 60 days</option>
                </select>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-sky-500/20"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)' }}
              >
                <Download size={14} />
                {exporting ? 'Exporting…' : 'Export'}
              </button>
            </div>
          </div>

          {/* Stat boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="Avg Attendance Rate" value={loading ? '—' : `${overallRate}%`} sub={`over ${range} days`} color="#0ea5e9" darkMode={darkMode} />
            <StatBox label="Total Presences" value={loading ? '—' : totalPresences} sub="check-ins recorded" color="#10b981" darkMode={darkMode} />
            <StatBox label="Peak Day" value={loading ? '—' : (peakDay?.label || '—')} sub={`${peakDay?.present || 0} present`} color="#f59e0b" darkMode={darkMode} />
            <StatBox label="Total Students" value={loading ? '—' : students.length} sub={`across ${classes.length} classes`} color="#7c3aed" darkMode={darkMode} />
          </div>

          {/* Daily trend chart */}
          <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            <p className={`text-sm font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily Attendance Trend</p>
            {loading
              ? <div className="h-52 flex items-end gap-1">{Array.from({length:rangeNum > 14 ? 20 : rangeNum}).map((_,i) => <Skeleton key={i} darkMode={darkMode} className="flex-1 rounded-t-lg" style={{height:`${30+Math.random()*60}%`}} />)}</div>
              : <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(rangeNum / 7)} />
                    <YAxis tick={{ fill: tickColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: darkMode ? '#0d1220' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`, borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="present" stroke="#0ea5e9" fill="url(#rptGrad)" strokeWidth={2} dot={false} name="Present" />
                  </AreaChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Class breakdown */}
          <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            <div className={`px-5 py-4 border-b ${darkMode ? 'border-white/[0.05]' : 'border-gray-100'}`}>
              <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Class Breakdown — Today</p>
            </div>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`flex items-center gap-4 px-5 py-4 border-b last:border-0 ${darkMode ? 'border-white/[0.04]' : 'border-gray-50'}`}>
                    <Skeleton darkMode={darkMode} className="h-4 w-24 rounded" />
                    <Skeleton darkMode={darkMode} className="flex-1 h-2.5 rounded-full" />
                    <Skeleton darkMode={darkMode} className="h-4 w-12 rounded" />
                  </div>
                ))
              : classData.map(({ cls, total, present, rate }) => (
                  <div key={cls} className={`flex items-center gap-4 px-5 py-4 border-b last:border-0 ${darkMode ? 'border-white/[0.04]' : 'border-gray-50'}`}>
                    <p className={`text-sm font-bold w-32 truncate flex-shrink-0 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cls}</p>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${rate}%`, background: rate >= 90 ? '#10b981' : rate >= 70 ? '#f59e0b' : '#f43f5e' }}
                      />
                    </div>
                    <p className={`text-xs font-semibold w-20 text-right flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{present}/{total}</p>
                    <p className={`text-sm font-black w-12 text-right flex-shrink-0 ${rate >= 90 ? 'text-emerald-500' : rate >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>{rate}%</p>
                  </div>
                ))
            }
          </div>
        </div>
      </PageShell>
    </RouteGuard>
  );
}