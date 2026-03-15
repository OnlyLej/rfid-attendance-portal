'use client';
import { RouteGuard } from '../_lib/RouteGuard';
import { useApp } from '../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../_lib/usePageLayout';
import PageShell from '../_components/PageShell';
import { Skeleton } from '../_components/ui';
import { normalizeId, getPhTodayStr, getPhLocalDate } from '../_lib/data';
import { useMemo, useState } from 'react';
import ChildPicker from '../_components/ChildPicker';
import { useChildSelection } from '../_lib/useChildSelection';
import { TrendingUp, TrendingDown, Minus, Award, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const PH_TZ = 'Asia/Manila';

export default function ProgressPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { logs, students, userInfo, loading, fetchData } = useApp();
  const [range, setRange] = useState('30');
  const rangeNum = parseInt(range);

  const { children: allChildren, selectedChildId, setSelectedChildId, selectedChild: childObj } = useChildSelection(userInfo, students);
  const childIds = useMemo(() => childObj ? [normalizeId(childObj.studentId)] : [], [childObj]);
  const child = useMemo(() => students.find(s => normalizeId(s.studentId) === (childIds[0] ?? '')), [students, childIds]);
  const childLogs = useMemo(() => logs.filter(l => childIds.includes(normalizeId(l.studentId))), [logs, childIds]);

  const dailyData = useMemo(() => {
    return Array.from({ length: rangeNum }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (rangeNum - 1 - i));
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const label = d.toLocaleDateString('en-PH', { timeZone: PH_TZ, month: 'short', day: 'numeric' });
      const dow = d.getDay();
      if (dow === 0 || dow === 6) return { date: dateStr, label, status: 'weekend', present: null };
      const present = childLogs.some(l => l.status === 'IN' && getPhLocalDate(l.timestamp) === dateStr);
      return { date: dateStr, label, status: present ? 'present' : 'absent', present: present ? 1 : 0 };
    }).filter(d => d.status !== 'weekend');
  }, [childLogs, rangeNum]);

  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < rangeNum; i += 7) {
      const week = dailyData.slice(i, i + 7);
      if (!week.length) break;
      const present = week.filter(d => d.status === 'present').length;
      const total = week.filter(d => d.status !== 'weekend').length;
      const label = week[0]?.label ?? '';
      weeks.push({ label, present, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
    }
    return weeks;
  }, [dailyData, rangeNum]);

  const totalPresent = dailyData.filter(d => d.status === 'present').length;
  const totalSchool  = dailyData.filter(d => d.status !== 'weekend').length;
  const rate = totalSchool > 0 ? Math.round((totalPresent / totalSchool) * 100) : 0;
  const streak = useMemo(() => {
    let s = 0;
    for (let i = dailyData.length - 1; i >= 0; i--) {
      if (dailyData[i].status === 'present') s++;
      else break;
    }
    return s;
  }, [dailyData]);

  const trend = weeklyData.length >= 2
    ? weeklyData[weeklyData.length - 1].rate - weeklyData[weeklyData.length - 2].rate
    : 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? '#10b981' : trend < 0 ? '#f43f5e' : '#94a3b8';

  const gridColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tickColor = darkMode ? '#475569' : '#94a3b8';

  return (
    <RouteGuard allowedRoles={['parent']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>

        <div className="fade-in-up space-y-5">
          <ChildPicker children={allChildren} selectedChildId={selectedChildId} onSelect={setSelectedChildId} darkMode={darkMode} />

          {/* Child + range selector */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              {child && <p className={`text-base font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{child.name}</p>}
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{child?.class}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${darkMode ? 'bg-white/[0.04] border-white/8 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-700'}`}>
              <Calendar size={13} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
              <select value={range} onChange={e => setRange(e.target.value)} className="bg-transparent outline-none cursor-pointer">
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Attendance Rate',  value: loading ? '—' : `${rate}%`,         color: rate >= 90 ? '#10b981' : rate >= 70 ? '#f59e0b' : '#f43f5e' },
              { label: 'Days Present',     value: loading ? '—' : totalPresent,        color: '#10b981' },
              { label: 'Days Absent',      value: loading ? '—' : totalSchool - totalPresent, color: '#f43f5e' },
              { label: 'Current Streak',   value: loading ? '—' : `${streak}d`,        color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`border rounded-2xl p-4 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
                <p className="text-2xl font-black leading-none mb-1" style={{ color }}>{value}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Attendance Over Time</p>
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: trendColor }}>
                <TrendIcon size={13} />
                {trend !== 0 ? `${Math.abs(trend)}% vs prev week` : 'Stable'}
              </div>
            </div>
            {loading
              ? <div className="h-44 flex items-end gap-1">{Array.from({length:20}).map((_,i) => <Skeleton key={i} darkMode={darkMode} className="flex-1 rounded-t-lg" style={{height:`${20+Math.random()*70}%`}} />)}</div>
              : <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.floor(rangeNum / 8)} />
                    <YAxis domain={[0, 1]} hide />
                    <Tooltip
                      formatter={(v, n, p) => [p.payload.status === 'present' ? 'Present ✓' : 'Absent ✗', '']}
                      contentStyle={{ background: darkMode ? '#0d1220' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`, borderRadius: 12, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="present" stroke="#0ea5e9" fill="url(#progGrad)" strokeWidth={2} dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Weekly breakdown */}
          <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            <p className={`text-sm font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weekly Breakdown</p>
            {loading
              ? <div className="h-36 flex items-end gap-2">{Array.from({length:6}).map((_,i) => <Skeleton key={i} darkMode={darkMode} className="flex-1 rounded-t-xl" style={{height:`${30+Math.random()*60}%`}} />)}</div>
              : <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: tickColor, fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => [`${v}%`, 'Rate']} contentStyle={{ background: darkMode ? '#0d1220' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`, borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="rate" fill="#7c3aed" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        </div>
      </PageShell>
    </RouteGuard>
  );
}