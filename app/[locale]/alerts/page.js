'use client';
import { RouteGuard } from '../../_lib/RouteGuard';
import { useApp } from '../../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../../_lib/usePageLayout';
import PageShell from '../../_components/PageShell';
import { Skeleton, EmptyState } from '../../_components/ui';
import { normalizeId, getPhTodayStr, getPhLocalDate, parsePhTimestamp, LATE_HOUR } from '../../_lib/data';
import { useMemo } from 'react';
import { AlertTriangle, UserX, Clock, Flame, CheckCircle, TrendingDown, Info } from 'lucide-react';

const PH_TZ = 'Asia/Manila';

function severity(streak) {
  if (streak >= 5) return { label: 'Critical', color: '#f43f5e', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  if (streak >= 3) return { label: 'Warning',  color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  return { label: 'Notice', color: '#0ea5e9', bg: 'bg-sky-500/10', border: 'border-sky-500/20' };
}

function AlertCard({ icon: Icon, title, count, color, bg, children, darkMode }) {
  return (
    <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${darkMode ? 'border-white/[0.05]' : 'border-gray-100'}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}><Icon size={16} style={{ color }} /></div>
        <p className={`text-sm font-black flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
        <span className="text-[11px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: color }}>{count}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function AlertsPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { students, logs, loading, fetchData } = useApp();

  const today = getPhTodayStr();

  // Absent today
  const absentToday = useMemo(() => {
    const todayPresent = new Set(logs.filter(l => l.status === 'IN' && getPhLocalDate(l.timestamp) === today).map(l => normalizeId(l.studentId)));
    return students.filter(s => !todayPresent.has(normalizeId(s.studentId)));
  }, [students, logs, today]);

  // Absence streaks (consecutive absent days)
  const streaks = useMemo(() => {
    return students.map(s => {
      const sid = normalizeId(s.studentId);
      let streak = 0;
      const d = new Date();
      while (streak < 14) {
        const dateStr = d.toLocaleDateString('en-CA', { timeZone: PH_TZ });
        const dayLogs = logs.filter(l => normalizeId(l.studentId) === sid && getPhLocalDate(l.timestamp) === dateStr);
        if (dayLogs.some(l => l.status === 'IN')) break;
        streak++;
        d.setDate(d.getDate() - 1);
      }
      return { ...s, streak };
    }).filter(s => s.streak >= 2).sort((a, b) => b.streak - a.streak);
  }, [students, logs]);

  // Late arrivals today (checked in after 8am PH)
  const lateArrivals = useMemo(() => {
    const todayLogs = logs.filter(l => l.status === 'IN' && getPhLocalDate(l.timestamp) === today);
    const firstInByStudent = new Map();
    for (const l of todayLogs) {
     const sid = normalizeId(l.studentId);
     const existing = firstInByStudent.get(sid);
     const t = parsePhTimestamp(l.timestamp)?.getTime() ?? Infinity;
     if (!existing || t < (parsePhTimestamp(existing.timestamp)?.getTime() ?? Infinity)) {
      firstInByStudent.set(sid, l);
     }
    }
    return Array.from(firstInByStudent.values()).filter(l => {
    const d = parsePhTimestamp(l.timestamp);
    if (!d) return false;
    const h = parseInt(d.toLocaleString('en-PH', { hour: 'numeric', hour12: false, timeZone: PH_TZ }));
    return h >= LATE_HOUR;
  }).sort((a, b) => (parsePhTimestamp(a.timestamp)?.getTime() ?? 0) - (parsePhTimestamp(b.timestamp)?.getTime() ?? 0));
 }, [logs, today]);

  // Perfect attendance this week
  const perfect = useMemo(() => {
    const days = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-CA', { timeZone: PH_TZ });
    });
    return students.filter(s => {
      const sid = normalizeId(s.studentId);
      return days.every(date => logs.some(l => normalizeId(l.studentId) === sid && l.status === 'IN' && getPhLocalDate(l.timestamp) === date));
    });
  }, [students, logs]);

  const rowClass = `flex items-center gap-3 px-5 py-3.5 border-b last:border-0 transition-colors`;
  const rowBorder = darkMode ? 'border-white/[0.04] hover:bg-white/[0.03]' : 'border-gray-50 hover:bg-slate-50/60';

  return (
    <RouteGuard allowedRoles={['teacher']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>
        <div className="fade-in-up space-y-5">

          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Absent Today',    value: absentToday.length,  color: '#f43f5e', Icon: UserX       },
              { label: 'Absence Streaks', value: streaks.length,       color: '#f59e0b', Icon: TrendingDown },
              { label: 'Late Today',       value: lateArrivals.length,  color: '#0ea5e9', Icon: Clock       },
              { label: 'Perfect Week',     value: perfect.length,       color: '#10b981', Icon: CheckCircle  },
            ].map(({ label, value, color, Icon }) => (
              <div key={label} className={`border rounded-2xl p-4 flex items-center gap-3 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <div>
                  <p className={`text-2xl font-black leading-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loading ? '—' : value}</p>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Absence streaks */}
            <AlertCard icon={Flame} title="Absence Streaks" count={streaks.length} color="#f59e0b" bg="bg-amber-500/10" darkMode={darkMode}>
              {loading
                ? Array.from({length:3}).map((_,i) => <div key={i} className={`${rowClass} ${rowBorder}`}><Skeleton darkMode={darkMode} className="w-8 h-8 rounded-xl" /><div className="flex-1 space-y-1"><Skeleton darkMode={darkMode} className="h-3 w-32 rounded" /><Skeleton darkMode={darkMode} className="h-2.5 w-20 rounded" /></div></div>)
                : streaks.length === 0
                  ? <div className="py-10"><EmptyState icon={CheckCircle} title="No streaks" body="All students attended recently." darkMode={darkMode} /></div>
                  : streaks.slice(0, 8).map(s => {
                      const sev = severity(s.streak);
                      return (
                        <div key={s.studentId} className={`${rowClass} ${rowBorder}`}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-black flex-shrink-0" style={{ background: sev.color }}>
                            {s.streak}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                            <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.class} · {s.streak} days absent</p>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sev.bg} ${sev.border}`} style={{ color: sev.color }}>{sev.label}</span>
                        </div>
                      );
                    })
              }
            </AlertCard>

            {/* Absent today */}
            <AlertCard icon={UserX} title="Absent Today" count={absentToday.length} color="#f43f5e" bg="bg-rose-500/10" darkMode={darkMode}>
              {loading
                ? Array.from({length:3}).map((_,i) => <div key={i} className={`${rowClass} ${rowBorder}`}><Skeleton darkMode={darkMode} className="w-8 h-8 rounded-xl" /><div className="flex-1 space-y-1"><Skeleton darkMode={darkMode} className="h-3 w-32 rounded" /><Skeleton darkMode={darkMode} className="h-2.5 w-20 rounded" /></div></div>)
                : absentToday.length === 0
                  ? <div className="py-10"><EmptyState icon={CheckCircle} title="Full attendance!" body="Everyone is present today." darkMode={darkMode} /></div>
                  : absentToday.slice(0, 8).map(s => (
                      <div key={s.studentId} className={`${rowClass} ${rowBorder}`}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
                          {(s.name || '?').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                          <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.class}</p>
                        </div>
                      </div>
                    ))
              }
            </AlertCard>

            {/* Late arrivals */}
            <AlertCard icon={Clock} title="Late Arrivals Today" count={lateArrivals.length} color="#0ea5e9" bg="bg-sky-500/10" darkMode={darkMode}>
              {loading
                ? Array.from({length:3}).map((_,i) => <div key={i} className={`${rowClass} ${rowBorder}`}><Skeleton darkMode={darkMode} className="w-8 h-8 rounded-xl" /><div className="flex-1 space-y-1"><Skeleton darkMode={darkMode} className="h-3 w-32 rounded" /><Skeleton darkMode={darkMode} className="h-2.5 w-20 rounded" /></div></div>)
                : lateArrivals.length === 0
                  ? <div className="py-10"><EmptyState icon={CheckCircle} title="No late arrivals" body="Everyone checked in on time." darkMode={darkMode} /></div>
                  : lateArrivals.slice(0, 8).map((l, i) => {
                      const d = parsePhTimestamp(l.timestamp);
                      const time = d?.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit' }) ?? '';
                      return (
                        <div key={i} className={`${rowClass} ${rowBorder}`}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
                            {(l.name || '?').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{l.name}</p>
                            <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{l.class}</p>
                          </div>
                          <span className={`text-xs font-bold flex-shrink-0 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>{time}</span>
                        </div>
                      );
                    })
              }
            </AlertCard>

            {/* Perfect week */}
            <AlertCard icon={CheckCircle} title="Perfect This Week" count={perfect.length} color="#10b981" bg="bg-emerald-500/10" darkMode={darkMode}>
              {loading
                ? Array.from({length:3}).map((_,i) => <div key={i} className={`${rowClass} ${rowBorder}`}><Skeleton darkMode={darkMode} className="w-8 h-8 rounded-xl" /><div className="flex-1 space-y-1"><Skeleton darkMode={darkMode} className="h-3 w-32 rounded" /><Skeleton darkMode={darkMode} className="h-2.5 w-20 rounded" /></div></div>)
                : perfect.length === 0
                  ? <div className="py-10"><EmptyState icon={Info} title="No perfect records yet" body="Check back after a full week." darkMode={darkMode} /></div>
                  : perfect.slice(0, 8).map(s => (
                      <div key={s.studentId} className={`${rowClass} ${rowBorder}`}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-black flex-shrink-0" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                          {(s.name || '?').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                          <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.class}</p>
                        </div>
                        <span className="text-emerald-500 text-lg">★</span>
                      </div>
                    ))
              }
            </AlertCard>
          </div>
        </div>
      </PageShell>
    </RouteGuard>
  );
}
