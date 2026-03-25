'use client';

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Search, X, ArrowUpDown, RefreshCw, Clock, LayoutGrid, List } from 'lucide-react';
import { normalizeId, parsePhTimestamp, getPhTodayStr, getPhLocalDate } from '../_lib/data';
import {
  RateRing, AnimatedNumber, FilterChip, EmptyState, Skeleton,
} from './ui';

const PH_TZ = 'Asia/Manila';

/* ── Highlight matching text ── */
function Highlight({ text, query, darkMode }) {
  const str = text == null ? '' : String(text);
  if (!query || !str) return <span>{str}</span>;
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{str}</span>;
  return (
    <span>
      {str.slice(0, idx)}
      <mark className={`rounded px-0.5 ${darkMode ? 'bg-sky-500/25 text-sky-300' : 'bg-sky-100 text-sky-800'}`}>
        {str.slice(idx, idx + query.length)}
      </mark>
      {str.slice(idx + query.length)}
    </span>
  );
}

/* ── Mini sparkline (7-bar trend) ── */
function Sparkline({ data, color = '#10b981' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 48, h = 18;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * (h - 2) - 1}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      <circle cx={data.length > 1 ? (data.length - 1) * step : 0} cy={h - (data[data.length - 1] / max) * (h - 2) - 1} r="2.5" fill={color} />
    </svg>
  );
}

/* ── Sort options ── */
const SORT_OPTIONS = [
  { value: 'name',  label: 'A → Z'           },
  { value: 'rate',  label: 'Top attendance'   },
  { value: 'total', label: 'Most students'    },
  { value: 'alpha', label: 'Z → A'            },
];

