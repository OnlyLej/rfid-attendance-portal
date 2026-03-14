'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Search, Filter, X, Download, FileText,
  ChevronLeft, ChevronRight, Copy, Check,
  ArrowUpDown, ArrowUp, ArrowDown, Users, UserCheck, UserX, Clock,
} from 'lucide-react';
import { normalizeId, parsePhTimestamp, getPhTodayStr, getPhLocalDate } from '../_lib/data';
import { Skeleton, FilterChip, StatusBadge, EmptyState, Pagination } from './ui';

const PH_TZ      = 'Asia/Manila';
const PER_PAGE   = 20;
const DEBOUNCE   = 280;

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerWidth < 768);
    c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c);
  }, []);
  return m;
}

/* ── Debounce hook ── */
function useDebounce(value, ms = DEBOUNCE) {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return dv;
}

/* ── Copy hook ── */
function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = useCallback((text) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(text); setTimeout(() => setCopied(null), 1500); });
  }, []);
  return [copied, copy];
}

/* ── Skeleton table rows ── */
function TableSkeleton({ darkMode, rows = 8 }) {
  return (
    <div className={`divide-y ${darkMode ? 'divide-white/[0.04]' : 'divide-gray-50'}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4 items-center" style={{ animationDelay: `${i * 40}ms` }}>
          <Skeleton darkMode={darkMode} className="h-4 flex-1 rounded" />
          <Skeleton darkMode={darkMode} className="h-4 w-24 rounded" />
          <Skeleton darkMode={darkMode} className="h-4 w-36 rounded" />
          <Skeleton darkMode={darkMode} className="h-4 w-28 rounded" />
          <Skeleton darkMode={darkMode} className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ── Card ── */
const Card = ({ children, className = '', darkMode }) => (
  <div className={`border rounded-2xl backdrop-blur-sm ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)]'} ${className}`}>
    {children}
  </div>
);

