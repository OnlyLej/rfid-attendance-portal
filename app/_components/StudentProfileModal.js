'use client';

import { useMemo } from 'react';
import { X, Hash, GraduationCap, Clock, TrendingUp, CheckCircle, XCircle, Award, Calendar, Flame } from 'lucide-react';
import { normalizeId, parsePhTimestamp, getPhTodayStr, getPhLocalDate, formatLocalDateTime } from '../_lib/data';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const PH_TZ = 'Asia/Manila';

function calcStreak(logs) {
  const days = [...new Set(
    logs.filter(l => l.status === 'IN' && l.timestamp).map(l => getPhLocalDate(l.timestamp)).filter(Boolean)
  )].sort().reverse();
  const today = getPhTodayStr();
  const yest = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toLocaleDateString('en-CA'); })();
  let streak = 0;
  let expected = days[0]===today ? today : days[0]===yest ? yest : null;
  for (const d of days) {
    if (d === expected) { streak++; const nd = new Date(expected); nd.setDate(nd.getDate()-1); expected = nd.toLocaleDateString('en-CA'); }
    else break;
  }
  return streak;
}

export default function StudentProfileModal({ student, logs: allLogs, darkMode, onClose }) {
  if (!student) return null;

  const logs = useMemo(() =>
    allLogs.filter(l => normalizeId(l.studentId) === normalizeId(student.studentId))
      .sort((a,b) => (parsePhTimestamp(b.timestamp)?.getTime()??0) - (parsePhTimestamp(a.timestamp)?.getTime()??0)),
    [allLogs, student.studentId]
  );

  const today = getPhTodayStr();
  const isPresent = logs.some(l => l.status === 'IN' && getPhLocalDate(l.timestamp) === today);
  const lastSeen = logs[0] ? formatLocalDateTime(logs[0].timestamp) : null;
  const totalDays = new Set(logs.map(l => getPhLocalDate(l.timestamp)).filter(Boolean)).size;
  const streak = calcStreak(logs);

  // 30-day rate
  const rate30 = useMemo(() => {
    const school = Array.from({length:30}, (_,i) => {
      const d = new Date(); d.setDate(d.getDate()-i);
      if (d.getDay()===0||d.getDay()===6) return null;
      return d.toLocaleDateString('en-CA');
    }).filter(Boolean);
    const presentSet = new Set(logs.filter(l=>l.status==='IN').map(l=>getPhLocalDate(l.timestamp)));
    return school.length ? Math.round(school.filter(d=>presentSet.has(d)).length/school.length*100) : 0;
  }, [logs]);

  // 14-day sparkline
  const sparkData = useMemo(() => Array.from({length:14}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(13-i));
    if (d.getDay()===0||d.getDay()===6) return null;
    const dateStr = d.toLocaleDateString('en-CA');
    const label   = d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const present = logs.some(l => getPhLocalDate(l.timestamp) === dateStr);
    return { label, value: present ? 1 : 0 };
  }).filter(Boolean), [logs]);

  const rateColor = rate30>=90?'#10b981':rate30>=70?'#f59e0b':'#f43f5e';
  const initial   = (student.name||'?').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={onClose} />
      <div
        className={`relative w-full max-w-md rounded-2xl border overflow-hidden flex flex-col max-h-[90vh] ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}
        style={{ boxShadow:'0 32px 80px rgba(0,0,0,0.4)', animation:'profile-modal .3s cubic-bezier(.34,1.5,.64,1) both' }}
      >
        {/* Hero */}
        <div className="h-20 flex-shrink-0 relative" style={{ background:'#0ea5e9' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage:'radial-gradient(circle at 20% 50%,rgba(255,255,255,0.4) 0%,transparent 60%)' }} />
          <button onClick={onClose} className={`absolute top-3 right-3 p-1.5 rounded-xl transition-all hover:scale-110 active:scale-90 bg-white/10 hover:bg-white/20 text-white`}>
            <X size={15} />
          </button>
        </div>

        {/* Avatar overlapping hero */}
        <div className="px-5 pb-4 flex-shrink-0 relative">
          <div className="-mt-8 mb-3 flex items-end justify-between">
            <div className="w-16 h-16 rounded-2xl border-4 flex items-center justify-center text-white text-2xl font-black shadow-xl"
              style={{ background:'#7c3aed', borderColor: darkMode?'#0d1220':'white' }}>
              {initial}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${isPresent ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/15'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPresent?'bg-emerald-500':'bg-gray-400'}`} />
              {isPresent ? 'Present Today' : 'Not Yet In'}
            </span>
          </div>
          <h2 className={`text-lg font-black ${darkMode?'text-white':'text-gray-900'}`}>{student.name}</h2>
          <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-500'}`}>{student.class}</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* Details */}
          <div className={`rounded-2xl p-4 border space-y-3 ${darkMode?'bg-white/[0.04] border-white/8':'bg-gray-50 border-gray-100'}`}>
            {[
              { icon: Hash,          label: 'Student ID',   value: student.studentId },
              { icon: GraduationCap, label: 'Class',        value: student.class || '—' },
              { icon: Clock,         label: 'Last Seen',    value: lastSeen || 'No records' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode?'bg-white/[0.06]':'bg-white shadow-sm'}`}>
                  <Icon size={13} className={darkMode?'text-gray-500':'text-gray-400'} />
                </div>
                <div>
                  <p className={`text-[10px] ${darkMode?'text-gray-600':'text-gray-400'}`}>{label}</p>
                  <p className={`text-sm font-semibold ${darkMode?'text-white':'text-gray-900'}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:'30-day Rate',   value:`${rate30}%`,  color:rateColor,  icon:TrendingUp  },
              { label:'Days Present',  value:totalDays,     color:'#10b981',  icon:CheckCircle },
              { label:'Current Streak',value:`${streak}d`,  color:'#f59e0b',  icon:Flame       },
              { label:'Rating',        value:rate30>=95?'Excellent':rate30>=85?'Good':rate30>=70?'Fair':'Needs Work', color:rateColor, icon:Award },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${darkMode?'bg-white/[0.04] border-white/8':'bg-white border-gray-200/80 shadow-sm'}`}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${color}18` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div>
                  <p className="text-base font-black leading-tight" style={{ color }}>{value}</p>
                  <p className={`text-[10px] ${darkMode?'text-gray-500':'text-gray-400'}`}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Attendance chart */}
          {sparkData.length > 0 && (
            <div className={`rounded-2xl p-4 border ${darkMode?'bg-white/[0.04] border-white/8':'bg-white border-gray-200/80 shadow-sm'}`}>
              <p className={`text-xs font-black mb-3 ${darkMode?'text-white':'text-gray-900'}`}>Last 14 School Days</p>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={sparkData} margin={{ top:2, right:0, left:-40, bottom:0 }}>
                  <defs>
                    <linearGradient id={`sg-${student.studentId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: darkMode?'#475569':'#94a3b8', fontSize:8 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0,1]} hide />
                  <Tooltip formatter={v=>[v===1?'Present ✓':'Absent ✗','']} contentStyle={{ background:darkMode?'#0d1220':'#fff', border:`1px solid ${darkMode?'rgba(255,255,255,0.1)':'#e5e7eb'}`, borderRadius:8, fontSize:11 }} />
                  <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill={`url(#sg-${student.studentId})`} strokeWidth={2} dot={{ r:3, fill:'#0ea5e9', strokeWidth:0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent logs */}
          {logs.length > 0 && (
            <div className={`rounded-2xl border overflow-hidden ${darkMode?'bg-white/[0.04] border-white/8':'bg-white border-gray-200/80 shadow-sm'}`}>
              <p className={`text-xs font-black px-4 py-3 border-b ${darkMode?'text-white border-white/[0.05]':'text-gray-900 border-gray-100'}`}>Recent Activity</p>
              <div className="max-h-40 overflow-y-auto">
                {logs.slice(0,15).map((l,i) => {
                  const d = parsePhTimestamp(l.timestamp);
                  const dateStr = d?.toLocaleDateString('en-PH',{timeZone:PH_TZ,weekday:'short',month:'short',day:'numeric'}) ?? '—';
                  const timeStr = d?.toLocaleTimeString('en-PH',{timeZone:PH_TZ,hour:'2-digit',minute:'2-digit'}) ?? '—';
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 ${darkMode?'border-white/[0.04]':'border-gray-50'}`}>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${l.status==='IN'?'bg-emerald-500/10 text-emerald-500':'bg-rose-500/10 text-rose-500'}`}>{l.status}</span>
                      <span className={`text-xs flex-1 ${darkMode?'text-gray-400':'text-gray-600'}`}>{dateStr}</span>
                      <span className={`text-xs font-mono ${darkMode?'text-gray-500':'text-gray-400'}`}>{timeStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes profile-modal { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}