'use client';
import { RouteGuard } from '../_lib/RouteGuard';
import { useApp } from '../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../_lib/usePageLayout';
import PageShell from '../_components/PageShell';
import { normalizeId, getPhTodayStr, getPhLocalDate, parsePhTimestamp } from '../_lib/data';
import { useMemo, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Clock, TrendingDown, Info, Check, Trash2, BellOff } from 'lucide-react';

const PH_TZ = 'Asia/Manila';

const TYPE_CONFIG = {
  absent:  { icon: AlertTriangle, color: '#f43f5e', bg: 'bg-rose-500/10',    border: 'border-rose-500/20'    },
  late:    { icon: Clock,         color: '#f59e0b', bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  present: { icon: CheckCircle,   color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  streak:  { icon: TrendingDown,  color: '#f43f5e', bg: 'bg-rose-500/10',    border: 'border-rose-500/20'    },
  info:    { icon: Info,          color: '#0ea5e9', bg: 'bg-sky-500/10',     border: 'border-sky-500/20'     },
};

function buildNotifications(childLogs, childName) {
  const notes = [];
  const today = getPhTodayStr();

  // Today status
  const todayLogs = childLogs.filter(l => getPhLocalDate(l.timestamp) === today);
  const checkedInToday = todayLogs.some(l => l.status === 'IN');
  if (checkedInToday) {
    const inLog = todayLogs.find(l => l.status === 'IN');
    const time = inLog ? parsePhTimestamp(inLog.timestamp)?.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit' }) : '';
    const h = inLog ? parseInt(parsePhTimestamp(inLog.timestamp)?.toLocaleString('en-PH', { hour:'numeric', hour12:false, timeZone:PH_TZ })) : 0;
    notes.push({ id: 'today-in', type: h >= 8 ? 'late' : 'present', title: h >= 8 ? `${childName} arrived late today` : `${childName} checked in today`, body: `Arrived at ${time}`, time: 'Today', read: false });
  } else {
    notes.push({ id: 'today-out', type: 'absent', title: `${childName} has not checked in today`, body: 'No attendance record yet for today.', time: 'Today', read: false });
  }

  // Last 7 days absence streaks
  let streak = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: PH_TZ });
    if (!childLogs.some(l => l.status === 'IN' && getPhLocalDate(l.timestamp) === dateStr)) streak++;
    else break;
  }
  if (streak >= 2) {
    notes.push({ id: 'streak', type: 'streak', title: `${streak}-day absence streak detected`, body: `${childName} has been absent for ${streak} consecutive school days.`, time: `${streak} days ago`, read: false });
  }

  // Recent check-ins (last 5 days)
  for (let i = 1; i <= 5; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: PH_TZ });
    const label = d.toLocaleDateString('en-PH', { timeZone: PH_TZ, weekday: 'long', month: 'short', day: 'numeric' });
    const dayLogs = childLogs.filter(l => getPhLocalDate(l.timestamp) === dateStr);
    const inLog = dayLogs.find(l => l.status === 'IN');
    if (inLog) {
      const time = parsePhTimestamp(inLog.timestamp)?.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit' });
      const h = parseInt(parsePhTimestamp(inLog.timestamp)?.toLocaleString('en-PH', { hour:'numeric', hour12:false, timeZone:PH_TZ }));
      notes.push({ id: `day-${i}`, type: h >= 8 ? 'late' : 'present', title: h >= 8 ? `Late arrival on ${label}` : `Attended on ${label}`, body: `Check-in time: ${time}`, time: label, read: i > 1 });
    } else {
      notes.push({ id: `absent-${i}`, type: 'absent', title: `Absent on ${label}`, body: 'No check-in recorded for this school day.', time: label, read: i > 2 });
    }
  }

  // System info
  notes.push({ id: 'info-1', type: 'info', title: 'RFID system is active', body: 'Attendance is tracked automatically when your child taps their RFID card.', time: 'System', read: true });

  return notes;
}

export default function NotificationsPage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile  = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { logs, students, userInfo, loading, fetchData } = useApp();

  const childIds = useMemo(() => {
    let raw = userInfo?.studentIds;
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = raw ? [raw] : []; } }
    let ids = Array.isArray(raw) ? raw.map(String) : [];
    if (!ids.length && userInfo?.studentId) ids = [String(userInfo.studentId)];
    if (!ids.length) ids = students.map(s => String(s.studentId));
    return ids.map(normalizeId);
  }, [userInfo, students]);

  const child = useMemo(() => students.find(s => childIds.includes(normalizeId(s.studentId))), [students, childIds]);
  const childLogs = useMemo(() => logs.filter(l => childIds.includes(normalizeId(l.studentId))), [logs, childIds]);

  const rawNotes = useMemo(() => buildNotifications(childLogs, child?.name ?? 'Your child'), [childLogs, child]);
  const [readIds, setReadIds] = useState(new Set());
  const [deletedIds, setDeletedIds] = useState(new Set());
  const [filter, setFilter] = useState('all');

  const notes = useMemo(() => rawNotes.filter(n => {
    if (deletedIds.has(n.id)) return false;
    if (filter === 'unread') return !n.read && !readIds.has(n.id);
    return true;
  }), [rawNotes, deletedIds, readIds, filter]);

  const unreadCount = useMemo(() => notes.filter(n => !n.read && !readIds.has(n.id)).length, [notes, readIds]);

  function markAllRead() { setReadIds(new Set(rawNotes.map(n => n.id))); }

  return (
    <RouteGuard allowedRoles={['parent']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>
        <div className="fade-in-up max-w-2xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black text-white" style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex rounded-xl border overflow-hidden text-xs font-bold ${darkMode ? 'border-white/8' : 'border-gray-200'}`}>
                {['all','unread'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-2 capitalize transition-all ${filter === f ? 'text-white' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    style={filter === f ? { background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)' } : undefined}>
                    {f}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 ${darkMode ? 'border-white/8 text-gray-400 hover:bg-white/[0.06]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
            {notes.length === 0
              ? (
                <div className="py-16 text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
                    <BellOff size={22} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
                  </div>
                  <p className={`text-sm font-black ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>All clear!</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No notifications to show.</p>
                </div>
              )
              : notes.map(n => {
                  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  const isRead = n.read || readIds.has(n.id);
                  return (
                    <div key={n.id}
                      className={`flex gap-3.5 px-5 py-4 border-b last:border-0 transition-all group ${isRead ? 'opacity-60' : ''} ${darkMode ? 'border-white/[0.04] hover:bg-white/[0.03]' : 'border-gray-50 hover:bg-slate-50/60'}`}>
                      {/* Unread dot */}
                      <div className="flex-shrink-0 mt-1 relative">
                        {!isRead && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: cfg.color }} />}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                          <Icon size={15} style={{ color: cfg.color }} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{n.title}</p>
                        {n.body && <p className={`text-xs mt-0.5 leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{n.body}</p>}
                        <p className={`text-[11px] mt-1 font-semibold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{n.time}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isRead && (
                          <button onClick={() => setReadIds(s => new Set([...s, n.id]))}
                            title="Mark read"
                            className={`p-1.5 rounded-lg transition-all hover:scale-110 ${darkMode ? 'hover:bg-white/8 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                            <Check size={12} />
                          </button>
                        )}
                        <button onClick={() => setDeletedIds(s => new Set([...s, n.id]))}
                          title="Dismiss"
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 ${darkMode ? 'hover:bg-rose-500/10 text-gray-600' : 'hover:bg-rose-50 text-gray-300 hover:text-rose-400'}`}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </PageShell>
    </RouteGuard>
  );
}