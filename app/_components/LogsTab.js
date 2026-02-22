'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, X, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { normalizeId, parsePhTimestamp, getPhTodayStr, getPhLocalDate } from '../_lib/data';

const PH_TZ = 'Asia/Manila';
const LOGS_PER_PAGE = 20;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const Pagination = ({ currentPage, totalPages, onPageChange, darkMode }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;
  for (let i = 1; i <= totalPages; i++) { if (i === 1 || i === totalPages || (i >= left && i < right)) pages.push(i); }
  const withEllipsis = [];
  let prev = null;
  for (const p of pages) { if (prev && p - prev > 1) withEllipsis.push('...'); withEllipsis.push(p); prev = p; }
  const btn = `inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200`;
  const active = darkMode ? 'bg-sky-600 text-white shadow-sm' : 'bg-sky-500 text-white shadow-sm';
  const inactive = darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100';
  const nav = darkMode ? 'text-gray-400 hover:bg-gray-700 disabled:opacity-30' : 'text-gray-500 hover:bg-gray-100 disabled:opacity-30';
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`${btn} ${nav}`}><ChevronLeft size={16} /></button>
      {withEllipsis.map((p, i) => p === '...' ? <span key={i} className={`${btn} cursor-default ${inactive}`}>…</span> : <button key={i} onClick={() => onPageChange(p)} className={`${btn} ${currentPage === p ? active : inactive}`}>{p}</button>)}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`${btn} ${nav}`}><ChevronRight size={16} /></button>
    </div>
  );
};

const PulseLoader = ({ darkMode, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  return (
    <div className="relative flex items-center justify-center">
      <div className={`${sz} rounded-full border-2 border-sky-500/30 animate-ping absolute`} />
      <div className={`${sz} rounded-full border-2 border-sky-500/60 animate-ping absolute`} style={{ animationDelay: '0.2s', animationDuration: '1.4s' }} />
      <div className={`${sz} rounded-full bg-sky-500/20 flex items-center justify-center`}><Search size={size === 'lg' ? 20 : 14} className="text-sky-500 animate-pulse" /></div>
    </div>
  );
};

const Card = ({ children, className = '', darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700/60' : 'bg-white border-gray-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)]'} border rounded-2xl backdrop-blur-sm ${className}`}>{children}</div>
);

