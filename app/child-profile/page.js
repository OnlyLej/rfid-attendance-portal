'use client';
import { RouteGuard } from '../_lib/RouteGuard';
import { useApp } from '../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../_lib/usePageLayout';
import PageShell from '../_components/PageShell';
import { Skeleton } from '../_components/ui';
import { normalizeId, getPhTodayStr, getPhLocalDate, parsePhTimestamp } from '../_lib/data';
import { useMemo, useState } from 'react';
import ChildPicker from '../_components/ChildPicker';
import { useChildSelection } from '../_lib/useChildSelection';
import { User, GraduationCap, Hash, Calendar, TrendingUp, Clock, CheckCircle, XCircle, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const PH_TZ = 'Asia/Manila';

function StatPill({ label, value, icon: Icon, color, darkMode }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className={`text-xl font-black leading-tight`} style={{ color }}>{value}</p>
        <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      </div>
    </div>
  );
}

export default function ChildProfilePage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile  = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { logs, students, userInfo, loading, fetchData } = useApp();

  const { children: allChildren, selectedChildId, setSelectedChildId, selectedChild: childObj } = useChildSelection(userInfo, students);
  const childIds = useMemo(() => childObj ? [normalizeId(childObj.studentId)] : [], [childObj]);
  const child = useMemo(() => students.find(s => normalizeId(s.studentId) === (childIds[0] ?? '')), [students, childIds]);
  const childLogs = useMemo(() => logs.filter(l => childIds.includes(normalizeId(l.studentId))), [logs, childIds]);

  const today = getPhTodayStr();
  const isPresent = useMemo(() => childLogs.some(l => l.status === 'IN' && getPhLocalDate(l.timestamp) === today), [childLogs, today]);

  const lastSeen = useMemo(() => {
    const last = childLogs[0];
    if (!last) return null;
    return parsePhTimestamp(last.timestamp)?.toLocaleDateString('en-PH', { timeZone: PH_TZ, weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, [childLogs]);

  const totalDays = useMemo(() => new Set(childLogs.map(l => getPhLocalDate(l.timestamp))).size, [childLogs]);
  const absentDays = useMemo(() => {
    const schoolDays = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) return null;
      return d.toLocaleDateString('en-CA', { timeZone: PH_TZ });
    }).filter(Boolean);
    const presentSet = new Set(childLogs.filter(l => l.status === 'IN').map(l => getPhLocalDate(l.timestamp)));
    return schoolDays.filter(d => !presentSet.has(d)).length;
  }, [childLogs]);

  const rate30 = useMemo(() => {
    const school = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dow = d.getDay();
      return (dow !== 0 && dow !== 6) ? d.toLocaleDateString('en-CA', { timeZone: PH_TZ }) : null;
    }).filter(Boolean);
    const presentSet = new Set(childLogs.filter(l => l.status === 'IN').map(l => getPhLocalDate(l.timestamp)));
    const present = school.filter(d => presentSet.has(d)).length;
    return school.length > 0 ? Math.round((present / school.length) * 100) : 0;
  }, [childLogs]);

  const sparkData = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return null;
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: PH_TZ });
    const label = d.toLocaleDateString('en-PH', { timeZone: PH_TZ, month: 'short', day: 'numeric' });
    const present = childLogs.some(l => l.status === 'IN' && getPhLocalDate(l.timestamp) === dateStr);
    return { label, value: present ? 1 : 0 };
  }).filter(Boolean), [childLogs]);

  const initial = (child?.name || '?').charAt(0).toUpperCase();
  const rateColor = rate30 >= 90 ? '#10b981' : rate30 >= 70 ? '#f59e0b' : '#f43f5e';

  return (
    <RouteGuard allowedRoles={['parent']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>
        <div className="fade-in-up max-w-2xl mx-auto space-y-5">
          <ChildPicker children={allChildren} selectedChildId={selectedChildId} onSelect={setSelectedChildId} darkMode={darkMode} />

          {/* Profile card */}
          <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            {/* Hero bar */}
            <div className="h-24 relative" style={{ background: '#0ea5e9' }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,rgba(255,255,255,0.3) 0%,transparent 50%)' }} />
            </div>

            {/* Avatar + info */}
            <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-white text-3xl font-black shadow-xl"
                  style={{ background: '#7c3aed', borderColor: darkMode ? '#0a0e1c' : '#fff' }}>
                  {loading ? '?' : initial}
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-black border flex items-center gap-1.5
                  ${isPresent
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/15'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {isPresent ? 'Present Today' : 'Not Yet In'}
                </span>
              </div>

              {loading
                ? <div className="space-y-2"><Skeleton darkMode={darkMode} className="h-6 w-48 rounded-lg" /><Skeleton darkMode={darkMode} className="h-4 w-32 rounded" /></div>
                : <>
                    <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{child?.name ?? 'Unknown Student'}</h2>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{child?.class ?? '—'}</p>
                  </>
              }

              {/* Detail rows */}
              <div className={`mt-5 space-y-3 pt-5 border-t ${darkMode ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                {[
                  { icon: Hash,          label: 'Student ID',    value: child?.studentId ?? '—'  },
                  { icon: GraduationCap, label: 'Class',         value: child?.class ?? '—'      },
                  { icon: Clock,         label: 'Last Check-in', value: lastSeen ?? 'No records' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-white/[0.05]' : 'bg-gray-50'}`}>
                      <Icon size={14} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className={`text-[11px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{label}</p>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loading ? '—' : value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatPill label="30-day Rate"   value={loading ? '—' : `${rate30}%`} icon={TrendingUp}   color={rateColor} darkMode={darkMode} />
            <StatPill label="Days Present"  value={loading ? '—' : totalDays}    icon={CheckCircle}  color="#10b981"  darkMode={darkMode} />
            <StatPill label="Absent (30d)"  value={loading ? '—' : absentDays}   icon={XCircle}      color="#f43f5e"  darkMode={darkMode} />
            <StatPill label="Rate Badge"    value={loading ? '—' : rate30 >= 95 ? '🏆 Excellent' : rate30 >= 85 ? '⭐ Good' : '📈 Needs improvement'} icon={Award} color="#f59e0b" darkMode={darkMode} />
          </div>

          {/* 14-day spark chart */}
          <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            <p className={`text-sm font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Last 14 School Days</p>
            {loading
              ? <div className="h-24 flex items-end gap-1">{Array.from({length:10}).map((_,i) => <Skeleton key={i} darkMode={darkMode} className="flex-1 rounded-t" style={{height:`${20+Math.random()*70}%`}} />)}</div>
              : <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={sparkData} margin={{ top: 4, right: 0, left: -40, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fill: darkMode ? '#475569' : '#94a3b8', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0,1]} hide />
                    <Tooltip
                      formatter={(v) => [v === 1 ? 'Present ✓' : 'Absent ✗', '']}
                      contentStyle={{ background: darkMode ? '#0d1220' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`, borderRadius: 10, fontSize: 11 }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="url(#cpGrad)" strokeWidth={2} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
            }
          </div>
        </div>
      </PageShell>
    </RouteGuard>
  );
}