'use client';

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Search, X, ArrowUpDown, RefreshCw, Clock } from 'lucide-react';
import { normalizeId, parsePhTimestamp, getPhTodayStr, getPhLocalDate } from '../_lib/data';
import {
  RateRing, AnimatedNumber, FilterChip, EmptyState, Skeleton,
} from './ui';

const PH_TZ = 'Asia/Manila';

/* ── Highlight matching text ── */
function Highlight({ text, query, darkMode }) {
  if (!query || !text) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className={`rounded px-0.5 ${darkMode ? 'bg-sky-500/25 text-sky-300' : 'bg-sky-100 text-sky-800'}`}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
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
  const [lastRefreshed,  setLastRefreshed]  = useState(Date.now());
  const sortRef = useRef(null);

  // Track refresh for "last updated" display
  useEffect(() => {
    if (!loading) setLastRefreshed(Date.now());
  }, [loading]);

  // Close sort dropdown outside
  useEffect(() => {
    const h = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const getStudentTodayStatus = useCallback((studentId) => {
    const today = getPhTodayStr();
    const nid   = normalizeId(studentId);
    const logs_ = logs
      .filter(l => l.timestamp && l.studentId && normalizeId(l.studentId) === nid && getPhLocalDate(l.timestamp) === today)
      .sort((a, b) => (parsePhTimestamp(a.timestamp)?.getTime() ?? 0) - (parsePhTimestamp(b.timestamp)?.getTime() ?? 0));
    if (!logs_.length) return 'no-log';
    return logs_[logs_.length - 1].status === 'IN' ? 'in' : 'out';
  }, [logs]);

  const getStudentLastSeen = useCallback((studentId) => {
    const nid = normalizeId(studentId);
    const myLogs = logs.filter(l => l.studentId && normalizeId(l.studentId) === nid && l.timestamp);
    if (!myLogs.length) return null;
    const sorted = myLogs.sort((a, b) => (parsePhTimestamp(b.timestamp)?.getTime() ?? 0) - (parsePhTimestamp(a.timestamp)?.getTime() ?? 0));
    const d = parsePhTimestamp(sorted[0].timestamp);
    if (!d) return null;
    return d.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit' });
  }, [logs]);

  // Per-class stats
  const classStats = useMemo(() => {
    return classes.reduce((acc, cn) => {
      const st = students.filter(s => s.class === cn);
      const counts = { in: 0, out: 0, 'no-log': 0 };
      st.forEach(s => counts[getStudentTodayStatus(s.studentId)]++);
      acc[cn] = { counts, rate: st.length > 0 ? Math.round((counts.in / st.length) * 100) : 0, total: st.length };
      return acc;
    }, {});
  }, [classes, students, getStudentTodayStatus]);

  // 7-day sparkline data per class
  const classSparklines = useMemo(() => {
    const result = {};
    classes.forEach(cn => {
      const st = students.filter(s => s.class === cn);
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const phStr = d.toLocaleDateString('en-CA', { timeZone: PH_TZ });
        const present = new Set(
          logs.filter(l => l.status === 'IN' && l.studentId && l.timestamp && getPhLocalDate(l.timestamp) === phStr
            && st.some(s => normalizeId(s.studentId) === normalizeId(l.studentId)))
            .map(l => normalizeId(l.studentId))
        ).size;
        data.push(present);
      }
      result[cn] = data;
    });
    return result;
  }, [classes, students, logs]);

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

  const getFilteredStudents = useCallback((cn) => {
    const list = students.filter(s => s.class === cn);
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => s.name.toLowerCase().includes(q) || normalizeId(s.studentId).includes(q));
  }, [students, searchQuery]);

  const overallStats = useMemo(() => {
    const t = { in: 0, out: 0, 'no-log': 0, total: 0 };
    Object.values(classStats).forEach(c => { t.in += c.counts.in; t.out += c.counts.out; t['no-log'] += c.counts['no-log']; t.total += c.total; });
    return { ...t, rate: t.total > 0 ? Math.round((t.in / t.total) * 100) : 0 };
  }, [classStats]);

  const statusCfg = {
    'in':     { dot: 'bg-emerald-500', badge: darkMode ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'IN',     pulse: true  },
    'out':    { dot: 'bg-rose-500',    badge: darkMode ? 'bg-rose-500/12 text-rose-400 border-rose-500/20'           : 'bg-rose-50 text-rose-700 border-rose-100',           label: 'OUT',    pulse: false },
    'no-log': { dot: 'bg-gray-400',    badge: darkMode ? 'bg-white/5 text-gray-400 border-white/8'                   : 'bg-gray-50 text-gray-500 border-gray-200',            label: 'Absent', pulse: false },
  };

  // Time since last refresh
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
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981)' }} />
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
            {/* Rate ring */}
            <div className="relative w-12 h-12 flex-shrink-0">
              <RateRing rate={loading ? 0 : overallStats.rate} size={48} darkMode={darkMode} />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
                style={{ color: overallStats.rate >= 80 ? '#10b981' : overallStats.rate >= 60 ? '#f59e0b' : '#f43f5e' }}>
                {loading ? '…' : `${overallStats.rate}%`}
              </span>
            </div>
          </div>
        </div>
        {/* Overall progress bar */}
        <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/6' : 'bg-gray-100'}`}>
          <div className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: loading ? '0%' : `${overallStats.rate}%`, background: 'linear-gradient(90deg,#0ea5e9,#10b981)' }} />
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
          { label: 'IN — Present',    dot: 'bg-emerald-500', pulse: true  },
          { label: 'OUT — Left',      dot: 'bg-rose-500',    pulse: false },
          { label: 'Absent',          dot: 'bg-gray-400',    pulse: false },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${l.dot} relative`}>
              {l.pulse && <div className={`absolute inset-0 rounded-full ${l.dot} animate-ping opacity-60`} />}
            </div>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSorted.map((cn, idx) => {
            const { counts, rate, total } = classStats[cn] || { counts: { in: 0, out: 0, 'no-log': 0 }, rate: 0, total: 0 };
            const filteredSt  = getFilteredStudents(cn);
            const isExpanded  = selectedClass === cn;
            
            const spark       = classSparklines[cn] || [];
            const sparkColor  = rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#f43f5e';
            const rateGrad    = rate >= 80 ? 'from-emerald-400 to-emerald-600' : rate >= 60 ? 'from-amber-400 to-amber-500' : 'from-rose-400 to-rose-600';

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
                {/* Top accent */}
                <div className="h-0.5 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg,${sparkColor},${sparkColor}44)` }} />

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
                        {spark.length > 1 && (
                          <Sparkline data={spark} color={sparkColor} />
                        )}
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
                  {/* Sub-header */}
                  <div className={`px-5 py-2.5 flex items-center justify-between ${darkMode ? 'bg-white/[0.02]' : 'bg-slate-50/80'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      {filteredSt.length} students
                    </span>
                    <div className="flex gap-3">
                      <span className="text-[10px] font-bold text-emerald-500">{counts.in} IN</span>
                      <span className="text-[10px] font-bold text-rose-500">{counts.out} OUT</span>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {filteredSt
                      .slice()
                      .sort((a, b) => {
                        const order = { in: 0, out: 1, 'no-log': 2 };
                        const sa = getStudentTodayStatus(a.studentId);
                        const sb = getStudentTodayStatus(b.studentId);
                        if (order[sa] !== order[sb]) return order[sa] - order[sb];
                        return a.name.localeCompare(b.name);
                      })
                      .map((student, si) => {
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
                              {status === 'in' && <div className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-50`} />}
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