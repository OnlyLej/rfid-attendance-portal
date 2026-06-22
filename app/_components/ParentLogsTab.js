'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar, Users, User, Search, Download,
  Copy, Check, Flame, X,
} from 'lucide-react';
import { normalizeId, parsePhTimestamp, getPhTodayStr, getPhLocalDate, formatLocalDateTime, formatLocalDate, formatLocalTime } from '../_lib/data';
import {
  Card, Skeleton, FilterChip, StatusBadge, EmptyState, Pagination,
} from './ui';

const PH_TZ    = 'Asia/Manila';
const PER_PAGE = 20;

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerWidth < 768);
    c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c);
  }, []);
  return m;
}

function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = useCallback((text) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(text); setTimeout(() => setCopied(null), 1500); });
  }, []);
  return [copied, copy];
}

/* ── Color token helper ── */
const CT = {
  green:  { dark: { bg:'bg-emerald-500/10',text:'text-emerald-400',border:'border-emerald-500/15' }, light:{bg:'bg-emerald-50',text:'text-emerald-600',border:'border-emerald-100'} },
  blue:   { dark: { bg:'bg-sky-500/10',    text:'text-sky-400',    border:'border-sky-500/15'     }, light:{bg:'bg-sky-50',    text:'text-sky-600',    border:'border-sky-100'    } },
  purple: { dark: { bg:'bg-violet-500/10', text:'text-violet-400', border:'border-violet-500/15'  }, light:{bg:'bg-violet-50', text:'text-violet-600', border:'border-violet-100' } },
  orange: { dark: { bg:'bg-amber-500/10',  text:'text-amber-400',  border:'border-amber-500/15'   }, light:{bg:'bg-amber-50',  text:'text-amber-600',  border:'border-amber-100'  } },
};
const gc = (c, dark, t) => { const m = CT[c]||CT.blue; return dark?m.dark[t]:m.light[t]; };

/* ── Attendance streak ── */
function calcStreak(logs, studentId) {
  const nid = normalizeId(studentId);
  const days = [...new Set(
    logs.filter(l => l.studentId && normalizeId(l.studentId) === nid && l.status === 'IN' && l.timestamp)
      .map(l => getPhLocalDate(l.timestamp)).filter(Boolean)
  )].sort().reverse();
  const today = getPhTodayStr();
  const yest  = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toLocaleDateString('en-CA'); })();
  let streak = 0;
  let expected = days[0]===today ? today : days[0]===yest ? yest : null;
  for (const d of days) {
    if (d === expected) { streak++; const nd = new Date(expected); nd.setDate(nd.getDate()-1); expected = nd.toLocaleDateString('en-CA'); }
    else break;
  }
  return streak;
}

/* ── Today status for a child ── */
function useTodayStatus(logs, studentId) {
  return useMemo(() => {
    if (!studentId) return 'absent';
    const today = getPhTodayStr();
    const nid = normalizeId(studentId);
    const tl = logs
      .filter(l => l.studentId && normalizeId(l.studentId)===nid && l.timestamp && getPhLocalDate(l.timestamp)===today)
      .sort((a,b)=>(parsePhTimestamp(a.timestamp)?.getTime()??0)-(parsePhTimestamp(b.timestamp)?.getTime()??0));
    if (!tl.length) return 'absent';
    return tl[tl.length-1].status === 'IN' ? 'in' : 'out';
  }, [logs, studentId]);
}

