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
  const todayStr = getPhTodayStr();
  const currentYear = new Date().getFullYear();

  // Build a full Jan 1 → Dec 31 grid for the current year,
  // padded with empty cells so the first column starts on Sunday.
  const weeks = useMemo(() => {
    const nid = studentId ? normalizeId(studentId) : null;
    const filteredLogs = nid
      ? logs.filter(l => l.studentId && normalizeId(l.studentId) === nid)
      : logs;

    // Count unique students per day (teacher view) or scans per day (student view)
    const dayCount = {};
    filteredLogs.forEach(l => {
      const d = getPhLocalDate(l.timestamp);
      if (!d) return;
      if (nid) {
        dayCount[d] = (dayCount[d] || 0) + 1;
      } else {
        if (!dayCount[d]) dayCount[d] = new Set();
        if (l.status === 'IN') dayCount[d].add(normalizeId(l.studentId));
      }
    });

    // Normalize Sets → numbers
    const counts = {};
    Object.entries(dayCount).forEach(([d, v]) => {
      counts[d] = v instanceof Set ? v.size : v;
    });

    // Jan 1 of current year
    const jan1 = new Date(currentYear, 0, 1);
    // Day-of-week for Jan 1 (0 = Sun)
    const startDow = jan1.getDay();

    // Dec 31 of current year
    const dec31 = new Date(currentYear, 11, 31);

    // Total days in year + leading padding so week columns align to Sunday
    const totalDays = Math.ceil((dec31 - jan1) / 86400000) + 1; // 365 or 366
    const totalCells = startDow + totalDays;
    const totalWeeks = Math.ceil(totalCells / 7);

    const result = [];
    for (let w = 0; w < totalWeeks; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const cellIndex = w * 7 + d;
        const dayOffset = cellIndex - startDow; // negative = padding before Jan 1

        if (dayOffset < 0 || dayOffset >= totalDays) {
          // Padding cell — outside the year
          week.push({ isPadding: true, date: null });
        } else {
          const date = new Date(currentYear, 0, 1 + dayOffset);
          // Use en-CA for YYYY-MM-DD format in PH timezone
          const dateStr = date.toLocaleDateString('en-CA', { timeZone: PH_TZ });
          const isFuture = dateStr > todayStr;
          week.push({
            isPadding: false,
            date: dateStr,
            count: isFuture ? -1 : (counts[dateStr] || 0),
            isFuture,
            isToday: dateStr === todayStr,
            month: date.getMonth(),
            day: date.getDay(),
            label: date.toLocaleDateString('en-PH', {
              timeZone: PH_TZ,
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
          });
        }
      }
      result.push(week);
    }
    return result;
  }, [logs, studentId, todayStr, currentYear]);

  // Month label: place at the first week-column where that month first appears
  const monthPositions = useMemo(() => {
    const seen = new Set();
    const positions = [];
    weeks.forEach((week, wi) => {
      // Use first non-padding cell in the week
      const firstReal = week.find(d => !d.isPadding && !d.isFuture);
      if (firstReal && !seen.has(firstReal.month)) {
        seen.add(firstReal.month);
        positions.push({ wi, label: MONTH_LABELS[firstReal.month] });
      }
    });
    return positions;
  }, [weeks]);

  // Total days present this year (any count > 0, up to today)
  const totalPresent = useMemo(() => {
    return weeks.flat().filter(c => !c.isPadding && !c.isFuture && c.count > 0).length;
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
                  {pos && (
                    <span className={`text-[9px] font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      {pos.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-0">

            {/* Day-of-week labels */}
            <div className="flex flex-col mr-1" style={{ gap }}>
              {DAY_LABELS.map((l, i) => (
                <div
                  key={i}
                  style={{ height: cellSize, width: 18, flexShrink: 0 }}
                  className={`text-[9px] font-bold flex items-center justify-end pr-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
                >
                  {l}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap, marginRight: gap }}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={
                      cell.isPadding || cell.isFuture
                        ? ''
                        : `${cell.label}: ${cell.count} scan${cell.count !== 1 ? 's' : ''}`
                    }
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 2,
                      flexShrink: 0,
                      background: cell.isPadding || cell.isFuture
                        ? 'transparent'
                        : getColor(cell.count, darkMode),
                      outline: cell.isToday ? '2px solid #0ea5e9' : 'none',
                      outlineOffset: 1,
                      opacity: cell.isPadding || cell.isFuture ? 0 : 1,
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
              <div
                key={c}
                style={{ width: cellSize, height: cellSize, borderRadius: 2, background: getColor(c, darkMode), flexShrink: 0 }}
              />
            ))}
            <span>More</span>
          </div>

        </div>
      </div>
    </div>
  );
}
