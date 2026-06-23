'use client';
import { RouteGuard } from '../../_lib/RouteGuard';
import { useApp } from '../../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../../_lib/usePageLayout';
import PageShell from '../../_components/PageShell';
import { normalizeId, getPhTodayStr, getPhLocalDate } from '../../_lib/data';
import { useMemo, useState, useEffect } from 'react';
import ChildPicker from '../../_components/ChildPicker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PH_TZ = 'Asia/Manila';
const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { logs, students, userInfo, loading, fetchData } = useApp();

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // ── Resolve all children ──────────────────────────────────────────────
  const allChildren = useMemo(() => {
    if (!userInfo || !students.length) return [];
    let rawIds = userInfo.studentIds;
    if (typeof rawIds === 'string') { try { rawIds = JSON.parse(rawIds); } catch { rawIds = rawIds ? [rawIds] : []; } }
    let linkedIds = Array.isArray(rawIds) ? rawIds.map(id => id.toString().trim()).filter(Boolean) : [];
    if (!linkedIds.length && userInfo.studentId) linkedIds = [userInfo.studentId.toString().trim()];
    if (!linkedIds.length) linkedIds = students.map(s => s.studentId.toString().trim());
    return linkedIds
      .map(id => {
        const nid = normalizeId(id);
        const match = students.find(s => normalizeId(s.studentId) === nid);
        return match ? { studentId: match.studentId, name: match.name, class: match.class } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [userInfo, students]);

  const [selectedChildId, setSelectedChildId] = useState(null);
  const activeChild = useMemo(() => {
    if (!allChildren.length) return null;
    if (selectedChildId) {
      const found = allChildren.find(c => c.studentId === selectedChildId);
      if (found) return found;
    }
    return allChildren[0];
  }, [allChildren, selectedChildId]);

  // ── Debug: log raw data to console so we can see exactly what's coming in ──
  useEffect(() => {
    if (!activeChild || !logs.length) return;
    const childNid = normalizeId(activeChild.studentId);
    const childLogs = logs.filter(l => l.studentId && normalizeId(l.studentId) === childNid);
    console.group('[Calendar Debug]');
    console.log('activeChild:', activeChild);
    console.log('childNid:', childNid);
    console.log('total logs:', logs.length);
    console.log('child logs:', childLogs.length);
    if (childLogs.length > 0) {
      console.log('sample log[0]:', JSON.stringify(childLogs[0]));
      console.log('sample log[0].timestamp raw:', childLogs[0].timestamp);
      console.log('getPhLocalDate(log[0].timestamp):', getPhLocalDate(childLogs[0].timestamp));
    }
    // Show all log dates for march
    const marchLogs = childLogs.filter(l => {
      const d = getPhLocalDate(l.timestamp);
      return d.startsWith('2026-03');
    });
    console.log('march 2026 logs:', marchLogs.length, marchLogs.map(l => ({ ts: l.timestamp, date: getPhLocalDate(l.timestamp), status: l.status })));
    console.groupEnd();
  }, [activeChild, logs]);

  // ── Attendance map ─────────────────────────────────────────────────────
  const attendanceMap = useMemo(() => {
    const map = {};
    const todayStr = getPhTodayStr();
    if (!activeChild) return map;

    const childNid  = normalizeId(activeChild.studentId);
    const childLogs = logs.filter(l => l.studentId && normalizeId(l.studentId) === childNid);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date    = new Date(viewYear, viewMonth, d);
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const dow     = date.getDay();

      if (dateStr > todayStr)    { map[dateStr] = 'future';  continue; }
      if (dow === 0 || dow === 6) { map[dateStr] = 'weekend'; continue; }

      const dayLogs = childLogs.filter(l => getPhLocalDate(l.timestamp) === dateStr);
      map[dateStr] = dayLogs.length > 0 ? 'present' : 'absent';
    }
    return map;
  }, [logs, activeChild, viewYear, viewMonth]);

  const stats = useMemo(() => {
    const vals = Object.values(attendanceMap);
    return { present: vals.filter(v => v === 'present').length, absent: vals.filter(v => v === 'absent').length };
  }, [attendanceMap]);

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0);  setViewYear(y => y+1); } else setViewMonth(m => m+1); }

  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells       = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i+1)];
  const todayStr    = today.toLocaleDateString('en-CA', { timeZone: PH_TZ });

  const cellStatus = (day) => {
    if (!day) return null;
    const dateStr = new Date(viewYear, viewMonth, day).toLocaleDateString('en-CA', { timeZone: PH_TZ });
    return attendanceMap[dateStr] ?? null;
  };
  const isToday = (day) =>
    day && new Date(viewYear, viewMonth, day).toLocaleDateString('en-CA', { timeZone: PH_TZ }) === todayStr;

  return (
    <RouteGuard allowedRoles={['parent']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>
        <div className="fade-in-up max-w-xl mx-auto space-y-5">

          <ChildPicker children={allChildren} selectedChildId={activeChild?.studentId ?? null} onSelect={setSelectedChildId} darkMode={darkMode} />

          {activeChild && (
            <div className={`border rounded-2xl p-4 flex items-center gap-4 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md"
                style={{ background: '#7c3aed' }}>
                {(activeChild.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-black text-base truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeChild.name}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{activeChild.class} · ID: {activeChild.studentId}</p>
              </div>
              <div className="ml-auto flex gap-4 flex-shrink-0">
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

          <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-white/[0.05]' : 'border-gray-100'}`}>
              <button onClick={prevMonth} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft size={16} /></button>
              <p className={`text-base font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{MONTHS[viewMonth]} {viewYear}</p>
              <button onClick={nextMonth} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${darkMode ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronRight size={16} /></button>
            </div>

            <div className="grid grid-cols-7 px-3 pt-3">
              {DAYS.map(d => (
                <div key={d} className={`text-center text-[10px] font-black uppercase tracking-wider pb-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 px-3 pb-4">
              {cells.map((day, i) => {
                const status = cellStatus(day);
                const today_ = isToday(day);
                return (
                  <div key={i} className="aspect-square flex items-center justify-center">
                    {day ? (
                      <div className={[
                        'w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all relative',
                        today_               ? 'ring-2 ring-sky-500'                                       : '',
                        status === 'present' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : '',
                        status === 'absent'  ? 'bg-rose-500/15 text-rose-500'                              : '',
                        status === 'weekend' ? (darkMode ? 'text-gray-700' : 'text-gray-300')              : '',
                        status === 'future'  ? (darkMode ? 'text-gray-700' : 'text-gray-300')              : '',
                        !status              ? (darkMode ? 'text-gray-400' : 'text-gray-600')              : '',
                      ].join(' ')}>
                        {day}
                        {status === 'present' && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2"
                            style={{ borderColor: darkMode ? '#0a0e1c' : '#fff' }} />
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

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