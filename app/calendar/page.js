'use client';
import { RouteGuard } from '../_lib/RouteGuard';
import { useApp } from '../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../_lib/usePageLayout';
import PageShell from '../_components/PageShell';
import { normalizeId, getPhTodayStr, getPhLocalDate, parsePhTimestamp } from '../_lib/data';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, UserCheck, UserX, Minus } from 'lucide-react';

const PH_TZ = 'Asia/Manila';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { logs, students, userInfo, loading, fetchData } = useApp();

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Resolve child IDs
  const childIds = useMemo(() => {
    let raw = userInfo?.studentIds;
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = raw ? [raw] : []; } }
    let ids = Array.isArray(raw) ? raw.map(String) : [];
    if (!ids.length && userInfo?.studentId) ids = [String(userInfo.studentId)];
    if (!ids.length) ids = students.map(s => String(s.studentId));
    return ids.map(normalizeId);
  }, [userInfo, students]);

  const child = useMemo(() => students.find(s => childIds.includes(normalizeId(s.studentId))), [students, childIds]);

  // Build attendance map: date → 'present' | 'absent' | 'weekend' | 'future'
  const attendanceMap = useMemo(() => {
    const map = {};
    const todayStr = getPhTodayStr();
    const childLogs = logs.filter(l => childIds.includes(normalizeId(l.studentId)));

    // Get all dates in the viewed month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const dow = date.getDay();
      if (dateStr > todayStr) { map[dateStr] = 'future'; continue; }
      if (dow === 0 || dow === 6) { map[dateStr] = 'weekend'; continue; }
      const dayLogs = childLogs.filter(l => getPhLocalDate(l.timestamp) === dateStr);
      map[dateStr] = dayLogs.some(l => l.status === 'IN') ? 'present' : 'absent';
    }
    return map;
  }, [logs, childIds, viewYear, viewMonth]);

  const stats = useMemo(() => {
    const vals = Object.values(attendanceMap);
    return { present: vals.filter(v => v === 'present').length, absent: vals.filter(v => v === 'absent').length };
  }, [attendanceMap]);

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0);  setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }

  // Calendar grid
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const cellStatus = (day) => {
    if (!day) return null;
    const dateStr = new Date(viewYear, viewMonth, day).toLocaleDateString('en-CA', { timeZone: PH_TZ });
    return attendanceMap[dateStr] ?? null;
  };

  const todayStr = today.toLocaleDateString('en-CA', { timeZone: PH_TZ });
  const isToday = (day) => day && new Date(viewYear, viewMonth, day).toLocaleDateString('en-CA', { timeZone: PH_TZ }) === todayStr;

  return (
    <RouteGuard allowedRoles={['parent']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>
        <div className="fade-in-up max-w-xl mx-auto space-y-5">

          {/* Child info */}
          {child && (
            <div className={`border rounded-2xl p-4 flex items-center gap-4 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md" style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)' }}>
                {(child.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`font-black text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{child.name}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{child.class} · ID: {child.studentId}</p>
              </div>
              <div className="ml-auto flex gap-4">
                <div className="text-center">
                  <p className="text-lg font-black text-emerald-500">{stats.present}</p>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Present</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-rose-500">{stats.absent}</p>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Absent</p>
                </div>
              </div>
            </div>
          )}

          {/* Calendar card */}
          <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            {/* Month nav */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-white/[0.05]' : 'border-gray-100'}`}>
              <button onClick={prevMonth} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft size={16} /></button>
              <p className={`text-base font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{MONTHS[viewMonth]} {viewYear}</p>
              <button onClick={nextMonth} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronRight size={16} /></button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-3 pt-3">
              {DAYS.map(d => (
                <div key={d} className={`text-center text-[10px] font-black uppercase tracking-wider pb-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1 px-3 pb-4">
              {cells.map((day, i) => {
                const status = cellStatus(day);
                const today_ = isToday(day);
                return (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    {day ? (
                      <div
                        className={[
                          'w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all relative',
                          today_ ? 'ring-2 ring-offset-1 ring-sky-500' : '',
                          status === 'present' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : '',
                          status === 'absent'  ? 'bg-rose-500/15 text-rose-500' : '',
                          status === 'weekend' ? (darkMode ? 'text-gray-700' : 'text-gray-300') : '',
                          status === 'future'  ? (darkMode ? 'text-gray-700' : 'text-gray-300') : '',
                          !status             ? (darkMode ? 'text-gray-400' : 'text-gray-600') : '',
                        ].join(' ')}
                        style={today_ ? { boxShadow: '0 0 0 2px #0ea5e9' } : undefined}
                      >
                        {day}
                        {status === 'present' && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2" style={{ borderColor: darkMode ? '#0a0e1c' : '#fff' }} />}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className={`flex items-center justify-center gap-5 px-5 py-3 border-t text-[11px] font-semibold ${darkMode ? 'border-white/[0.05] text-gray-500' : 'border-gray-100 text-gray-400'}`}>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />Present</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-rose-500/20 inline-block" />Absent</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md ring-2 ring-sky-500 inline-block" />Today</span>
            </div>
          </div>
        </div>
      </PageShell>
    </RouteGuard>
  );
}