'use client';

import { useMemo, useState } from 'react';
import { normalizeId, getPhTodayStr, getPhLocalDate, formatLocalDateTime } from '../_lib/data';

const PH_TZ = 'Asia/Manila';
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getColor(count, darkMode) {
  if (count === 0) return darkMode ? '#1e2a1e' : '#e9f5e9';
  if (count === 1) return '#86efac';
  if (count === 2) return '#4ade80';
  if (count <= 4)  return '#16a34a';
  return '#14532d';
}

function getBorderColor(count, darkMode) {
  if (count === 0) return darkMode ? '#2a3a2a' : '#d4ebd4';
  if (count === 1) return '#4ade80';
  if (count === 2) return '#22c55e';
  if (count <= 4)  return '#15803d';
  return '#166534';
}

export default function AttendanceHeatmap({ logs, studentId, darkMode, title = 'Attendance This Year' }) {
  const todayStr = getPhTodayStr();
  const currentYear = new Date().getFullYear();
  const [selectedCell, setSelectedCell] = useState(null);

  const weeks = useMemo(() => {
    const nid = studentId ? normalizeId(studentId) : null;
    const filteredLogs = nid
      ? logs.filter(l => l.studentId && normalizeId(l.studentId) === nid)
      : logs;

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

    const counts = {};
    Object.entries(dayCount).forEach(([d, v]) => {
      counts[d] = v instanceof Set ? v.size : v;
    });

    const jan1 = new Date(currentYear, 0, 1);
    const startDow = jan1.getDay();
    const dec31 = new Date(currentYear, 11, 31);
    const totalDays = Math.ceil((dec31 - jan1) / 86400000) + 1;
    const totalCells = startDow + totalDays;
    const totalWeeks = Math.ceil(totalCells / 7);

    const result = [];
    for (let w = 0; w < totalWeeks; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const cellIndex = w * 7 + d;
        const dayOffset = cellIndex - startDow;

        if (dayOffset < 0 || dayOffset >= totalDays) {
          week.push({ isPadding: true, date: null });
        } else {
          const date = new Date(currentYear, 0, 1 + dayOffset);
          const dateStr = date.toLocaleDateString('en-CA', { timeZone: PH_TZ });
          const isFuture = dateStr > todayStr;
          week.push({
            isPadding: false,
            date: dateStr,
            count: isFuture ? -1 : (counts[dateStr] || 0),
            isFuture,
            isToday: dateStr === todayStr,
            month: date.getMonth(),
            dayOfWeek: date.getDay(),
            label: date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            shortLabel: date.toLocaleDateString('en-US', {
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

  const monthPositions = useMemo(() => {
    const seen = new Set();
    const positions = [];
    weeks.forEach((week, wi) => {
      const firstReal = week.find(d => !d.isPadding);
      if (firstReal && !seen.has(firstReal.month)) {
        seen.add(firstReal.month);
        positions.push({ wi, label: MONTH_LABELS[firstReal.month] });
      }
    });
    return positions;
  }, [weeks]);

  const totalPresent = useMemo(() => {
    return weeks.flat().filter(c => !c.isPadding && !c.isFuture && c.count > 0).length;
  }, [weeks]);

  // All days with attendance for the select dropdown
  const presentDays = useMemo(() => {
    return weeks.flat()
      .filter(c => !c.isPadding && !c.isFuture && c.count > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [weeks]);

  const cellSize = 16;
  const gap = 3;
  const step = cellSize + gap;

  const handleCellClick = (cell) => {
    if (cell.isPadding || cell.isFuture) return;
    setSelectedCell(prev => prev?.date === cell.date ? null : cell);
  };

  const handleSelectChange = (e) => {
    const dateStr = e.target.value;
    if (!dateStr) { setSelectedCell(null); return; }
    const found = weeks.flat().find(c => c.date === dateStr);
    if (found) setSelectedCell(found);
  };

  return (
    <div
      className={`border rounded-2xl p-6 ${darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white border-gray-200/80 shadow-sm'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className={`text-base font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <span className="font-black text-green-500">{totalPresent}</span>
            <span className="font-medium"> days present in {currentYear}</span>
          </p>
        </div>

        {/* Select box */}
        <div className="relative">
          <select
            onChange={handleSelectChange}
            value={selectedCell?.date || ''}
            className={`
              text-xs font-semibold rounded-lg px-3 py-2 pr-8 appearance-none cursor-pointer
              border transition-all outline-none
              ${darkMode
                ? 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}
            `}
            style={{ minWidth: 210 }}
          >
            <option value="">— Jump to a day —</option>
            {presentDays.map(d => (
              <option key={d.date} value={d.date}>
                {d.label} · {d.count} scan{d.count !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <span className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>▼</span>
        </div>
      </div>

      {/* Selected day info banner */}
      {selectedCell && !selectedCell.isFuture && !selectedCell.isPadding && (
        <div className={`
          flex items-center gap-3 mb-5 px-4 py-3 rounded-xl text-sm border transition-all
          ${darkMode
            ? 'bg-green-950/60 border-green-800/60 text-green-300'
            : 'bg-green-50 border-green-200 text-green-800'}
        `}>
          <div className="flex-1 min-w-0">
            <span className="font-black">{selectedCell.label}</span>
            <span className={`ml-2 text-xs font-semibold ${darkMode ? 'text-green-500' : 'text-green-600'}`}>
              {selectedCell.count === 0
                ? '— No attendance recorded'
                : `· ${selectedCell.count} scan${selectedCell.count !== 1 ? 's' : ''} recorded`}
            </span>
          </div>
          <button
            onClick={() => setSelectedCell(null)}
            className={`text-xl leading-none shrink-0 ${darkMode ? 'text-green-600 hover:text-green-400' : 'text-green-400 hover:text-green-600'}`}
          >×</button>
        </div>
      )}

      {/* Heatmap */}
      <div className="overflow-x-auto pb-2">
        <div style={{ minWidth: weeks.length * step + 44 }}>

          {/* Month labels */}
          <div className="flex mb-2" style={{ paddingLeft: 40 }}>
            {weeks.map((_, wi) => {
              const pos = monthPositions.find(p => p.wi === wi);
              return (
                <div key={wi} style={{ width: step, flexShrink: 0 }}>
                  {pos && (
                    <span className={`text-[10px] font-bold tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {pos.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex">
            {/* Day-of-week labels — all 7 shown */}
            <div className="flex flex-col shrink-0" style={{ gap, marginRight: 6 }}>
              {DAY_LABELS.map((l, i) => (
                <div
                  key={i}
                  style={{ height: cellSize, width: 30 }}
                  className={`text-[9px] font-bold flex items-center justify-end pr-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
                >
                  {l}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap, marginRight: gap }}>
                {week.map((cell, di) => {
                  const isSelected = selectedCell?.date === cell.date;
                  return (
                    <div
                      key={di}
                      onClick={() => handleCellClick(cell)}
                      title={
                        cell.isPadding || cell.isFuture
                          ? ''
                          : `${cell.label}\n${cell.count === 0 ? 'No scans' : `${cell.count} scan${cell.count !== 1 ? 's' : ''}`}`
                      }
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 3,
                        flexShrink: 0,
                        background: cell.isPadding
                          ? 'transparent'
                          : cell.isFuture
                            ? (darkMode ? '#181f18' : '#f4faf4')
                            : getColor(cell.count, darkMode),
                        border: cell.isPadding
                          ? 'none'
                          : cell.isFuture
                            ? `1px solid ${darkMode ? '#232d23' : '#e2f0e2'}`
                            : isSelected
                              ? '2px solid #f59e0b'
                              : cell.isToday
                                ? '2px solid #0ea5e9'
                                : `1px solid ${getBorderColor(cell.count, darkMode)}`,
                        opacity: cell.isPadding ? 0 : cell.isFuture ? 0.35 : 1,
                        cursor: cell.isPadding || cell.isFuture ? 'default' : 'pointer',
                        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                        transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                        boxShadow: isSelected ? '0 0 0 2px #f59e0b44' : 'none',
                        position: 'relative',
                        zIndex: isSelected ? 2 : 1,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className={`flex items-center flex-wrap gap-x-3 gap-y-2 mt-4 text-[10px] font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            <span>Less</span>
            {[0, 1, 2, 3, 5].map(c => (
              <div
                key={c}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 3,
                  background: getColor(c, darkMode),
                  border: `1px solid ${getBorderColor(c, darkMode)}`,
                  flexShrink: 0,
                }}
              />
            ))}
            <span>More</span>
            <span className="ml-3 flex items-center gap-1.5">
              <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: 'transparent', border: '2px solid #0ea5e9', flexShrink: 0 }} />
              Today
            </span>
            <span className="flex items-center gap-1.5">
              <div style={{ width: cellSize, height: cellSize, borderRadius: 3, background: 'transparent', border: '2px solid #f59e0b', flexShrink: 0 }} />
              Selected
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
