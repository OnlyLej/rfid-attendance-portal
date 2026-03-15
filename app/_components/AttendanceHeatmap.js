'use client';

import { useMemo } from 'react';
import { normalizeId, getPhTodayStr, getPhLocalDate } from '../_lib/data';

const PH_TZ = 'Asia/Manila';
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS   = ['','Mon','','Wed','','Fri',''];

function getColor(count, darkMode) {
  if (count === 0) return darkMode ? '#1e2333' : '#f1f5f9';
  if (count === 1) return '#bbf7d0';
  if (count === 2) return '#4ade80';
  if (count <= 4)  return '#16a34a';
  return '#14532d';
}

export default function AttendanceHeatmap({ logs, studentId, darkMode, title = 'Attendance This Year' }) {
  const today = new Date();
  const todayStr = getPhTodayStr();

  // Build 52 weeks × 7 days grid (364 days back from today)
  const weeks = useMemo(() => {
    const nid = studentId ? normalizeId(studentId) : null;
    const filteredLogs = nid
      ? logs.filter(l => l.studentId && normalizeId(l.studentId) === nid)
      : logs;

    // Count unique students per day (for teacher view) or scans per day (for student view)
    const dayCount = {};
    filteredLogs.forEach(l => {
      const d = getPhLocalDate(l.timestamp);
      if (!d) return;
      if (nid) {
        dayCount[d] = (dayCount[d] || 0) + 1;
      } else {
        // Count distinct students present
        if (!dayCount[d]) dayCount[d] = new Set();
        if (l.status === 'IN') dayCount[d].add(normalizeId(l.studentId));
      }
    });

    // Normalize to numbers
    const counts = {};
    Object.entries(dayCount).forEach(([d, v]) => {
      counts[d] = v instanceof Set ? v.size : v;
    });

    // Build 52 weeks
    const result = [];
    // Find the Sunday at or before (today - 363 days)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // back to Sunday

    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        const dateStr = date.toLocaleDateString('en-CA', { timeZone: PH_TZ });
        const isFuture = dateStr > todayStr;
        week.push({
          date: dateStr,
          count: isFuture ? -1 : (counts[dateStr] || 0),
          isFuture,
          isToday: dateStr === todayStr,
          month: date.getMonth(),
          day: date.getDay(),
          label: date.toLocaleDateString('en-PH', { timeZone: PH_TZ, weekday: 'short', month: 'short', day: 'numeric' }),
        });
      }
      result.push(week);
    }
    return result;
  }, [logs, studentId, todayStr]);

  // Month label positions
  const monthPositions = useMemo(() => {
    const seen = new Set();
    const positions = [];
    weeks.forEach((week, wi) => {
      const firstDay = week.find(d => !d.isFuture);
      if (firstDay && !seen.has(firstDay.month)) {
        seen.add(firstDay.month);
        positions.push({ wi, label: MONTH_LABELS[firstDay.month] });
      }
    });
    return positions;
  }, [weeks]);

  // Total present days this year
  const totalPresent = useMemo(() => {
    const yearStart = `${today.getFullYear()}-01-01`;
    return weeks.flat().filter(c => c.date >= yearStart && c.count > 0 && !c.isFuture).length;
  }, [weeks]);

  const cellSize = 11;
  const gap = 2;
  const step = cellSize + gap;

  return (
    <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
        <p className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <span className="font-black" style={{ color: '#16a34a' }}>{totalPresent}</span> days this year
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: weeks.length * step + 24 }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: 24 }}>
            {weeks.map((_, wi) => {
              const pos = monthPositions.find(p => p.wi === wi);
              return (
                <div key={wi} style={{ width: step, flexShrink: 0 }}>
                  {pos && <span className={`text-[9px] font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{pos.label}</span>}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col mr-1" style={{ gap }}>
              {DAY_LABELS.map((l, i) => (
                <div key={i} style={{ height: cellSize, width: 18, flexShrink: 0 }}
                  className={`text-[9px] font-bold flex items-center justify-end pr-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  {l}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap, marginRight: gap }}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={cell.isFuture ? '' : `${cell.label}: ${cell.count} scan${cell.count !== 1 ? 's' : ''}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 2,
                      flexShrink: 0,
                      background: cell.isFuture ? 'transparent' : getColor(cell.count, darkMode),
                      outline: cell.isToday ? '2px solid #0ea5e9' : 'none',
                      outlineOffset: 1,
                      opacity: cell.isFuture ? 0 : 1,
                      cursor: cell.count > 0 ? 'default' : 'default',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className={`flex items-center gap-2 mt-3 text-[9px] font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            <span>Less</span>
            {[0, 1, 2, 3, 5].map(c => (
              <div key={c} style={{ width: cellSize, height: cellSize, borderRadius: 2, background: getColor(c, darkMode), flexShrink: 0 }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}