export default function LogsTab({ darkMode, loading, logs: allLogs, exportToCSV }) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [currentPage, setCurrentPage] = useState(1);

  const today = getPhTodayStr();
  const uniqueClasses = useMemo(() => [...new Set(allLogs.map(l => l.class))].sort(), [allLogs]);

  const filteredLogs = useMemo(() => {
    let f = [...allLogs];
    if (search) { const q = search.toLowerCase(); f = f.filter(l => normalizeId(l.studentId).includes(q) || l.name?.toLowerCase().includes(q) || l.class?.toLowerCase().includes(q)); }
    if (dateStart) f = f.filter(l => getPhLocalDate(l.timestamp) >= dateStart);
    if (dateEnd)   f = f.filter(l => getPhLocalDate(l.timestamp) <= dateEnd);
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    if (classFilter  !== 'all') f = f.filter(l => l.class === classFilter);
    f.sort((a, b) => { const da = parsePhTimestamp(a.timestamp); const db = parsePhTimestamp(b.timestamp); return sortOrder === 'newest' ? (db?.getTime() ?? 0) - (da?.getTime() ?? 0) : (da?.getTime() ?? 0) - (db?.getTime() ?? 0); });
    return f;
  }, [allLogs, search, dateStart, dateEnd, statusFilter, classFilter, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);
  useEffect(() => setCurrentPage(1), [search, dateStart, dateEnd, statusFilter, classFilter, sortOrder]);
  const reset = () => { setSearch(''); setSortOrder('newest'); setStatusFilter('all'); setClassFilter('all'); setDateStart(''); setDateEnd(''); };

  const selectCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200 ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-white border-gray-200 text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

  const formatTs = (ts) => {
    const d = parsePhTimestamp(ts);
    if (!d) return '—';
    return d.toLocaleString('en-PH', { timeZone: PH_TZ, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Attendance Logs</h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{filteredLogs.length.toLocaleString()} of {allLogs.length.toLocaleString()} records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}>
            <Filter size={15} className={showFilters ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
            {!isMobile && 'Filters'}
          </button>
          <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}>
            <X size={15} />{!isMobile && 'Reset'}
          </button>
          <button onClick={() => exportToCSV(filteredLogs)} disabled={filteredLogs.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all duration-200 hover:scale-105 disabled:opacity-40 shadow-sm shadow-emerald-500/25">
            <Download size={15} />{!isMobile && 'Export'}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-500 overflow-hidden ${showFilters ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <Card darkMode={darkMode}>
          <div className="p-4 space-y-4 overflow-x-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Search</label>
                <div className="relative">
                  <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, ID, class…" className={`${selectCls} pl-8`} />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
                  <option value="all">All Status</option><option value="IN">IN Only</option><option value="OUT">OUT Only</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Class</label>
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={selectCls}>
                  <option value="all">All Classes</option>
                  {uniqueClasses.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sort</label>
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={selectCls}>
                  <option value="newest">Newest First</option><option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>From</label>
                <input type="date" value={dateStart} max={today} onChange={e => setDateStart(e.target.value)} className={selectCls} />
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>To</label>
                <input type="date" value={dateEnd} min={dateStart} max={today} onChange={e => setDateEnd(e.target.value)} className={selectCls} />
              </div>
              <div className="flex items-end">
                <button onClick={() => { setDateStart(today); setDateEnd(today); }} className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Today</button>
              </div>
              <div className="flex items-end">
                <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); setDateStart(d.toLocaleDateString('en-CA', { timeZone: PH_TZ })); setDateEnd(today); }} className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Last 7 days</button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card darkMode={darkMode}>
        {loading ? (
          <div className="p-12 text-center"><PulseLoader darkMode={darkMode} size="lg" /><p className={`text-sm mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading records…</p></div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={28} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No records match your filters</p>
            <button onClick={reset} className="mt-3 text-sm text-sky-500 hover:text-sky-600">Clear filters</button>
          </div>
        ) : isMobile ? (
          <div className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
            {pagedLogs.map((log, i) => (
              <div key={i} className={`p-4 transition-colors duration-150 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between mb-1 gap-2">
                  <p className={`text-sm font-semibold truncate flex-1 min-w-0 ${darkMode ? 'text-white' : 'text-gray-800'}`} title={log.name}>{log.name}</p>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{log.status}</span>
                </div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.studentId} · {log.class}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatTs(log.timestamp)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup><col style={{ width: '22%' }} /><col style={{ width: '14%' }} /><col style={{ width: '30%' }} /><col style={{ width: '22%' }} /><col style={{ width: '12%' }} /></colgroup>
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  {['Timestamp (PH Time)', 'Student ID', 'Name', 'Class', 'Status'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700/40' : 'divide-gray-50'}`}>
                {pagedLogs.map((log, i) => (
                  <tr key={i} className={`transition-colors duration-100 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-slate-50/80'}`}>
                    <td className={`px-5 py-3.5 text-sm overflow-hidden ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}><span className="block truncate">{formatTs(log.timestamp)}</span></td>
                    <td className={`px-5 py-3.5 text-sm font-mono overflow-hidden ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><span className="block truncate" title={log.studentId}>{log.studentId}</span></td>
                    <td className="px-5 py-3.5 text-sm font-semibold overflow-hidden"><span className={`block truncate ${darkMode ? 'text-white' : 'text-gray-800'}`} title={log.name}>{log.name}</span></td>
                    <td className="px-5 py-3.5 text-sm overflow-hidden"><span className={`block truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={log.class}>{log.class}</span></td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredLogs.length > 0 && (
          <div className={`border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Showing {((currentPage-1)*LOGS_PER_PAGE)+1}–{Math.min(currentPage*LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}</p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} darkMode={darkMode} />
          </div>
        )}
      </Card>
    </div>
  );
}