/* ── Skeleton card ── */
function ClassCardSkeleton({ darkMode }) {
  return (
    <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 pr-4">
            <Skeleton darkMode={darkMode} className="h-4 w-3/5 rounded-lg" />
            <Skeleton darkMode={darkMode} className="h-3 w-1/4 rounded" />
          </div>
          <Skeleton darkMode={darkMode} className="w-10 h-10 rounded-full" style={{ borderRadius: '50%' }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => <Skeleton key={i} darkMode={darkMode} className="h-14 rounded-xl" />)}
        </div>
        <Skeleton darkMode={darkMode} className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function ClassroomMonitorTab({
  darkMode, students, classes, logs,
  searchQuery, setSearchQuery,
  selectedClass, setSelectedClass,
  loading = false,
  onToast,
}) {
  const [sortBy,         setSortBy]         = useState('name');
  const [showSort,       setShowSort]       = useState(false);
  const [viewMode,       setViewMode]       = useState('card');
  const [lastRefreshed,  setLastRefreshed]  = useState(Date.now());
  const sortRef = useRef(null);

  useEffect(() => {
    if (!loading) setLastRefreshed(Date.now());
  }, [loading]);

  useEffect(() => {
    const h = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ─────────────────────────────────────────────────────────
  // KEY OPTIMIZATION 1: Build a single-pass lookup map for
  // today's status and last-seen time for every student.
  // Previously getStudentTodayStatus + getStudentLastSeen
  // each scanned ALL logs on every render call — O(logs²).
  // Now it's one O(logs) pass, results cached in a Map.
  // ─────────────────────────────────────────────────────────
  const studentLogMap = useMemo(() => {
    const today = getPhTodayStr();
    // Maps normalizeId(studentId) -> { status: 'in'|'out'|'no-log', lastSeen: string|null }
    const statusMap  = new Map(); // nid -> { latestTs, latestStatus, latestDate }
    const lastSeenMap = new Map(); // nid -> { latestTs, timeStr }

    for (const l of logs) {
      if (!l.timestamp || !l.studentId) continue;
      const nid = normalizeId(l.studentId);
      const ts  = parsePhTimestamp(l.timestamp);
      if (!ts) continue;
      const tsMs = ts.getTime();

      // last-seen (across all days)
      const prev = lastSeenMap.get(nid);
      if (!prev || tsMs > prev.tsMs) {
        lastSeenMap.set(nid, {
          tsMs,
          timeStr: ts.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit' }),
        });
      }

      // today's status
      if (getPhLocalDate(l.timestamp) !== today) continue;
      const prevToday = statusMap.get(nid);
      if (!prevToday || tsMs > prevToday.tsMs) {
        statusMap.set(nid, { tsMs, status: l.status === 'IN' ? 'in' : 'out' });
      }
    }

    return { statusMap, lastSeenMap };
  }, [logs]);

  // O(1) lookups replacing the old O(n) callbacks
  const getStudentTodayStatus = useCallback((studentId) => {
    const nid = normalizeId(studentId);
    return studentLogMap.statusMap.get(nid)?.status ?? 'no-log';
  }, [studentLogMap]);

  const getStudentLastSeen = useCallback((studentId) => {
    const nid = normalizeId(studentId);
    return studentLogMap.lastSeenMap.get(nid)?.timeStr ?? null;
  }, [studentLogMap]);

  // ─────────────────────────────────────────────────────────
  // KEY OPTIMIZATION 2: Per-class stats computed once.
  // Same as before but now getStudentTodayStatus is O(1).
  // ─────────────────────────────────────────────────────────
  const classStats = useMemo(() => {
    return classes.reduce((acc, cn) => {
      const st = students.filter(s => s.class === cn);
      const counts = { in: 0, out: 0, 'no-log': 0 };
      st.forEach(s => counts[getStudentTodayStatus(s.studentId)]++);
      acc[cn] = { counts, rate: st.length > 0 ? Math.round((counts.in / st.length) * 100) : 0, total: st.length };
      return acc;
    }, {});
  }, [classes, students, getStudentTodayStatus]);

  // ─────────────────────────────────────────────────────────
  // KEY OPTIMIZATION 3: Sparklines — build a date→Set(nids)
  // index first so we don't re-scan all logs 7× per class.
  // ─────────────────────────────────────────────────────────
  const classSparklines = useMemo(() => {
    // Build date string array for last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en-CA', { timeZone: PH_TZ }));
    }

    // Index: Map<dateStr, Set<normalizedStudentId>> of students who were IN
    const datePresent = new Map();
    days.forEach(d => datePresent.set(d, new Set()));

    for (const l of logs) {
      if (l.status !== 'IN' || !l.studentId || !l.timestamp) continue;
      const dateStr = getPhLocalDate(l.timestamp);
      if (datePresent.has(dateStr)) {
        datePresent.get(dateStr).add(normalizeId(l.studentId));
      }
    }

    // Build per-class sparkline using the index
    const result = {};
    classes.forEach(cn => {
      const nids = new Set(students.filter(s => s.class === cn).map(s => normalizeId(s.studentId)));
      result[cn] = days.map(d => {
        let count = 0;
        datePresent.get(d)?.forEach(nid => { if (nids.has(nid)) count++; });
        return count;
      });
    });
    return result;
  }, [classes, students, logs]);

  // ─────────────────────────────────────────────────────────
  // KEY OPTIMIZATION 4: Pre-sort student lists per class
  // so expanded cards don't sort on every render.
  // ─────────────────────────────────────────────────────────
  const STATUS_ORDER = { in: 0, out: 1, 'no-log': 2 };

  const sortedStudentsByClass = useMemo(() => {
    const map = {};
    classes.forEach(cn => {
      map[cn] = students
        .filter(s => s.class === cn)
        .slice()
        .sort((a, b) => {
          const sa = getStudentTodayStatus(a.studentId);
          const sb = getStudentTodayStatus(b.studentId);
          if (STATUS_ORDER[sa] !== STATUS_ORDER[sb]) return STATUS_ORDER[sa] - STATUS_ORDER[sb];
          return a.name.localeCompare(b.name);
        });
    });
    return map;
  }, [classes, students, getStudentTodayStatus]);

  const filteredSorted = useMemo(() => {
    let list = [...classes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(cn => {
        if (cn.toLowerCase().includes(q)) return true;
        return students.filter(s => s.class === cn).some(s =>
          s.name.toLowerCase().includes(q) || normalizeId(s.studentId).includes(q)
        );
      });
    }
    return list.sort((a, b) => {
      if (sortBy === 'rate')  return (classStats[b]?.rate  ?? 0) - (classStats[a]?.rate  ?? 0);
      if (sortBy === 'total') return (classStats[b]?.total ?? 0) - (classStats[a]?.total ?? 0);
      if (sortBy === 'alpha') return b.localeCompare(a);
      return a.localeCompare(b);
    });
  }, [classes, students, searchQuery, sortBy, classStats]);

  // ─────────────────────────────────────────────────────────
  // KEY OPTIMIZATION 5: Filter students using pre-sorted list
  // ─────────────────────────────────────────────────────────
  const getFilteredStudents = useCallback((cn) => {
    const list = sortedStudentsByClass[cn] ?? [];
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => s.name.toLowerCase().includes(q) || normalizeId(s.studentId).includes(q));
  }, [sortedStudentsByClass, searchQuery]);

  const overallStats = useMemo(() => {
    const t = { in: 0, out: 0, 'no-log': 0, total: 0 };
    Object.values(classStats).forEach(c => { t.in += c.counts.in; t.out += c.counts.out; t['no-log'] += c.counts['no-log']; t.total += c.total; });
    return { ...t, rate: t.total > 0 ? Math.round((t.in / t.total) * 100) : 0 };
  }, [classStats]);

  const statusCfg = useMemo(() => ({
    'in':     { dot: 'bg-emerald-500', badge: darkMode ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'IN',     pulse: true  },
    'out':    { dot: 'bg-rose-500',    badge: darkMode ? 'bg-rose-500/12 text-rose-400 border-rose-500/20'           : 'bg-rose-50 text-rose-700 border-rose-100',           label: 'OUT',    pulse: false },
    'no-log': { dot: 'bg-gray-400',    badge: darkMode ? 'bg-white/5 text-gray-400 border-white/8'                   : 'bg-gray-50 text-gray-500 border-gray-200',            label: 'Absent', pulse: false },
  }), [darkMode]);

  const [timeSince, setTimeSince] = useState('just now');
  useEffect(() => {
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - lastRefreshed) / 1000);
      if (s < 60) setTimeSince('just now');
      else if (s < 3600) setTimeSince(`${Math.floor(s / 60)}m ago`);
      else setTimeSince(`${Math.floor(s / 3600)}h ago`);
    }, 10000);
    setTimeSince('just now');
    return () => clearInterval(id);
  }, [lastRefreshed]);

  return (
    <div className="space-y-5">

      {/* ── Overview banner ── */}
      <div className={`relative overflow-hidden rounded-2xl border p-4 ${darkMode ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}>
        {loading && (
          <div className="absolute top-0.5 left-0 right-0 h-0.5 animate-pulse" style={{ background: 'linear-gradient(90deg,transparent,#0ea5e9,transparent)', backgroundSize: '200%', animation: 'shimmer-bar 1.5s linear infinite' }} />
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>School Overview — Today</p>
              {!loading && <span className={`text-[10px] font-semibold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Updated {timeSince}</span>}
              {loading && <RefreshCw size={10} className="text-sky-500 animate-spin" />}
            </div>
            {loading ? (
              <Skeleton darkMode={darkMode} className="h-8 w-40 rounded-lg mt-1" />
            ) : (
              <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <AnimatedNumber value={overallStats.in} /> <span className={`text-base font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>/ {overallStats.total} enrolled</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            {[
              { label: 'Present', value: overallStats.in,        color: 'text-emerald-500' },
              { label: 'Out',     value: overallStats.out,       color: 'text-rose-500'    },
              { label: 'Absent',  value: overallStats['no-log'], color: darkMode ? 'text-gray-400' : 'text-gray-500' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                {loading ? <Skeleton darkMode={darkMode} className="h-7 w-8 rounded mx-auto" /> : (
                  <p className={`text-2xl font-black tabular-nums ${s.color}`}><AnimatedNumber value={s.value} /></p>
                )}
                <p className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{s.label}</p>
              </div>
            ))}
            <div className="relative w-12 h-12 flex-shrink-0">
              <RateRing rate={loading ? 0 : overallStats.rate} size={48} darkMode={darkMode} />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
                style={{ color: overallStats.rate >= 80 ? '#10b981' : overallStats.rate >= 60 ? '#f59e0b' : '#f43f5e' }}>
                {loading ? '…' : `${overallStats.rate}%`}
              </span>
            </div>
          </div>
        </div>
        <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/6' : 'bg-gray-100'}`}>
          <div className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: loading ? '0%' : `${overallStats.rate}%`, background: '#10b981' }} />
        </div>
      </div>

      {/* ── Search + sort ── */}
      <div className="flex gap-2">
        <div className={`flex items-center gap-3 flex-1 p-3.5 rounded-2xl border transition-all duration-300
          focus-within:ring-2 focus-within:ring-sky-500/20
          ${darkMode ? 'bg-white/[0.04] border-white/8 focus-within:border-sky-500/50' : 'bg-white border-gray-200 shadow-sm focus-within:border-sky-400 hover:border-gray-300'}`}
        >
          <Search size={15} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
          <input
            type="text"
            placeholder="Search class, student, or ID…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent text-sm outline-none font-medium
              ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className={`p-1 rounded-lg transition-all hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-white/8 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button onClick={() => setShowSort(v => !v)}
            className={`flex items-center gap-2 px-3.5 py-3 rounded-2xl border text-sm font-bold transition-all hover:scale-105 active:scale-95
              ${showSort
                ? darkMode ? 'bg-white/8 border-white/16 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
                : darkMode ? 'bg-white/[0.04] border-white/8 text-gray-400 hover:bg-white/7' : 'bg-white border-gray-200 text-gray-500 shadow-sm hover:border-gray-300'
              }`}
          >
            <ArrowUpDown size={14} />
            <span className="hidden sm:inline">{SORT_OPTIONS.find(s => s.value === sortBy)?.label}</span>
          </button>
          {showSort && (
            <div className={`absolute right-0 top-full mt-2 w-48 rounded-2xl border overflow-hidden z-30
              ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}
              style={{ boxShadow: '0 12px 36px rgba(0,0,0,0.2)', animation: 'hdr-slide-down 0.18s ease-out both' }}
            >
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-2
                    ${sortBy === opt.value
                      ? darkMode ? 'text-sky-400 bg-sky-500/10' : 'text-sky-600 bg-sky-50'
                      : darkMode ? 'text-gray-300 hover:bg-white/6' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {sortBy === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend + count */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Legend:</span>
        {[
          { label: 'IN — Present', dot: 'bg-emerald-500' },
          { label: 'OUT — Left',   dot: 'bg-rose-500'    },
          { label: 'Absent',       dot: 'bg-gray-400'    },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${l.dot}`} />
            <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{l.label}</span>
          </div>
        ))}
        <span className={`ml-auto text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {filteredSorted.length} {filteredSorted.length === 1 ? 'class' : 'classes'}
        </span>
      </div>

      {/* ── Class cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClassCardSkeleton key={i} darkMode={darkMode} />
          ))}
        </div>
      ) : filteredSorted.length === 0 ? (
        <EmptyState
          icon={Search}
          title={searchQuery ? `No classes match "${searchQuery}"` : 'No classes yet'}
          body={searchQuery ? 'Try a different search term or clear the filter.' : undefined}
          action={searchQuery ? () => setSearchQuery('') : undefined}
          actionLabel="Clear search"
          darkMode={darkMode}
        />
      ) : viewMode === 'grid' ? (
        <div className="space-y-4">
          {filteredSorted.map(cn => {
            const classStudents = sortedStudentsByClass[cn] ?? [];
            const query = searchQuery?.toLowerCase() || '';
            const shown = query
              ? classStudents.filter(s => s.name?.toLowerCase().includes(query) || s.studentId?.toString().includes(query))
              : classStudents;
            const { counts } = classStats[cn] || { counts: { in: 0, out: 0, 'no-log': 0 } };
            return (
              <div key={cn} className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
                <div className={`px-4 py-3 flex items-center justify-between border-b ${darkMode ? 'border-white/[0.05]' : 'border-gray-100'}`}>
                  <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cn}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-emerald-500">{counts.in} IN</span>
                    <span className="text-[10px] font-bold text-rose-500">{counts.out} OUT</span>
                    <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{counts['no-log']} absent</span>
                  </div>
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {shown.map(student => {
                    const status = getStudentTodayStatus(student.studentId);
                    const lastSeen = getStudentLastSeen(student.studentId);
                    const initial = (student.name || '?').charAt(0).toUpperCase();
                    const bg = status === 'in' ? '#10b981' : status === 'out' ? 'linear-gradient(135deg,#f43f5e,#e11d48)' : darkMode ? '#1e2333' : '#e5e7eb';
                    const dot = status === 'in' ? '#10b981' : status === 'out' ? '#f43f5e' : '#9ca3af';
                    return (
                      <div key={student.studentId}
                        title={`${student.name} | ID: ${student.studentId} | ${status === 'in' ? 'IN' : status === 'out' ? 'OUT' : 'Absent'}${lastSeen ? ' | ' + lastSeen : ''}`}
                        className="flex flex-col items-center gap-1 w-11 cursor-default">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-sm"
                            style={{ background: bg, color: (status === 'no-log' && !darkMode) ? '#9ca3af' : 'white' }}>
                            {initial}
                          </div>
                          {status === 'in' && <div className="absolute inset-0 rounded-xl bg-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />}
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                            style={{ background: dot, borderColor: darkMode ? '#0a0e1c' : '#fff' }} />
                        </div>
                        <p className={`text-[9px] font-semibold text-center leading-tight w-full truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {student.name.split(' ')[0]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSorted.map((cn) => {
            const { counts, rate, total } = classStats[cn] || { counts: { in: 0, out: 0, 'no-log': 0 }, rate: 0, total: 0 };
            const filteredSt = getFilteredStudents(cn);
            const isExpanded = selectedClass === cn;
            const spark      = classSparklines[cn] || [];
            const sparkColor = rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#f43f5e';
            const rateGrad   = rate >= 80 ? 'bg-emerald-600' : rate >= 60 ? 'bg-amber-500' : 'bg-rose-600';

            return (
              <div key={cn}
                className={`group border rounded-2xl overflow-hidden transition-[opacity,transform,border-color,background-color,box-shadow] duration-200
                  hover:-translate-y-0.5 hover:shadow-lg
                  opacity-100 translate-y-0
                  ${isExpanded
                    ? darkMode ? 'bg-white/[0.06] border-white/16 shadow-xl' : 'bg-white border-gray-300 shadow-xl'
                    : darkMode ? 'bg-white/[0.03] border-white/8 hover:bg-white/[0.06] hover:border-white/14' : 'bg-white border-gray-200/80 shadow-sm hover:border-gray-300 hover:shadow-lg'
                  }`}
              >
                <button onClick={() => {
                  const next = isExpanded ? null : cn;
                  setSelectedClass(next);
                  if (next) onToast?.('info', cn, `${counts.in} present · ${counts.out} out · ${counts['no-log']} absent`);
                }} className="w-full p-5 text-left">
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1 pr-3">
                      <h3 className={`font-black text-base truncate ${darkMode ? 'text-white' : 'text-gray-900'}`} title={cn}>{cn}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{total} students</p>
                        {spark.length > 1 && <Sparkline data={spark} color={sparkColor} />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="relative w-10 h-10">
                        <RateRing rate={rate} size={40} darkMode={darkMode} />
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color: sparkColor }}>
                          {rate}%
                        </span>
                      </div>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300
                        ${isExpanded ? 'bg-sky-500' : darkMode ? 'bg-white/6' : 'bg-gray-100'}`}>
                        <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <path d="M2 4l4 4 4-4" stroke={isExpanded ? 'white' : darkMode ? '#9ca3af' : '#6b7280'} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Status mini-cards */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'IN',     count: counts.in,        dim: darkMode ? 'bg-emerald-500/10 border-emerald-500/15' : 'bg-emerald-50 border-emerald-100', text: 'text-emerald-500' },
                      { label: 'OUT',    count: counts.out,       dim: darkMode ? 'bg-rose-500/10 border-rose-500/15'       : 'bg-rose-50 border-rose-100',         text: 'text-rose-500'    },
                      { label: 'Absent', count: counts['no-log'], dim: darkMode ? 'bg-white/[0.04] border-white/6'          : 'bg-gray-50 border-gray-100',         text: darkMode ? 'text-gray-400' : 'text-gray-500' },
                    ].map((s, i) => (
                      <div key={i} className={`${s.dim} border rounded-xl p-2.5 text-center`}>
                        <p className={`text-xl font-black tabular-nums ${s.text}`}><AnimatedNumber value={s.count} /></p>
                        <p className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/6' : 'bg-gray-100'}`}>
                    <div className={`h-full rounded-full bg-gradient-to-r ${rateGrad} transition-all duration-700 ease-out`}
                      style={{ width: `${rate}%` }} />
                  </div>
                </button>

                {/* Expanded student list */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out border-t
                  ${darkMode ? 'border-white/6' : 'border-gray-100'}
                  ${isExpanded ? 'max-h-[400px]' : 'max-h-0 border-transparent'}`}
                >
                  <div className={`px-5 py-2.5 flex items-center justify-between ${darkMode ? 'bg-white/[0.02]' : 'bg-slate-50/80'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      {filteredSt.length} students
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {filteredSt.map((student, si) => {
                      const status   = getStudentTodayStatus(student.studentId);
                      const lastSeen = getStudentLastSeen(student.studentId);
                      const cfg      = statusCfg[status];
                      return (
                        <div key={si}
                          className={`flex items-center gap-3 px-5 py-3 border-b last:border-0 transition-colors duration-150
                            ${darkMode ? 'border-white/[0.04] hover:bg-white/[0.04]' : 'border-gray-100/80 hover:bg-slate-50'}`}
                        >
                          <div className="relative flex-shrink-0">
                            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <Highlight text={student.name} query={searchQuery} darkMode={darkMode} />
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className={`text-xs font-mono truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                <Highlight text={student.studentId} query={searchQuery} darkMode={darkMode} />
                              </p>
                              {lastSeen && status !== 'no-log' && (
                                <span className={`text-[10px] flex items-center gap-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                  <Clock size={8} />{lastSeen}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 border ${cfg.badge}`}>{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer-bar {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes hdr-slide-down {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}