'use client';
import { RouteGuard } from '../../_lib/RouteGuard';
import { useApp } from '../../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../../_lib/usePageLayout';
import PageShell from '../../_components/PageShell';
import { Skeleton, EmptyState, StatusBadge } from '../../_components/ui';
import { normalizeId, parsePhTimestamp, getPhTodayStr, getPhLocalDate } from '../../_lib/data';
import { useState, useMemo } from 'react';
import StudentProfileModal from '../../_components/StudentProfileModal';
import { Search, Users, UserCheck, UserX, GraduationCap, Hash, X } from 'lucide-react';

const PH_TZ = 'Asia/Manila';

function getStudentStats(studentId, logs) {
  const sid = normalizeId(studentId);
  const today = getPhTodayStr();
  const studentLogs = logs.filter(l => normalizeId(l.studentId) === sid);
  const todayLogs = studentLogs.filter(l => getPhLocalDate(l.timestamp) === today);
  const isPresent = todayLogs.some(l => l.status === 'IN');
  const lastSeen = studentLogs[0]?.timestamp ?? null;
  const totalDays = new Set(studentLogs.map(l => getPhLocalDate(l.timestamp))).size;
  return { isPresent, lastSeen, totalDays };
}

function StudentRow({ student, logs, darkMode, idx, onClick }) {
  const { isPresent, lastSeen, totalDays } = useMemo(() => getStudentStats(student.studentId, logs), [student.studentId, logs]);
  const lastSeenStr = lastSeen
    ? parsePhTimestamp(lastSeen)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'No records';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 border-b last:border-0 transition-all duration-200 hover:scale-[1.001] cursor-pointer
        ${darkMode ? 'border-white/[0.04] hover:bg-white/[0.03]' : 'border-gray-50 hover:bg-slate-50/70'}`}
      style={{ animationDelay: `${idx * 25}ms` }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[13px] font-black shadow-sm"
        style={{ background: isPresent ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#94a3b8,#64748b)' }}
      >
        {(student.name || '?').charAt(0).toUpperCase()}
      </div>

      {/* Name + class */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{student.name}</p>
        <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{student.class || '—'}</p>
      </div>

      {/* ID */}
      <p className={`hidden md:block text-xs font-mono w-24 text-right flex-shrink-0 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
        {student.studentId}
      </p>

      {/* Days */}
      <div className="hidden sm:flex flex-col items-center flex-shrink-0 w-16">
        <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalDays}</span>
        <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>days</span>
      </div>

      {/* Last seen */}
      <p className={`hidden lg:block text-xs w-36 text-right flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {lastSeenStr}
      </p>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold
          ${isPresent
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            : 'bg-gray-500/10 text-gray-400 border border-gray-500/15'}`}>
          {isPresent ? <UserCheck size={11} /> : <UserX size={11} />}
          {isPresent ? 'Present' : 'Absent'}
        </span>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { students, logs, loading, fetchData } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classFilter, setClassFilter] = useState('all');

  const classes = useMemo(() => ['all', ...new Set(students.map(s => s.class).filter(Boolean)).values()], [students]);

  const filtered = useMemo(() => {
    let list = students;
    if (classFilter !== 'all') list = list.filter(s => s.class === classFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.studentId?.toString().includes(q) || s.class?.toLowerCase().includes(q));
    }
    return list;
  }, [students, search, classFilter]);

  const presentCount = useMemo(() => {
    const today = getPhTodayStr();
    return new Set(logs.filter(l => l.status === 'IN' && getPhLocalDate(l.timestamp) === today).map(l => normalizeId(l.studentId))).size;
  }, [logs]);

  return (
    <RouteGuard allowedRoles={['teacher']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>

        <div className="fade-in-up space-y-5">
          {/* Header stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Total Students', value: students.length, icon: Users,     color: '#0ea5e9' },
              { label: 'Present Today',  value: presentCount,    icon: UserCheck,  color: '#10b981' },
              { label: 'Absent Today',   value: Math.max(0, students.length - presentCount), icon: UserX, color: '#f43f5e' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`border rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className={`text-base sm:text-xl font-black leading-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loading ? '—' : value}</p>
                  <p className={`text-[10px] sm:text-xs mt-0.5 truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center p-3 sm:p-4 border-b ${darkMode ? 'border-white/[0.05]' : 'border-gray-100'}`}>
              <div className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-gray-50 border-gray-200'}`}>
                <Search size={15} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, ID or class…"
                  className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-400'}`}
                />
                {search && <button onClick={() => setSearch('')}><X size={13} className={darkMode ? 'text-gray-500' : 'text-gray-400'} /></button>}
              </div>
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-semibold outline-none w-full sm:w-auto ${darkMode ? 'bg-white/[0.04] border-white/8 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
              >
                {classes.map(c => <option key={c} value={c}>{c === 'all' ? 'All Classes' : c}</option>)}
              </select>
            </div>

            {/* Table header */}
            <div className={`hidden sm:flex items-center gap-4 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-600 border-b border-white/[0.04]' : 'text-gray-400 border-b border-gray-50'}`}>
              <div className="w-9 flex-shrink-0" />
              <span className="flex-1">Student</span>
              <span className="hidden md:block w-24 text-right">ID</span>
              <span className="hidden sm:block w-16 text-center">Days</span>
              <span className="hidden lg:block w-36 text-right">Last Seen</span>
              <span className="w-20 text-right">Status</span>
            </div>

            {/* Rows */}
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`flex items-center gap-4 px-5 py-4 border-b last:border-0 ${darkMode ? 'border-white/[0.04]' : 'border-gray-50'}`}>
                    <Skeleton darkMode={darkMode} className="w-9 h-9 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton darkMode={darkMode} className="h-3.5 w-40 rounded" />
                      <Skeleton darkMode={darkMode} className="h-3 w-20 rounded" />
                    </div>
                    <Skeleton darkMode={darkMode} className="h-6 w-16 rounded-full" />
                  </div>
                ))
              : filtered.length === 0
                ? <div className="py-16"><EmptyState icon={Users} title="No students found" body="Try adjusting your search or filter." darkMode={darkMode} /></div>
                : filtered.map((s, i) => <StudentRow key={s.studentId} student={s} logs={logs} darkMode={darkMode} idx={i} onClick={() => setSelectedStudent(s)} />)
            }

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div className={`px-5 py-3 text-xs font-semibold ${darkMode ? 'text-gray-600 border-t border-white/[0.04]' : 'text-gray-400 border-t border-gray-100'}`}>
                Showing {filtered.length} of {students.length} students
              </div>
            )}
          </div>
        </div>
      </PageShell>
      {/* Student profile modal */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          logs={logs}
          darkMode={darkMode}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </RouteGuard>
  );
}