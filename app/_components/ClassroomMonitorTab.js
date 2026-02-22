'use client';

import { useMemo, useCallback, useState } from 'react';
import { Search, X, ChevronDown, User } from 'lucide-react';
import { normalizeId, parsePhTimestamp, getPhTodayStr, getPhLocalDate } from '../_lib/data';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  if (typeof window !== 'undefined') {
    // handled by effect in parent, but we do a simple check here
  }
  return isMobile;
}

export default function ClassroomMonitorTab({ darkMode, students, classes, searchQuery, setSearchQuery, selectedClass, setSelectedClass, logs }) {
  const getStudentTodayStatus = useCallback((studentId) => {
    const todayPhStr = getPhTodayStr();
    const nid = normalizeId(studentId);
    const todayLogs = logs
      .filter(l => {
        if (!l.timestamp || !l.studentId) return false;
        if (normalizeId(l.studentId) !== nid) return false;
        return getPhLocalDate(l.timestamp) === todayPhStr;
      })
      .slice()
      .sort((a, b) => {
        const da = parsePhTimestamp(a.timestamp);
        const db = parsePhTimestamp(b.timestamp);
        return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
      });
    if (!todayLogs.length) return 'no-log';
    return todayLogs[todayLogs.length - 1].status === 'IN' ? 'in' : 'out';
  }, [logs]);

  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter(cn => {
      if (cn.toLowerCase().includes(q)) return true;
      return students.filter(s => s.class === cn).some(s =>
        s.name.toLowerCase().includes(q) || normalizeId(s.studentId).includes(q)
      );
    });
  }, [classes, students, searchQuery]);

  const getFilteredStudents = (cn) => {
    const cs = students.filter(s => s.class === cn);
    if (!searchQuery) return cs;
    const q = searchQuery.toLowerCase();
    return cs.filter(s => s.name.toLowerCase().includes(q) || normalizeId(s.studentId).includes(q));
  };

  const statusConfig = {
    'in':     { dot: 'bg-emerald-500', badge: darkMode ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-100', label: 'IN', pulse: true },
    'out':    { dot: 'bg-rose-500',    badge: darkMode ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'           : 'bg-rose-50 text-rose-700 border border-rose-100',           label: 'OUT', pulse: false },
    'no-log': { dot: 'bg-gray-400',    badge: darkMode ? 'bg-gray-700/60 text-gray-400 border border-gray-600/30'           : 'bg-gray-50 text-gray-500 border border-gray-200',            label: 'Absent', pulse: false },
  };

  return (
    <div className="space-y-5">
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 focus-within:ring-2 focus-within:ring-sky-500/20 ${darkMode ? 'bg-gray-800/70 border-gray-700 focus-within:border-sky-600' : 'bg-white border-gray-200 shadow-sm focus-within:border-sky-400 hover:border-gray-300'}`}>
        <Search size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
        <input type="text" placeholder="Search class, student, or ID…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`} />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}><X size={14} /></button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Legend:</span>
        {[{ label: 'IN (Present)', color: 'bg-emerald-500', pulse: true }, { label: 'OUT (Left)', color: 'bg-rose-500', pulse: false }, { label: 'Absent (No log)', color: 'bg-gray-400', pulse: false }].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.color} relative`}>{l.pulse && <div className={`absolute inset-0 rounded-full ${l.color} animate-ping opacity-60`} />}</div>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClasses.length === 0 ? (
          <div className={`col-span-full p-12 text-center rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-gray-200'}`}>
            <Search size={32} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No classes match "{searchQuery}"</p>
            <button onClick={() => setSearchQuery('')} className="mt-3 text-sm text-sky-500 hover:text-sky-600">Clear search</button>
          </div>
        ) : filteredClasses.map((cn, idx) => {
          const filteredSt = getFilteredStudents(cn);
          const statusCounts = { in: 0, out: 0, 'no-log': 0 };
          filteredSt.forEach(s => { const st = getStudentTodayStatus(s.studentId); statusCounts[st]++; });
          const rate = filteredSt.length > 0 ? Math.round((statusCounts.in / filteredSt.length) * 100) : 0;
          const isExpanded = selectedClass === cn;
          return (
            <div key={idx} className={`border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${darkMode ? 'bg-gray-800/80 border-gray-700/60 hover:border-gray-500 hover:bg-gray-800' : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-md'}`}>
              <button onClick={() => setSelectedClass(isExpanded ? null : cn)} className="w-full p-5 text-left group">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className={`font-bold text-base truncate ${darkMode ? 'text-white' : 'text-gray-800'}`} title={cn}>{cn}</h3>
                    <p className={`text-xs mt-0.5 font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{filteredSt.length} students</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-sm font-bold ${rate >= 80 ? 'text-emerald-500' : rate >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{rate}%</span>
                    <ChevronDown size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'IN', count: statusCounts.in, bg: darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100', text: 'text-emerald-500' },
                    { label: 'OUT', count: statusCounts.out, bg: darkMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100', text: 'text-rose-500' },
                    { label: 'Absent', count: statusCounts['no-log'], bg: darkMode ? 'bg-gray-700/60 border-gray-600/30' : 'bg-gray-50 border-gray-100', text: darkMode ? 'text-gray-400' : 'text-gray-500' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} border rounded-xl p-2.5 text-center`}>
                      <p className={`text-xl font-black ${s.text}`}>{s.count}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${rate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : rate >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-rose-400 to-rose-600'}`} style={{ width: `${rate}%` }} />
                </div>
              </button>
              {isExpanded && (
                <div className={`border-t max-h-80 overflow-y-auto ${darkMode ? 'border-gray-700/60' : 'border-gray-100'}`}>
                  <div className={`px-5 py-2 flex items-center gap-2 ${darkMode ? 'bg-gray-900/30' : 'bg-gray-50/80'}`}>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Students</span>
                  </div>
                  {filteredSt.sort((a,b) => a.name.localeCompare(b.name)).map((student, si) => {
                    const status = getStudentTodayStatus(student.studentId);
                    const cfg = statusConfig[status];
                    return (
                      <div key={si} className={`flex items-center gap-3 px-5 py-3 border-b last:border-0 transition-colors duration-150 ${darkMode ? 'border-gray-700/40 hover:bg-gray-700/30' : 'border-gray-100/80 hover:bg-slate-50'}`}>
                        <div className="relative flex-shrink-0">
                          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                          {status === 'in' && <div className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-50`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`} title={student.name}>{student.name}</p>
                          <p className={`text-xs font-mono truncate mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} title={student.studentId}>{student.studentId}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}