/* ── Sortable column header ── */
function ColHeader({ label, sortKey, currentSort, onSort, darkMode }) {
  const active = currentSort?.key === sortKey;
  const dir    = currentSort?.dir;
  return (
    <button onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs font-black uppercase tracking-widest transition-colors hover:scale-100
        ${active ? darkMode ? 'text-sky-400' : 'text-sky-600' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
    >
      {label}
      {active
        ? dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
        : <ArrowUpDown size={11} className="opacity-40" />
      }
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
export default function LogsTab({ darkMode, loading, logs: allLogs, exportToCSV, onToast }) {
  const isMobile = useIsMobile();

  const [rawSearch,    setRawSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter,  setClassFilter]  = useState('all');
  const [dateStart,    setDateStart]    = useState('');
  const [dateEnd,      setDateEnd]      = useState('');
  const [showFilters,  setShowFilters]  = useState(!isMobile);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [colSort,      setColSort]      = useState({ key: 'timestamp', dir: 'desc' });
  const [copied,       copy]            = useCopy();
  const [exporting,    setExporting]    = useState(false);

  const search = useDebounce(rawSearch, DEBOUNCE);
  const today  = getPhTodayStr();

  const uniqueClasses = useMemo(() => [...new Set(allLogs.map(l => l.class).filter(Boolean))].sort(), [allLogs]);

  /* ── Filtered + sorted logs ── */
  const filteredLogs = useMemo(() => {
    let f = [...allLogs];
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(l => normalizeId(l.studentId).includes(q) || l.name?.toLowerCase().includes(q) || l.class?.toLowerCase().includes(q));
    }
    if (dateStart)              f = f.filter(l => getPhLocalDate(l.timestamp) >= dateStart);
    if (dateEnd)                f = f.filter(l => getPhLocalDate(l.timestamp) <= dateEnd);
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    if (classFilter  !== 'all') f = f.filter(l => l.class === classFilter);

    f.sort((a, b) => {
      const dir = colSort.dir === 'asc' ? 1 : -1;
      if (colSort.key === 'timestamp') {
        const da = parsePhTimestamp(a.timestamp), db = parsePhTimestamp(b.timestamp);
        return dir * ((da?.getTime() ?? 0) - (db?.getTime() ?? 0));
      }
      if (colSort.key === 'name')   return dir * (a.name ?? '').localeCompare(b.name ?? '');
      if (colSort.key === 'class')  return dir * (a.class ?? '').localeCompare(b.class ?? '');
      if (colSort.key === 'status') return dir * (a.status ?? '').localeCompare(b.status ?? '');
      return 0;
    });
    return f;
  }, [allLogs, search, dateStart, dateEnd, statusFilter, classFilter, colSort]);

  const handleColSort = (key) => {
    setColSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };

  /* Quick stats */
  const fStats = useMemo(() => ({
    inCount:  filteredLogs.filter(l => l.status === 'IN').length,
    outCount: filteredLogs.filter(l => l.status === 'OUT').length,
  }), [filteredLogs]);

  const totalPages = Math.ceil(filteredLogs.length / PER_PAGE);
  const pagedLogs  = filteredLogs.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  useEffect(() => setCurrentPage(1), [search, dateStart, dateEnd, statusFilter, classFilter, colSort]);

  const reset = () => { setRawSearch(''); setStatusFilter('all'); setClassFilter('all'); setDateStart(''); setDateEnd(''); setColSort({ key: 'timestamp', dir: 'desc' }); };

  /* Active chips */
  const chips = useMemo(() => {
    const list = [];
    if (rawSearch)              list.push({ label: `"${rawSearch}"`,    clear: () => setRawSearch('') });
    if (statusFilter !== 'all') list.push({ label: statusFilter,        clear: () => setStatusFilter('all') });
    if (classFilter  !== 'all') list.push({ label: classFilter,         clear: () => setClassFilter('all') });
    if (dateStart)              list.push({ label: `From ${dateStart}`, clear: () => setDateStart('') });
    if (dateEnd)                list.push({ label: `To ${dateEnd}`,     clear: () => setDateEnd('') });
    return list;
  }, [rawSearch, statusFilter, classFilter, dateStart, dateEnd]);

  const handleExport = async () => {
    if (exporting || !filteredLogs.length) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 200)); // let UI update
    exportToCSV(filteredLogs);
    onToast?.('success', 'Export ready', `${filteredLogs.length} records downloaded`);
    setExporting(false);
  };

  const formatTs = (ts) => {
    const d = parsePhTimestamp(ts);
    return d ? d.toLocaleString('en-PH', { timeZone: PH_TZ, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200 font-medium
    ${darkMode ? 'bg-white/[0.04] border-white/8 text-white placeholder-gray-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15' : 'bg-white border-gray-200 text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15'}`;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Attendance Logs</h2>
          <p className={`text-xs mt-0.5 font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {loading ? 'Loading…' : `${filteredLogs.length.toLocaleString()} of ${allLogs.length.toLocaleString()} records`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter button with chip count */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95
              ${showFilters
                ? darkMode ? 'bg-sky-500/10 border-sky-500/25 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
                : darkMode ? 'bg-white/[0.04] border-white/8 text-gray-300 hover:bg-white/7' : 'bg-white border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50'
              }`}
          >
            <Filter size={15} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            {!isMobile && 'Filters'}
            {chips.length > 0 && (
              <span className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)' }}>
                {chips.length}
              </span>
            )}
          </button>

          {chips.length > 0 && (
            <button onClick={reset}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95
                ${darkMode ? 'bg-white/[0.04] border-white/8 text-gray-300 hover:bg-white/7' : 'bg-white border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50'}`}>
              <X size={15} />{!isMobile && 'Reset'}
            </button>
          )}

          <button onClick={handleExport} disabled={!filteredLogs.length || exporting}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-sm shadow-emerald-500/25
              ${exporting ? 'opacity-60' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            style={exporting ? { background: '#10b981' } : {}}
          >
            {exporting ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />{!isMobile && 'Exporting…'}</> : <><Download size={15} />{!isMobile && 'Export'}</>}
          </button>
        </div>
      </div>

      {/* Active chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2" style={{ animation: 'logs-fade-in 0.2s ease-out both' }}>
          {chips.map((c, i) => <FilterChip key={i} label={c.label} onRemove={c.clear} darkMode={darkMode} />)}
        </div>
      )}

      {/* Filter panel */}
      <div className={`transition-all duration-400 overflow-hidden ${showFilters ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <Card darkMode={darkMode}>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Search</label>
                <div className="relative">
                  <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input value={rawSearch} onChange={e => setRawSearch(e.target.value)} placeholder="Name, ID, class…" className={`${inputCls} pl-8`} />
                  {rawSearch && (
                    <button onClick={() => setRawSearch('')} className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg ${darkMode ? 'hover:bg-white/8 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls}>
                  <option value="all">All Status</option><option value="IN">IN Only</option><option value="OUT">OUT Only</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Class</label>
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={inputCls}>
                  <option value="all">All Classes</option>
                  {uniqueClasses.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sort column</label>
                <select value={`${colSort.key}-${colSort.dir}`}
                  onChange={e => { const [k, d] = e.target.value.split('-'); setColSort({ key: k, dir: d }); }}
                  className={inputCls}
                >
                  <option value="timestamp-desc">Newest first</option>
                  <option value="timestamp-asc">Oldest first</option>
                  <option value="name-asc">Name A→Z</option>
                  <option value="name-desc">Name Z→A</option>
                  <option value="class-asc">Class A→Z</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>From</label>
                <input type="date" value={dateStart} max={today} onChange={e => setDateStart(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>To</label>
                <input type="date" value={dateEnd} min={dateStart} max={today} onChange={e => setDateEnd(e.target.value)} className={inputCls} />
              </div>
              <div className="flex items-end">
                <button onClick={() => { setDateStart(today); setDateEnd(today); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${darkMode ? 'border-white/8 text-gray-300 hover:bg-white/6' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  Today
                </button>
              </div>
              <div className="flex items-end">
                <button onClick={() => { const d = new Date(); d.setDate(d.getDate()-7); setDateStart(d.toLocaleDateString('en-CA',{timeZone:PH_TZ})); setDateEnd(today); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${darkMode ? 'border-white/8 text-gray-300 hover:bg-white/6' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  Last 7 days
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats summary */}
      {!loading && filteredLogs.length > 0 && (
        <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl border flex-wrap gap-y-2 ${darkMode ? 'bg-white/[0.03] border-white/6' : 'bg-slate-50 border-gray-200'}`}
          style={{ animation: 'logs-fade-in 0.25s ease-out both' }}>
          {[
            { Icon: Clock,     label: 'Total',   value: filteredLogs.length, color: darkMode?'text-gray-300':'text-gray-700' },
            { Icon: UserCheck, label: 'IN',       value: fStats.inCount,     color: 'text-emerald-500' },
            { Icon: UserX,     label: 'OUT',      value: fStats.outCount,    color: 'text-rose-500'    },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <s.Icon size={13} className={s.color} />
              <span className={`text-xs font-black tabular-nums ${s.color}`}>{s.value.toLocaleString()}</span>
              <span className={`text-xs font-semibold ${darkMode?'text-gray-500':'text-gray-400'}`}>{s.label}</span>
              {i < 2 && <span className={`text-xs ${darkMode?'text-gray-700':'text-gray-300'}`}>·</span>}
            </div>
          ))}
          <span className={`ml-auto text-xs font-semibold ${darkMode?'text-gray-600':'text-gray-400'}`}>
            Page {currentPage}/{totalPages || 1}
          </span>
        </div>
      )}

      {/* ── Main table card ── */}
      <Card darkMode={darkMode}>
        {loading ? (
          <div>
            {/* Skeleton header */}
            <div className={`flex gap-4 px-5 py-3.5 border-b ${darkMode?'border-white/6':'border-gray-100'}`}>
              {['22%','14%','28%','24%','12%'].map((w,i) => <Skeleton key={i} darkMode={darkMode} className="h-3 rounded" style={{width:w}} />)}
            </div>
            <TableSkeleton darkMode={darkMode} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No records match your filters"
            body="Try adjusting or clearing the active filters above."
            action={chips.length > 0 ? reset : undefined}
            actionLabel="Clear all filters"
            darkMode={darkMode}
          />
        ) : isMobile ? (
          /* Mobile card list */
          <div className={`divide-y ${darkMode?'divide-white/[0.04]':'divide-gray-50'}`}>
            {pagedLogs.map((log, i) => (
              <div key={i}
                className={`p-4 transition-colors duration-150 ${darkMode?'hover:bg-white/[0.03]':'hover:bg-slate-50'}`}
                style={{ animation: `logs-row-in 0.18s ease-out ${i * 12}ms both` }}
              >
                <div className="flex items-start justify-between mb-1.5 gap-2">
                  <p className={`text-sm font-bold truncate flex-1 min-w-0 ${darkMode?'text-white':'text-gray-900'}`}>{log.name}</p>
                  <StatusBadge status={log.status} />
                </div>
                <button onClick={() => copy(log.studentId)}
                  className={`text-xs font-mono flex items-center gap-1 mb-0.5 transition-colors ${darkMode?'text-gray-500 hover:text-sky-400':'text-gray-400 hover:text-sky-600'}`}>
                  {log.studentId}
                  {copied === log.studentId ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="opacity-50" />}
                </button>
                <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>{log.class} · {formatTs(log.timestamp)}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop table */
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{width:'22%'}} /><col style={{width:'14%'}} />
                <col style={{width:'28%'}} /><col style={{width:'24%'}} />
                <col style={{width:'12%'}} />
              </colgroup>
              <thead className={`sticky top-0 z-10 ${darkMode?'bg-[#0a0f1e]':'bg-white'}`}>
                <tr className={`border-b ${darkMode?'border-white/6':'border-gray-100'}`}>
                  {[
                    { label: 'Timestamp',  key: 'timestamp' },
                    { label: 'Student ID', key: null         },
                    { label: 'Name',       key: 'name'      },
                    { label: 'Class',      key: 'class'     },
                    { label: 'Status',     key: 'status'    },
                  ].map(({ label, key }, i) => (
                    <th key={i} className="px-5 py-3.5 text-left">
                      {key
                        ? <ColHeader label={label} sortKey={key} currentSort={colSort} onSort={handleColSort} darkMode={darkMode} />
                        : <span className={`text-xs font-black uppercase tracking-widest ${darkMode?'text-gray-600':'text-gray-400'}`}>{label}</span>
                      }
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode?'divide-white/[0.03]':'divide-gray-50/80'}`}>
                {pagedLogs.map((log, i) => (
                  <tr key={i}
                    className={`transition-colors duration-100 group ${darkMode?'hover:bg-white/[0.03]':'hover:bg-slate-50/80'}`}
                    style={{ animation: `logs-row-in 0.16s ease-out ${i * 10}ms both` }}
                  >
                    <td className={`px-5 py-3.5 text-sm font-medium overflow-hidden ${darkMode?'text-gray-300':'text-gray-600'}`}>
                      <span className="block truncate">{formatTs(log.timestamp)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm overflow-hidden">
                      <button onClick={() => copy(log.studentId)}
                        className={`flex items-center gap-1.5 font-mono w-full transition-colors ${darkMode?'text-gray-500 hover:text-sky-400':'text-gray-400 hover:text-sky-600'}`}
                        title="Click to copy ID">
                        <span className="truncate">{log.studentId}</span>
                        <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {copied === log.studentId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold overflow-hidden">
                      <span className={`block truncate ${darkMode?'text-white':'text-gray-900'}`} title={log.name}>{log.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm overflow-hidden">
                      <span className={`block truncate font-medium ${darkMode?'text-gray-400':'text-gray-500'}`}>{log.class}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filteredLogs.length > 0 && !loading && (
          <div className={`border-t px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 ${darkMode?'border-white/6':'border-gray-100'}`}>
            <p className={`text-xs font-semibold ${darkMode?'text-gray-600':'text-gray-400'}`}>
              Showing {((currentPage-1)*PER_PAGE)+1}–{Math.min(currentPage*PER_PAGE, filteredLogs.length)} of {filteredLogs.length.toLocaleString()}
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} darkMode={darkMode} />
          </div>
        )}
      </Card>

      <style jsx global>{`
        @keyframes logs-fade-in { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
        @keyframes logs-row-in  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}