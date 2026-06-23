'use client';
import { RouteGuard } from '../../_lib/RouteGuard';
import { useApp } from '../../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../../_lib/usePageLayout';
import PageShell from '../../_components/PageShell';
import { Skeleton } from '../../_components/ui';
import { normalizeId, getPhTodayStr, getPhLocalDate, parsePhTimestamp } from '../../_lib/data';
import { useMemo, useState, useCallback } from 'react';
import { Download, Calendar, Printer } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ExcelJS from 'exceljs';

const PH_TZ = 'Asia/Manila';

function StatBox({ label, value, sub, color, darkMode }) {
  return (
    <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
      <p className="text-3xl font-black leading-none mb-1" style={{ color }}>{value}</p>
      <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
      {sub && <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PRINT ENGINE
   Opens a dedicated print window so the report is always
   clean, formal, and theme-accurate regardless of the app
   chrome that's on screen.
───────────────────────────────────────────────────────── */
function buildPrintHTML({ darkMode, range, overallRate, totalPresences, peakDay, students, classes, dailyData, classData, today }) {
  const isDark = darkMode;

  // Colour tokens — mirrors the live UI exactly
  const bg        = isDark ? '#0a0e1c' : '#f8fafc';
  const surface   = isDark ? '#111827' : '#ffffff';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const text      = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#64748b' : '#64748b';
  const accent    = '#0ea5e9';
  const emerald   = '#10b981';
  const amber     = '#f59e0b';
  const rose      = '#f43f5e';
  const violet    = '#7c3aed';

  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Sparkline SVG for daily trend (simple polyline, no lib needed in print)
  const sparkW = 560, sparkH = 90;
  const maxPresent = Math.max(...dailyData.map(d => d.present), 1);
  const pts = dailyData.map((d, i) => {
    const x = (i / Math.max(dailyData.length - 1, 1)) * sparkW;
    const y = sparkH - (d.present / maxPresent) * (sparkH - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const fillPts = `0,${sparkH} ${pts} ${sparkW},${sparkH}`;

  // Rate colour helper
  const rateColor = r => r >= 90 ? emerald : r >= 70 ? amber : rose;

  const statCards = [
    { label: 'Avg Attendance Rate', value: `${overallRate}%`, sub: `over ${range} days`, color: accent },
    { label: 'Total Presences',     value: totalPresences,    sub: 'check-ins recorded', color: emerald },
    { label: 'Peak Day',            value: peakDay?.label || '—', sub: `${peakDay?.present || 0} present`, color: amber },
    { label: 'Total Students',      value: students.length,   sub: `across ${classes.length} classes`, color: violet },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-value" style="color:${s.color}">${s.value}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>`).join('');

  const classRows = classData.map(({ cls, total, present, rate }) => `
    <tr>
      <td class="td-class">${cls}</td>
      <td class="td-num">${present}</td>
      <td class="td-num">${total}</td>
      <td class="td-num" style="color:${rateColor(rate)};font-weight:800">${rate}%</td>
      <td class="td-bar">
        <div class="bar-track">
          <div class="bar-fill" style="width:${rate}%;background:${rateColor(rate)}"></div>
        </div>
      </td>
    </tr>`).join('');

  const dailyRows = dailyData.slice().reverse().map(d => `
    <tr>
      <td class="td-date">${d.label}</td>
      <td class="td-num" style="color:${emerald}">${d.present}</td>
      <td class="td-num" style="color:${rose}">${d.absent}</td>
      <td class="td-num" style="color:${rateColor(d.rate)};font-weight:800">${d.rate}%</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Attendance Report — ${today}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    background: ${bg};
    color: ${text};
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    max-width: 760px;
    margin: 0 auto;
    padding: 40px 36px 56px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 2px solid ${accent};
    margin-bottom: 28px;
  }
  .header-left {}
  .org-name {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    color: ${text};
    letter-spacing: -0.3px;
    line-height: 1.1;
  }
  .report-title {
    font-size: 12px;
    font-weight: 700;
    color: ${accent};
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-top: 4px;
  }
  .header-right {
    text-align: right;
  }
  .header-meta {
    font-size: 10px;
    color: ${textMuted};
    line-height: 1.7;
    font-family: 'DM Mono', monospace;
  }
  .header-meta strong {
    color: ${text};
    font-weight: 600;
  }

  /* ── Section titles ── */
  .section-title {
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: ${textMuted};
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid ${border};
  }
  section { margin-bottom: 28px; }

  /* ── Stat cards ── */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 28px;
  }
  .stat-card {
    background: ${surface};
    border: 1px solid ${border};
    border-radius: 12px;
    padding: 14px 12px;
  }
  .stat-value {
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 4px;
    font-variant-numeric: tabular-nums;
  }
  .stat-label {
    font-size: 9.5px;
    font-weight: 700;
    color: ${text};
    line-height: 1.3;
  }
  .stat-sub {
    font-size: 9px;
    color: ${textMuted};
    margin-top: 2px;
  }

  /* ── Sparkline ── */
  .chart-wrap {
    background: ${surface};
    border: 1px solid ${border};
    border-radius: 12px;
    padding: 16px 20px 10px;
  }
  .chart-title {
    font-size: 10px;
    font-weight: 800;
    margin-bottom: 10px;
    color: ${text};
  }
  svg.spark { display: block; overflow: visible; }

  /* X-axis labels */
  .chart-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    padding: 0 2px;
  }
  .chart-labels span {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    color: ${textMuted};
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    background: ${surface};
    border: 1px solid ${border};
    border-radius: 12px;
    overflow: hidden;
  }
  thead tr {
    background: ${isDark ? 'rgba(14,165,233,0.12)' : '#f0f9ff'};
  }
  th {
    text-align: left;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: ${accent};
    padding: 9px 12px;
    border-bottom: 1px solid ${border};
  }
  th.right { text-align: right; }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid ${border};
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) { background: ${isDark ? 'rgba(255,255,255,0.015)' : '#fafafa'}; }

  .td-class { font-weight: 700; color: ${text}; font-size: 11px; }
  .td-date  { font-family: 'DM Mono', monospace; font-size: 10px; color: ${textMuted}; }
  .td-num   { text-align: right; font-variant-numeric: tabular-nums; font-size: 11px; }
  .td-bar   { width: 120px; padding-left: 8px; }

  .bar-track {
    height: 5px;
    border-radius: 99px;
    background: ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'};
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 99px;
  }

  /* ── Footer ── */
  .footer {
    margin-top: 36px;
    padding-top: 14px;
    border-top: 1px solid ${border};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-text {
    font-size: 9px;
    color: ${textMuted};
    font-family: 'DM Mono', monospace;
  }
  .confidential {
    font-size: 8.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'};
    border: 1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'};
    padding: 3px 8px;
    border-radius: 4px;
  }

  /* ── Print rules ── */
  @media print {
    html, body { background: ${bg} !important; }
    .no-print  { display: none !important; }
    .page      { padding: 20px 24px 40px; }
    section    { page-break-inside: avoid; }
    table      { page-break-inside: auto; }
    tr         { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="org-name">Attendance Report</div>
      <div class="report-title">Official Document · Last ${range} Days</div>
    </div>
    <div class="header-right">
      <div class="header-meta">
        <strong>Generated</strong><br/>${printDate}<br/>
        <strong>Report Period</strong><br/>Last ${range} days<br/>
        <strong>Total Classes</strong> ${classes.length} &nbsp;|&nbsp; <strong>Students</strong> ${students.length}
      </div>
    </div>
  </div>

  <!-- Stat cards -->
  <div class="stat-grid">${statCards}</div>

  <!-- Trend chart -->
  <section>
    <div class="section-title">Daily Attendance Trend</div>
    <div class="chart-wrap">
      <div class="chart-title">Students Present Per Day</div>
      <svg class="spark" width="100%" viewBox="0 0 ${sparkW} ${sparkH}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${accent}" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polygon points="${fillPts}" fill="url(#g)"/>
        <polyline points="${pts}" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${dailyData.map((d, i) => {
          const x = (i / Math.max(dailyData.length - 1, 1)) * sparkW;
          const y = sparkH - (d.present / maxPresent) * (sparkH - 8) - 4;
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${accent}"/>`;
        }).join('')}
      </svg>
      <div class="chart-labels">
        ${dailyData.filter((_, i) => i % Math.max(1, Math.floor(dailyData.length / 7)) === 0)
          .map(d => `<span>${d.label}</span>`).join('')}
      </div>
    </div>
  </section>

  <!-- Class breakdown -->
  <section>
    <div class="section-title">Class Breakdown — Today (${new Date(today + 'T00:00:00').toLocaleDateString('en-PH', { timeZone: PH_TZ, month: 'long', day: 'numeric', year: 'numeric' })})</div>
    <table>
      <thead>
        <tr>
          <th>Class</th>
          <th class="right">Present</th>
          <th class="right">Total</th>
          <th class="right">Rate</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${classRows}</tbody>
    </table>
  </section>

  <!-- Daily log -->
  <section>
    <div class="section-title">Daily Log (most recent first)</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th class="right">Present</th>
          <th class="right">Absent</th>
          <th class="right">Rate</th>
        </tr>
      </thead>
      <tbody>${dailyRows}</tbody>
    </table>
  </section>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-text">
      Generated by Attendance System &nbsp;·&nbsp; ${printDate}
    </div>
    <div class="confidential">Confidential</div>
  </div>

</div>

<script>
  // Auto-print then close when the print dialog is done/cancelled
  window.onload = () => {
    window.focus();
    window.print();
    window.onafterprint = () => window.close();
  };
<\/script>
</body>
</html>`;
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
      return d.toLocaleDateString('en-CA');
    });
  }, [rangeNum]);

  const dailyData = useMemo(() => dateRange.map(date => {
    const dayLogs = logs.filter(l => getPhLocalDate(l.timestamp) === date);
    const present = new Set(dayLogs.filter(l => l.status === 'IN').map(l => normalizeId(l.studentId))).size;
    const d = new Date(date + 'T00:00:00');
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    const activeDays = dailyData.filter(d => d.present > 0 || d.absent > 0);
    if (!activeDays.length) return 0;
    return Math.round(activeDays.reduce((s, d) => s + d.rate, 0) / activeDays.length);
  }, [dailyData]);

  const peakDay      = useMemo(() => dailyData.reduce((m, d) => d.present > (m?.present ?? -1) ? d : m, dailyData[0] || {}), [dailyData]);
  const totalPresences = useMemo(() => dailyData.reduce((s, d) => s + d.present, 0), [dailyData]);

  // ── Print: open a dedicated window with the themed report ──
  const handlePrint = useCallback(() => {
    const html = buildPrintHTML({
      darkMode, range: rangeNum, overallRate, totalPresences, peakDay,
      students, classes, dailyData, classData, today,
    });
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Please allow pop-ups to print the report.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }, [darkMode, rangeNum, overallRate, totalPresences, peakDay, students, classes, dailyData, classData, today]);

  // ── Excel export (unchanged) ──
  async function handleExport() {
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Attendance Report');
      ws.columns = [
        { header: 'Date',     key: 'date',    width: 15 },
        { header: 'Present',  key: 'present', width: 12 },
        { header: 'Absent',   key: 'absent',  width: 12 },
        { header: 'Rate (%)', key: 'rate',    width: 12 },
      ];
      const hRow = ws.getRow(1);
      hRow.eachCell(c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      });
      dailyData.forEach(d => ws.addRow(d));
      const buf = await wb.xlsx.writeBuffer();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      a.download = `report_${today}.xlsx`;
      a.click();
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
              <div className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold
                ${darkMode ? 'bg-white/[0.04] border-white/8 text-white' : 'bg-white border-gray-200 text-gray-700 shadow-sm'}`}>
                <Calendar size={14} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                <select value={range} onChange={e => setRange(e.target.value)} className="bg-transparent outline-none cursor-pointer">
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="60">Last 60 days</option>
                </select>
              </div>
              <button
                onClick={handlePrint}
                disabled={loading}
                title="Print / Save as PDF"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 border disabled:opacity-50
                  ${darkMode ? 'border-white/8 text-gray-300 hover:bg-white/[0.06]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <Printer size={14} />
                Print
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-sky-500/20"
                style={{ background: '#0ea5e9' }}
              >
                <Download size={14} />
                {exporting ? 'Exporting…' : 'Export'}
              </button>
            </div>
          </div>

          {/* Stat boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="Avg Attendance Rate" value={loading ? '—' : `${overallRate}%`} sub={`over ${range} days`} color="#0ea5e9" darkMode={darkMode} />
            <StatBox label="Total Presences"     value={loading ? '—' : totalPresences}    sub="check-ins recorded"  color="#10b981" darkMode={darkMode} />
            <StatBox label="Peak Day"            value={loading ? '—' : (peakDay?.label || '—')} sub={`${peakDay?.present || 0} present`} color="#f59e0b" darkMode={darkMode} />
            <StatBox label="Total Students"      value={loading ? '—' : students.length}   sub={`across ${classes.length} classes`} color="#7c3aed" darkMode={darkMode} />
          </div>

          {/* Daily trend chart */}
          <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            <p className={`text-sm font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily Attendance Trend</p>
            {loading
              ? <div className="h-52 flex items-end gap-1">
                  {Array.from({ length: rangeNum > 14 ? 20 : rangeNum }).map((_, i) => (
                    <Skeleton key={i} darkMode={darkMode} className="flex-1 rounded-t-lg" style={{ height: `${30 + Math.random() * 60}%` }} />
                  ))}
                </div>
              : <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}   />
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
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${rate}%`, background: rate >= 90 ? '#10b981' : rate >= 70 ? '#f59e0b' : '#f43f5e' }} />
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