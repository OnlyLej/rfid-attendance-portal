'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar, Users, User, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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

const getColorClasses = (color, darkMode, type = 'bg') => {
  const map = {
    green:  { dark: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }, light: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' } },
    blue:   { dark: { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },     light: { bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-100' } },
    purple: { dark: { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },  light: { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-100' } },
    orange: { dark: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },   light: { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' } },
  };
  const c = map[color] || map.blue;
  return darkMode ? c.dark[type] : c.light[type];
};

const Pagination = ({ currentPage, totalPages, onPageChange, darkMode }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) { if (i === 1 || i === totalPages || (i >= currentPage - delta && i < currentPage + delta + 1)) pages.push(i); }
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

const Card = ({ children, className = '', darkMode, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700/60' : 'bg-white border-gray-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)]'} border rounded-2xl backdrop-blur-sm transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>{children}</div>
  );
};

export default function ParentLogsTab({ darkMode, loading, logs: allLogs, userInfo, students, exportToCSV, childrenInfo, selectedChildId, setSelectedChildId }) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const today = getPhTodayStr();
  const hasMultipleChildren = childrenInfo.length > 1;

  const activeChildIds = useMemo(() => {
    if (!hasMultipleChildren || selectedChildId === 'all') return childrenInfo.map(c => normalizeId(c.studentId));
    return [normalizeId(selectedChildId)];
  }, [childrenInfo, selectedChildId, hasMultipleChildren]);

  const activeChildInfo = useMemo(() => {
    if (!hasMultipleChildren || selectedChildId === 'all') return null;
    return childrenInfo.find(c => normalizeId(c.studentId) === normalizeId(selectedChildId)) || null;
  }, [childrenInfo, selectedChildId, hasMultipleChildren]);

  const childLogs = useMemo(() => {
    if (!activeChildIds.length) return [];
    return allLogs.filter(l => l.studentId && activeChildIds.includes(normalizeId(l.studentId)));
  }, [allLogs, activeChildIds]);

  const activeStats = useMemo(() => {
    const todayPhStr = getPhTodayStr();
    const todayCl = childLogs.filter(l => getPhLocalDate(l.timestamp) === todayPhStr);
    const uniqueDays = new Set(childLogs.map(l => getPhLocalDate(l.timestamp)).filter(Boolean));
    const daysIn = new Set(childLogs.filter(l => l.status === 'IN').map(l => getPhLocalDate(l.timestamp)).filter(Boolean));
    return { totalLogs: childLogs.length, todayLogs: todayCl.length, attendanceRate: uniqueDays.size > 0 ? Math.round((daysIn.size / uniqueDays.size) * 100) : 0 };
  }, [childLogs]);

  const filteredLogs = useMemo(() => {
    let f = [...childLogs];
    if (search) { const q = search.toLowerCase(); f = f.filter(l => l.name?.toLowerCase().includes(q) || l.class?.toLowerCase().includes(q) || normalizeId(l.studentId).includes(q)); }
    if (dateStart) f = f.filter(l => getPhLocalDate(l.timestamp) >= dateStart);
    if (dateEnd)   f = f.filter(l => getPhLocalDate(l.timestamp) <= dateEnd);
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    f.sort((a, b) => { const da = parsePhTimestamp(a.timestamp); const db = parsePhTimestamp(b.timestamp); return sortOrder === 'newest' ? (db?.getTime() ?? 0) - (da?.getTime() ?? 0) : (da?.getTime() ?? 0) - (db?.getTime() ?? 0); });
    return f;
  }, [childLogs, search, dateStart, dateEnd, statusFilter, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((currentPage-1)*LOGS_PER_PAGE, currentPage*LOGS_PER_PAGE);
  useEffect(() => setCurrentPage(1), [search, dateStart, dateEnd, statusFilter, sortOrder, selectedChildId]);

  const selectCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200 ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-white border-gray-200 text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

  const formatDate = (ts) => { const d = parsePhTimestamp(ts); return d ? d.toLocaleDateString('en-PH', { timeZone: PH_TZ, weekday: 'short', month: 'short', day: 'numeric' }) : '—'; };
  const formatTime = (ts) => { const d = parsePhTimestamp(ts); return d ? d.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit' }) : '—'; };

  const handleExport = () => {
    const suffix = activeChildInfo ? `_${activeChildInfo.name.replace(/\s+/g, '_')}` : '_all_children';
    exportToCSV(filteredLogs, suffix);
  };

  return (
    <div className="space-y-5">
      <Card darkMode={darkMode} delay={0}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{userInfo?.fullName ? `Welcome, ${userInfo.fullName.split(' ')[0]}!` : 'Parent Portal'}</h2>
              {childrenInfo.length > 0 && (
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {hasMultipleChildren ? `Tracking ${childrenInfo.length} children` : <>Tracking: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{childrenInfo[0]?.name}</span> · {childrenInfo[0]?.class}</>}
                </p>
              )}
            </div>
            <button onClick={handleExport} disabled={filteredLogs.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0 shadow-sm shadow-emerald-500/25">
              <Download size={15} />{!isMobile && 'Export'}
            </button>
          </div>

          {hasMultipleChildren && (
            <div className="mb-4">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>View records for:</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedChildId('all')} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 hover:scale-105 active:scale-95 ${selectedChildId === 'all' ? 'bg-sky-500 border-sky-500 text-white shadow-sm shadow-sky-500/25' : darkMode ? 'border-gray-600 text-gray-300 hover:border-sky-500 hover:text-sky-400' : 'border-gray-200 text-gray-600 hover:border-sky-400 hover:text-sky-600'}`}>
                  <Users size={12} />All Children
                </button>
                {childrenInfo.map((child, i) => {
                  const isActive = normalizeId(selectedChildId) === normalizeId(child.studentId);
                  const gradients = [['#34d399','#14b8a6'],['#a78bfa','#a855f7'],['#fbbf24','#f97316'],['#fb7185','#ec4899']];
                  const [c1, c2] = gradients[i % gradients.length];
                  return (
                    <button key={child.studentId} onClick={() => setSelectedChildId(child.studentId)} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 hover:scale-105 active:scale-95 ${isActive ? 'text-white border-transparent shadow-sm' : darkMode ? 'border-gray-600 text-gray-300 hover:border-gray-400 bg-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`} style={isActive ? { background: `linear-gradient(135deg, ${c1}, ${c2})` } : {}}>
                      <User size={12} />
                      <span className="max-w-[120px] truncate" title={child.name}>{child.name.split(' ')[0]}</span>
                      {isActive && <span className="bg-white/25 px-1.5 py-0.5 rounded-full text-[10px]">{child.class}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(activeChildInfo || (!hasMultipleChildren && childrenInfo[0])) && (() => {
            const child = activeChildInfo || childrenInfo[0];
            return (
              <div className={`rounded-xl p-3.5 border mb-4 ${darkMode ? 'bg-gray-700/40 border-gray-600/40' : 'bg-slate-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0"><User size={16} className="text-white" /></div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`} title={child.name}>{child.name}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><span className="font-mono">{child.studentId}</span> · {child.class}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {childrenInfo.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: hasMultipleChildren && selectedChildId === 'all' ? 'Children Tracked' : 'Student ID', value: hasMultipleChildren && selectedChildId === 'all' ? childrenInfo.length : (activeChildInfo || childrenInfo[0])?.studentId, color: 'blue' },
                { label: "Today's Logs", value: activeStats.todayLogs, color: 'green' },
                { label: 'Total Records', value: activeStats.totalLogs, color: 'purple' },
                { label: 'Attendance Rate', value: `${activeStats.attendanceRate}%`, color: 'orange' },
              ].map((s, i) => (
                <div key={i} className={`${getColorClasses(s.color, darkMode, 'bg')} border ${getColorClasses(s.color, darkMode, 'border')} rounded-xl p-3.5 transition-all duration-200 hover:scale-105 cursor-default`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${getColorClasses(s.color, darkMode, 'text')} mb-1`}>{s.label}</p>
                  <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} truncate`} title={String(s.value)}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card darkMode={darkMode} delay={100}>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Search</label>
              <div className="relative">
                <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, ID, class…" className={`${selectCls} pl-8`} />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}><option value="all">All</option><option value="IN">IN</option><option value="OUT">OUT</option></select>
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>From</label>
              <input type="date" value={dateStart} max={today} onChange={e => setDateStart(e.target.value)} className={selectCls} />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>To</label>
              <input type="date" value={dateEnd} min={dateStart} max={today} onChange={e => setDateEnd(e.target.value)} className={selectCls} />
            </div>
          </div>
        </div>
      </Card>

      <Card darkMode={darkMode} delay={150}>
        {(loading || (!childrenInfo.length && !students.length)) ? (
          <div className="p-12 text-center"><div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto animate-pulse"><Search size={20} className="text-sky-500" /></div></div>
        ) : childrenInfo.length === 0 ? (
          <div className="p-12 text-center">
            <User size={28} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No children linked to this account</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Contact your administrator to link students to your account.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar size={28} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No records found</p>
          </div>
        ) : (
          <>
            <div className={`divide-y ${darkMode ? 'divide-gray-700/40' : 'divide-gray-50'}`}>
              {pagedLogs.map((log, i) => (
                <div key={i} className={`px-5 py-4 flex items-center gap-4 transition-colors duration-150 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-slate-50'}`}>
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>{log.status}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatDate(log.timestamp)}</p>
                      {hasMultipleChildren && selectedChildId === 'all' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`} title={log.studentId}>
                          {(() => { const child = childrenInfo.find(c => normalizeId(c.studentId) === normalizeId(log.studentId)); return child ? child.name.split(' ')[0] : log.studentId; })()}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{log.class}</p>
                  </div>
                  <p className={`text-sm font-medium flex-shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatTime(log.timestamp)}</p>
                </div>
              ))}
            </div>
            <div className={`border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3`}>
              <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Showing {((currentPage-1)*LOGS_PER_PAGE)+1}–{Math.min(currentPage*LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}</p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} darkMode={darkMode} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}