/* ── Today status badge ── */
function TodayBadge({ status, darkMode }) {
  const map = {
    in:     { label:'IN',     cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', dot:'bg-emerald-500'  },
    out:    { label:'OUT',    cls: 'bg-rose-500/10 text-rose-600 border-rose-500/20',           dot:'bg-rose-500' },
    absent: { label:'Absent', cls: darkMode?'bg-white/5 text-gray-400 border-white/8':'bg-gray-50 text-gray-500 border-gray-200', dot:'bg-gray-400' },
  };
  const cfg = map[status] || map.absent;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold border ${cfg.cls}`}>
      <span className={`relative w-1.5 h-1.5 rounded-full ${cfg.dot}`}>
      </span>
      Today: {cfg.label}
    </span>
  );
}

/* ── Skeleton for welcome card ── */
function WelcomeSkeleton({ darkMode }) {
  return (
    <Card darkMode={darkMode}>
      <div className="p-5 space-y-4">
        <div className="flex justify-between"><Skeleton darkMode={darkMode} className="h-6 w-40 rounded-lg" /><Skeleton darkMode={darkMode} className="h-8 w-20 rounded-xl" /></div>
        <Skeleton darkMode={darkMode} className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[0,1,2,3].map(i=><Skeleton key={i} darkMode={darkMode} className="h-16 rounded-2xl"/>)}</div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
export default function ParentLogsTab({
  darkMode, loading, logs: allLogs, userInfo, students,
  exportToCSV, childrenInfo, selectedChildId, setSelectedChildId,
  onToast,
}) {
  const isMobile = useIsMobile();
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateStart,    setDateStart]    = useState('');
  const [dateEnd,      setDateEnd]      = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [exporting,    setExporting]    = useState(false);
  const [copied,       copy]            = useCopy();

  const today = getPhTodayStr();
  const hasMulti = childrenInfo.length > 1;

  const activeIds = useMemo(() => {
    if (!hasMulti || selectedChildId === 'all') return childrenInfo.map(c => normalizeId(c.studentId));
    return [normalizeId(selectedChildId)];
  }, [childrenInfo, selectedChildId, hasMulti]);

  const activeChild = useMemo(() => {
    if (!hasMulti || selectedChildId === 'all') return null;
    return childrenInfo.find(c => normalizeId(c.studentId) === normalizeId(selectedChildId)) || null;
  }, [childrenInfo, selectedChildId, hasMulti]);

  const singleChild = !hasMulti ? childrenInfo[0] : null;

  const childLogs = useMemo(() => {
    if (!activeIds.length) return [];
    return allLogs.filter(l => l.studentId && activeIds.includes(normalizeId(l.studentId)));
  }, [allLogs, activeIds]);

  const statsData = useMemo(() => {
    const todayCl  = childLogs.filter(l => getPhLocalDate(l.timestamp) === today);
    const uDays    = new Set(childLogs.map(l => getPhLocalDate(l.timestamp)).filter(Boolean));
    const dIn      = new Set(childLogs.filter(l => l.status==='IN').map(l=>getPhLocalDate(l.timestamp)).filter(Boolean));
    return { total:childLogs.length, today:todayCl.length, days:dIn.size, rate:uDays.size>0?Math.round((dIn.size/uDays.size)*100):0 };
  }, [childLogs, today]);

  // Per-child streaks
  const streaks = useMemo(() => {
    const r = {};
    childrenInfo.forEach(c => { r[normalizeId(c.studentId)] = calcStreak(allLogs, c.studentId); });
    return r;
  }, [allLogs, childrenInfo]);

  const singleStatus = useTodayStatus(allLogs, (activeChild || singleChild)?.studentId);

  const filteredLogs = useMemo(() => {
    let f = [...childLogs];
    if (search) { const q=search.toLowerCase(); f=f.filter(l=>l.name?.toLowerCase().includes(q)||l.class?.toLowerCase().includes(q)||normalizeId(l.studentId).includes(q)); }
    if (dateStart)              f=f.filter(l=>getPhLocalDate(l.timestamp)>=dateStart);
    if (dateEnd)                f=f.filter(l=>getPhLocalDate(l.timestamp)<=dateEnd);
    if (statusFilter!=='all')   f=f.filter(l=>l.status===statusFilter);
    f.sort((a,b)=>(parsePhTimestamp(b.timestamp)?.getTime()??0)-(parsePhTimestamp(a.timestamp)?.getTime()??0));
    return f;
  }, [childLogs, search, dateStart, dateEnd, statusFilter]);

  const totalPages = Math.ceil(filteredLogs.length / PER_PAGE);
  const pagedLogs  = filteredLogs.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);
  useEffect(() => setCurrentPage(1), [search, dateStart, dateEnd, statusFilter, selectedChildId]);

  const chips = useMemo(() => {
    const list = [];
    if (search)               list.push({ label:`"${search}"`,    clear:()=>setSearch('') });
    if (statusFilter!=='all') list.push({ label:statusFilter,     clear:()=>setStatusFilter('all') });
    if (dateStart)            list.push({ label:`From ${dateStart}`, clear:()=>setDateStart('') });
    if (dateEnd)              list.push({ label:`To ${dateEnd}`,  clear:()=>setDateEnd('') });
    return list;
  }, [search, statusFilter, dateStart, dateEnd]);

  const handleExport = async () => {
    if (exporting || !filteredLogs.length) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 180));
    const suf = activeChild ? `_${activeChild.name.replace(/\s+/g,'_')}` : '_all_children';
    exportToCSV(filteredLogs, suf);
    onToast?.('success', 'Export ready', `${filteredLogs.length} records downloaded`);
    setExporting(false);
  };

  const fmt = (ts, type) => {
    if (type === 'date') return formatLocalDate(ts);
    if (type === 'time') return formatLocalTime(ts);
    return formatLocalDateTime(ts);
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200 font-medium
    ${darkMode?'bg-white/[0.04] border-white/8 text-white placeholder-gray-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15':'bg-white border-gray-200 text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15'}`;

  const childGrads = [['#34d399','#14b8a6'],['#a78bfa','#a855f7'],['#fbbf24','#f97316'],['#fb7185','#ec4899']];

  if (loading && !allLogs.length) return (
    <div className="space-y-5">
      <WelcomeSkeleton darkMode={darkMode} />
      <Card darkMode={darkMode}><div className="p-4 space-y-3">{[1,2,3,4].map(i=><Skeleton key={i} darkMode={darkMode} className="h-8 rounded-xl"/>)}</div></Card>
      <Card darkMode={darkMode}><div className="p-4">{Array.from({length:8}).map((_,i)=><Skeleton key={i} darkMode={darkMode} className="h-12 rounded-xl mb-2"/>)}</div></Card>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Welcome card ── */}
      <Card darkMode={darkMode}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h2 className={`text-xl font-black tracking-tight ${darkMode?'text-white':'text-gray-900'}`}>
                {userInfo?.fullName ? `Welcome, ${userInfo.fullName.split(' ')[0]}!` : 'Parent Portal'}
              </h2>
              {childrenInfo.length > 0 && (
                <p className={`text-sm mt-0.5 font-semibold ${darkMode?'text-gray-400':'text-gray-500'}`}>
                  {hasMulti
                    ? `Tracking ${childrenInfo.length} children`
                    : <>Tracking: <span className={`font-black ${darkMode?'text-white':'text-gray-900'}`}>{childrenInfo[0]?.name}</span> · {childrenInfo[0]?.class}</>
                  }
                </p>
              )}
            </div>
            <button onClick={handleExport} disabled={!filteredLogs.length || exporting}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0 shadow-sm shadow-emerald-500/25
                ${exporting?'opacity-60':''}`}
              style={{ background: '#10b981' }}>
              {exporting ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Download size={15} />}
              {!isMobile && (exporting ? 'Exporting…' : 'Export')}
            </button>
          </div>

          {/* Multi-child picker */}
          {hasMulti && (
            <div className="mb-4">
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${darkMode?'text-gray-600':'text-gray-400'}`}>Select child:</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedChildId('all')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95
                    ${selectedChildId==='all' ? 'text-white border-transparent shadow-sm shadow-sky-500/25' : darkMode?'border-white/8 text-gray-300 hover:border-white/16':'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  style={selectedChildId==='all' ? {background:'#0ea5e9'} : {}}
                >
                  <Users size={12} /> All
                </button>
                {childrenInfo.map((child, i) => {
                  const isActive = normalizeId(selectedChildId) === normalizeId(child.studentId);
                  const [c1, c2] = childGrads[i % childGrads.length];
                  const streak   = streaks[normalizeId(child.studentId)] || 0;
                  return (
                    <button key={child.studentId} onClick={() => setSelectedChildId(child.studentId)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95
                        ${isActive?'text-white border-transparent shadow-sm':darkMode?'border-white/8 text-gray-300 hover:border-white/16':'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      style={isActive?{background:`linear-gradient(135deg,${c1},${c2})`}:{}}
                    >
                      <User size={12} />
                      <span className="max-w-[100px] truncate">{child.name}</span>
                      {streak >= 3 && <span className="flex items-center gap-0.5"><Flame size={10} className="text-orange-400"/>{streak}</span>}
                      {isActive && <span className="bg-white/25 px-1.5 py-0.5 rounded-full text-[10px] font-black">{child.class}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active child info */}
          {(activeChild || singleChild) && (() => {
            const ch = activeChild || singleChild;
            const streak = streaks[normalizeId(ch.studentId)] || 0;
            return (
              <div className={`rounded-2xl p-4 border mb-4 ${darkMode?'bg-white/[0.03] border-white/6':'bg-slate-50 border-gray-100'}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#0ea5e9' }}>
                    <User size={17} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-black truncate ${darkMode?'text-white':'text-gray-900'}`}>{ch.name}</p>
                      <TodayBadge status={singleStatus} darkMode={darkMode} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <button onClick={() => copy(ch.studentId)}
                        className={`text-xs font-mono flex items-center gap-1 transition-colors ${darkMode?'text-gray-500 hover:text-sky-400':'text-gray-400 hover:text-sky-600'}`}>
                        {ch.studentId}
                        {copied===ch.studentId ? <Check size={10} className="text-emerald-500"/> : <Copy size={10} className="opacity-60"/>}
                      </button>
                      <span className={`text-xs font-semibold ${darkMode?'text-gray-500':'text-gray-400'}`}>· {ch.class}</span>
                    </div>
                  </div>
                  {streak > 0 && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border
                      ${streak>=5 ? darkMode?'bg-orange-500/10 border-orange-500/20 text-orange-400':'bg-orange-50 border-orange-100 text-orange-600'
                        : darkMode?'bg-white/[0.04] border-white/8 text-gray-400':'bg-gray-50 border-gray-100 text-gray-500'}`}>
                      <Flame size={12} className={streak>=5?'text-orange-500':''} />
                      {streak}d streak
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Stat chips */}
          {childrenInfo.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: hasMulti && selectedChildId==='all' ? 'Children' : 'Student ID', value: hasMulti && selectedChildId==='all' ? childrenInfo.length : (activeChild||childrenInfo[0])?.studentId, color:'blue'   },
                { label:"Today's Logs",   value: statsData.today, color:'green'  },
                { label:'Days Present',   value: statsData.days,  color:'purple' },
                { label:'Attendance Rate',value:`${statsData.rate}%`, color:'orange' },
              ].map((s, i) => (
                <div key={i}
                  className={`${gc(s.color,darkMode,'bg')} border ${gc(s.color,darkMode,'border')} rounded-2xl p-3.5 transition-all hover:-translate-y-0.5 cursor-default`}
                  style={{ animation:`parent-stat-in 0.3s ease-out ${i*55}ms both` }}
                >
                  <p className={`text-[10px] font-black uppercase tracking-widest ${gc(s.color,darkMode,'text')} mb-1`}>{s.label}</p>
                  <p className={`text-xl font-black truncate ${darkMode?'text-white':'text-gray-900'}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── Filters ── */}
      <Card darkMode={darkMode}>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode?'text-gray-600':'text-gray-400'}`}>Search</label>
              <div className="relative">
                <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode?'text-gray-500':'text-gray-400'}`} />
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, ID, class…" className={`${inputCls} pl-8`} />
                {search && <button onClick={()=>setSearch('')} className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg ${darkMode?'hover:bg-white/8 text-gray-500':'hover:bg-gray-100 text-gray-400'}`}><X size={12}/></button>}
              </div>
            </div>
            <div>
              <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode?'text-gray-600':'text-gray-400'}`}>Status</label>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className={inputCls}>
                <option value="all">All</option><option value="IN">IN</option><option value="OUT">OUT</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode?'text-gray-600':'text-gray-400'}`}>From</label>
              <input type="date" value={dateStart} max={today} onChange={e=>setDateStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode?'text-gray-600':'text-gray-400'}`}>To</label>
              <input type="date" value={dateEnd} min={dateStart} max={today} onChange={e=>setDateEnd(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Date presets */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { label:'Today',       action:()=>{ setDateStart(today); setDateEnd(today); } },
              { label:'This week',   action:()=>{ const d=new Date(); d.setDate(d.getDate()-7); setDateStart(d.toLocaleDateString('en-CA')); setDateEnd(today); } },
              { label:'This month',  action:()=>{ const d=new Date(); setDateStart(new Date(d.getFullYear(),d.getMonth(),1).toLocaleDateString('en-CA')); setDateEnd(today); } },
              { label:'Clear dates', action:()=>{ setDateStart(''); setDateEnd(''); } },
            ].map(p=>(
              <button key={p.label} onClick={p.action}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${darkMode?'border-white/8 text-gray-400 hover:bg-white/6':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Active chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {chips.map((c,i)=><FilterChip key={i} label={c.label} onRemove={c.clear} darkMode={darkMode}/>)}
            </div>
          )}
        </div>
      </Card>

      {/* ── Logs list ── */}
      <Card darkMode={darkMode}>
        {!childrenInfo.length ? (
          <EmptyState icon={User} title="No children linked" body="Contact your administrator to link students to your account." darkMode={darkMode} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState icon={Calendar} title="No records found" body="Try adjusting the filters above." darkMode={darkMode} />
        ) : (
          <>
            <div className={`divide-y ${darkMode?'divide-white/[0.04]':'divide-gray-50'}`}>
              {pagedLogs.map((log, i) => (
                <div key={i}
                  className={`px-5 py-4 flex items-center gap-4 transition-colors duration-150 ${darkMode?'hover:bg-white/[0.03]':'hover:bg-slate-50'}`}
                  style={{ animation:`parent-row-in 0.18s ease-out ${i*10}ms both` }}
                >
                  <StatusBadge status={log.status} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-black ${darkMode?'text-white':'text-gray-900'}`}>{fmt(log.timestamp,'date')}</p>
                      {hasMulti && selectedChildId==='all' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${darkMode?'bg-white/6 border-white/10 text-gray-300':'bg-gray-100 border-gray-200 text-gray-600'}`}>
                          {(() => { const c=childrenInfo.find(c=>normalizeId(c.studentId)===normalizeId(log.studentId)); return c?c.name:log.studentId; })()}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 font-semibold ${darkMode?'text-gray-500':'text-gray-400'}`}>{log.class}</p>
                  </div>

                  <p className={`text-sm font-bold flex-shrink-0 tabular-nums ${darkMode?'text-gray-300':'text-gray-600'}`}>{fmt(log.timestamp,'time')}</p>
                </div>
              ))}
            </div>

            <div className={`border-t px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 ${darkMode?'border-white/6':'border-gray-100'}`}>
              <p className={`text-xs font-semibold ${darkMode?'text-gray-600':'text-gray-400'}`}>
                Showing {((currentPage-1)*PER_PAGE)+1}–{Math.min(currentPage*PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
              </p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} darkMode={darkMode} />
            </div>
          </>
        )}
      </Card>

      <style jsx global>{`
        @keyframes parent-stat-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes parent-row-in  { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}
