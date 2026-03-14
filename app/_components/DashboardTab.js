'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Calendar, Users, TrendingUp, BarChart3, Activity, UserCheck, UserX,
  Target, Award, ArrowUp, ArrowDown, Minus, Loader2,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { normalizeId, parsePhTimestamp, getPhTodayStr, toPhDateStr, getPhLocalDate } from '../_lib/data';

const PH_TZ = 'Asia/Manila';

/* ── Hooks ── */
const useFadeIn = (delay = 0) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return visible;
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const useIntersectionObserver = (options = {}) => {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.1, ...options }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const useCountUp = (target, duration = 1200, start = false) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return val;
};

/* ── Card ── */
const Card = ({ children, className = '', darkMode, delay = 0, hover = false }) => {
  const visible = useFadeIn(delay);
  return (
    <div
      className={`border rounded-2xl backdrop-blur-sm transition-all duration-500 ease-out
        ${darkMode
          ? 'bg-white/[0.04] border-white/8'
          : 'bg-white border-gray-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)]'
        }
        ${hover
          ? darkMode
            ? 'hover:bg-white/[0.07] hover:border-white/16 hover:shadow-xl hover:-translate-y-0.5'
            : 'hover:border-gray-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5'
          : ''
        }
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${className}`}
    >
      {children}
    </div>
  );
};

/* ── StatCard ── */
const StatCard = ({ icon: Icon, label, value, color, darkMode, delay = 0, numericValue = null, trend = null, trendLabel = '' }) => {
  const [ref, inView] = useIntersectionObserver();
  const visible = useFadeIn(delay);
  const countedVal = useCountUp(numericValue || 0, 900, inView && numericValue !== null);

  const colorMap = {
    green:  { accent: '#10b981', gradient: 'from-emerald-400 to-emerald-600', dark: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' }, light: { bg: 'bg-emerald-50', text: 'text-emerald-600' } },
    red:    { accent: '#f43f5e', gradient: 'from-rose-400 to-rose-600',       dark: { bg: 'bg-rose-500/10',    text: 'text-rose-400'    }, light: { bg: 'bg-rose-50',    text: 'text-rose-600'    } },
    blue:   { accent: '#0ea5e9', gradient: 'from-sky-400 to-sky-600',         dark: { bg: 'bg-sky-500/10',     text: 'text-sky-400'     }, light: { bg: 'bg-sky-50',     text: 'text-sky-600'     } },
    purple: { accent: '#7c3aed', gradient: 'from-violet-400 to-violet-600',   dark: { bg: 'bg-violet-500/10',  text: 'text-violet-400'  }, light: { bg: 'bg-violet-50',  text: 'text-violet-600'  } },
    indigo: { accent: '#6366f1', gradient: 'from-indigo-400 to-indigo-600',   dark: { bg: 'bg-indigo-500/10',  text: 'text-indigo-400'  }, light: { bg: 'bg-indigo-50',  text: 'text-indigo-600'  } },
    orange: { accent: '#f59e0b', gradient: 'from-amber-400 to-amber-600',     dark: { bg: 'bg-amber-500/10',   text: 'text-amber-400'   }, light: { bg: 'bg-amber-50',   text: 'text-amber-600'   } },
  };

  const c = colorMap[color] || colorMap.blue;
  const iconBg   = darkMode ? c.dark.bg   : c.light.bg;
  const iconText = darkMode ? c.dark.text : c.light.text;
  const displayValue = numericValue !== null
    ? (value.includes('%') ? `${countedVal}%` : countedVal)
    : value;
  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-rose-500' : darkMode ? 'text-gray-500' : 'text-gray-400';
  const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden border rounded-2xl p-5 backdrop-blur-sm
        transition-all duration-500 ease-out hover:-translate-y-1 cursor-default
        ${darkMode
          ? 'bg-white/[0.04] border-white/8 hover:bg-white/[0.07] hover:border-white/16 hover:shadow-xl'
          : 'bg-white border-gray-200/80 shadow-[0_1px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.09)] hover:border-gray-300'
        }
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Top gradient accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${c.gradient}`}
      />
      {/* Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%,${c.accent}14,transparent 70%)` }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`inline-flex p-2.5 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={17} className={iconText} />
          </div>
          {trend !== null && (
            <div className={`flex items-center gap-0.5 text-xs font-bold ${trendColor}`}>
              <TrendIcon size={12} /><span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <p className={`text-xs font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {label}
        </p>
        <p className={`text-3xl font-black tracking-tight transition-all duration-300 group-hover:scale-105 origin-left ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {displayValue}
        </p>
        {trendLabel && (
          <p className={`text-xs mt-1.5 font-medium ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{trendLabel}</p>
        )}
      </div>
    </div>
  );
};

/* ── Skeleton ── */
const Skeleton = ({ className = '', darkMode }) => (
  <div className={`rounded-xl overflow-hidden ${className}`}>
    <div className={`w-full h-full ${darkMode ? 'bg-white/6' : 'bg-gray-200/60'} animate-pulse`} />
  </div>
);

const ChartSkeleton = ({ darkMode }) => (
  <div className="flex flex-col gap-3 h-full justify-end pb-2">
    <div className="flex items-end gap-2 h-full">
      {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5].map((h, i) => (
        <div key={i} className="flex-1">
          <div
            className={`w-full rounded-t-lg animate-pulse ${darkMode ? 'bg-white/6' : 'bg-gray-200/60'}`}
            style={{ height: `${h * 100}%` }}
          />
        </div>
      ))}
    </div>
  </div>
);

/* ── ChartHeader ── */
const ChartHeader = ({ icon: Icon, title, badge, color = 'sky', darkMode }) => {
  const colorMap = {
    sky:     'bg-sky-500/10 text-sky-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    violet:  'bg-violet-500/10 text-violet-500',
    indigo:  'bg-indigo-500/10 text-indigo-500',
    amber:   'bg-amber-500/10 text-amber-500',
  };
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl ${colorMap[color] || colorMap.sky} flex items-center justify-center`}>
          <Icon size={15} />
        </div>
        <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      </div>
      {badge && (
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-bold border
            ${darkMode ? 'bg-white/[0.04] border-white/8 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
        >
          {badge}
        </span>
      )}
    </div>
  );
};

/* ── Main ── */
export default function DashboardTab({ darkMode, stats, weekData, students, logs, classes, loading }) {
  const isMobile = useIsMobile();

  /* ── Data derivations (unchanged logic) ── */
  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const targetPhStr = targetDate.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: PH_TZ });
      const dayLogs = logs.filter(log => { if (!log.timestamp) return false; return getPhLocalDate(log.timestamp) === targetPhStr; });
      const presentStudents = new Set(dayLogs.filter(l => l.status === 'IN' && l.studentId).map(l => normalizeId(l.studentId)));
      const present = presentStudents.size;
      const absent = Math.max(0, students.length - present);
      const rate = students.length > 0 ? Math.round((present / students.length) * 100) : 0;
      days.push({ name: dayName, fullDate: targetPhStr, present, absent, attendanceRate: rate });
    }
    return days;
  }, [logs, students]);

  const weeklyData = useMemo(() => {
    if (!students?.length) return [];
    const totalStudents = students.length;
    const nowPh = new Date(new Date().toLocaleString('en-US', { timeZone: PH_TZ }));
    const currentYear = nowPh.getFullYear();
    const currentMonth = nowPh.getMonth();
    const getWeekOfMonth = (date) => { const firstDay = new Date(date.getFullYear(), date.getMonth(), 1); return Math.ceil((date.getDate() + firstDay.getDay()) / 7); };
    const totalWeeks = getWeekOfMonth(new Date(currentYear, currentMonth + 1, 0));
    const weekMap = new Map();
    logs?.forEach(log => {
      if (log.status !== 'IN' || !log.studentId || !log.timestamp) return;
      const logDate = parsePhTimestamp(log.timestamp); if (!logDate) return;
      const logPhStr = toPhDateStr(logDate);
      const [ly, lm] = logPhStr.split('-').map(Number);
      if (ly !== currentYear || lm - 1 !== currentMonth) return;
      const phLocal = new Date(logDate.toLocaleString('en-US', { timeZone: PH_TZ }));
      const week = getWeekOfMonth(phLocal);
      if (!weekMap.has(week)) weekMap.set(week, new Set());
      weekMap.get(week).add(normalizeId(log.studentId));
    });
    return Array.from({ length: totalWeeks }, (_, wi) => {
      const week = wi + 1;
      const presentSet = weekMap.get(week) || new Set();
      const present = presentSet.size;
      const absent = totalStudents - present;
      const rate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
      const weekStartDay = (week - 1) * 7 + 1 - new Date(currentYear, currentMonth, 1).getDay() + 1;
      const weekStart = new Date(currentYear, currentMonth, Math.max(1, weekStartDay));
      const isFuture = weekStart > nowPh;
      return { name: `Week ${week}`, present: isFuture ? 0 : present, absent: isFuture ? 0 : absent, avgRate: isFuture ? 0 : rate, isFuture };
    });
  }, [logs, students]);

  const monthlyData = useMemo(() => {
    const months = [];
    const nowPh = new Date(new Date().toLocaleString('en-US', { timeZone: PH_TZ }));
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(nowPh.getFullYear(), nowPh.getMonth() - i, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
      const yearShort = targetYear.toString().slice(-2);
      const dayStudentMap = new Map();
      logs.forEach(log => {
        if (log.status !== 'IN' || !log.studentId || !log.timestamp) return;
        const logDate = parsePhTimestamp(log.timestamp); if (!logDate) return;
        const phLocal = new Date(logDate.toLocaleString('en-US', { timeZone: PH_TZ }));
        if (phLocal.getFullYear() !== targetYear || phLocal.getMonth() !== targetMonth) return;
        const dow = phLocal.getDay(); if (dow === 0 || dow === 6) return;
        const dateStr = toPhDateStr(logDate);
        if (!dayStudentMap.has(dateStr)) dayStudentMap.set(dateStr, new Set());
        dayStudentMap.get(dateStr).add(normalizeId(log.studentId));
      });
      const schoolDayCount = dayStudentMap.size;
      const totalPresent = [...dayStudentMap.values()].reduce((s, set) => s + set.size, 0);
      const avgPresent = schoolDayCount > 0 ? Math.round(totalPresent / schoolDayCount) : 0;
      const avgRate = schoolDayCount > 0 && students.length > 0 ? Math.round((avgPresent / students.length) * 100) : 0;
      const isFuture = targetDate > nowPh;
      months.push({ name: `${monthName} '${yearShort}`, avgPresent: isFuture ? null : avgPresent, avgRate: isFuture ? null : avgRate, days: schoolDayCount, month: monthName });
    }
    return months;
  }, [logs, students]);

  const classComparisonData = useMemo(() => {
    if (!classes?.length || !students?.length) return [];
    const todayPhStr = getPhTodayStr();
    const todayLogsByStudent = new Map();
    logs.forEach(log => {
      if (!log.timestamp || !log.studentId) return;
      if (getPhLocalDate(log.timestamp) !== todayPhStr) return;
      const nid = normalizeId(log.studentId);
      if (!todayLogsByStudent.has(nid)) todayLogsByStudent.set(nid, []);
      todayLogsByStudent.get(nid).push(log);
    });
    return classes.map(cls => {
      const classStudents = students.filter(s => s.class === cls);
      const totalCount = classStudents.length;
      if (!totalCount) return null;
      let presentCount = 0, absentCount = 0, noLogCount = 0;
      classStudents.forEach(student => {
        const nid = normalizeId(student.studentId);
        const studentLogs = (todayLogsByStudent.get(nid) || []).slice().sort((a, b) => {
          const da = parsePhTimestamp(a.timestamp); const db = parsePhTimestamp(b.timestamp);
          return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
        });
        if (!studentLogs.length) { noLogCount++; }
        else { studentLogs[studentLogs.length - 1].status === 'IN' ? presentCount++ : absentCount++; }
      });
      const rate = Math.round((presentCount / totalCount) * 100);
      const displayName = cls.length > 16 ? `${cls.substring(0, 14)}…` : cls;
      return { name: displayName, fullName: cls, attendanceRate: rate, present: presentCount, absent: absentCount, noLog: noLogCount, total: totalCount };
    }).filter(Boolean).filter(c => c.total > 0).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [classes, students, logs]);

  /* ── Chart styling ── */
  const tooltipStyle = {
    backgroundColor: darkMode ? '#0f1629' : '#ffffff',
    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}`,
    borderRadius: '14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    color: darkMode ? '#e2e8f0' : '#1e293b',
    fontSize: 12,
    padding: '10px 14px',
  };
  const gridColor  = darkMode ? 'rgba(255,255,255,0.04)' : '#f1f5f9';
  const axisColor  = darkMode ? '#334155' : '#94a3b8';
  const chartH     = isMobile ? 220 : 260;
  const weekAvg    = dailyData.length > 0 ? Math.round(dailyData.reduce((s, d) => s + d.attendanceRate, 0) / dailyData.length) : 0;

  return (
    <div className="space-y-5">

      {/* Syncing banner */}
      {loading && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold
            ${darkMode
              ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
              : 'bg-sky-50 border-sky-100 text-sky-600'
            }`}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
          Syncing attendance data…
          <Loader2 size={14} className="animate-spin ml-auto opacity-60" />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Total Students', value: `${stats.totalStudents}`, numericValue: stats.totalStudents, icon: Users,     color: 'blue',   delay: 0   },
          { label: 'Present Today',  value: `${stats.presentToday}`,  numericValue: stats.presentToday,  icon: UserCheck, color: 'green',  delay: 60  },
          { label: 'Absent Today',   value: `${stats.absentToday}`,   numericValue: stats.absentToday,   icon: UserX,     color: 'red',    delay: 120 },
          { label: "Today's Rate",   value: `${stats.attendanceRate}%`, numericValue: stats.attendanceRate, icon: TrendingUp, color: 'purple', delay: 180 },
          { label: 'Week Average',   value: `${weekAvg}%`,            numericValue: weekAvg,             icon: Calendar,  color: 'indigo', delay: 240 },
        ].map((s, i) => (
          <StatCard key={i} {...s} darkMode={darkMode} />
        ))}
      </div>

      {/* Chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Weekly bar chart */}
        <Card darkMode={darkMode} delay={100} hover>
          <div className="p-5">
            <ChartHeader
              icon={BarChart3}
              title={`Weekly — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric', timeZone: PH_TZ })}`}
              color="sky"
              darkMode={darkMode}
            />
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton darkMode={darkMode} /> : weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="35%">
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={1}    />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={1}    />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', radius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, fontWeight: 600 }} />
                    <Bar dataKey="present" name="Present" fill="url(#presentGrad)" radius={[6,6,0,0]} maxBarSize={44} animationDuration={800} animationEasing="ease-out" />
                    <Bar dataKey="absent"  name="Absent"  fill="url(#absentGrad)"  radius={[6,6,0,0]} maxBarSize={44} animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <BarChart3 size={28} className={darkMode ? 'text-gray-700' : 'text-gray-200'} />
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data for this month</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Last 7 days area chart */}
        <Card darkMode={darkMode} delay={150} hover>
          <div className="p-5">
            <ChartHeader icon={Activity} title="Last 7 Days" badge="Daily attendance" color="emerald" darkMode={darkMode} />
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton darkMode={darkMode} /> : dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dailyPresentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="dailyAbsentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, fontWeight: 600 }} />
                    <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={2.5} fill="url(#dailyPresentGrad)" dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: darkMode ? '#0f1629' : '#fff' }} activeDot={{ r: 6 }} animationDuration={900} />
                    <Area type="monotone" dataKey="absent"  name="Absent"  stroke="#f43f5e" strokeWidth={2}   fill="url(#dailyAbsentGrad)"  dot={{ fill: '#f43f5e', r: 3, strokeWidth: 2, stroke: darkMode ? '#0f1629' : '#fff' }} activeDot={{ r: 5 }} animationDuration={900} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Activity size={28} className={darkMode ? 'text-gray-700' : 'text-gray-200'} />
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Monthly trend */}
        <Card darkMode={darkMode} delay={200} hover>
          <div className="p-5">
            <ChartHeader icon={TrendingUp} title="Monthly Trend" badge="6 months" color="violet" darkMode={darkMode} />
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton darkMode={darkMode} /> : monthlyData.some(m => m.avgPresent !== null && m.avgPresent > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="monthlyRateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left"  stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [v === null ? '—' : name === 'Avg Rate' ? `${v}%` : `${v} students`, name]} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, fontWeight: 600 }} />
                    <Area yAxisId="left"  type="monotone" dataKey="avgPresent" name="Avg Present" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#monthlyGrad)"     dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: darkMode ? '#0f1629' : '#fff' }} activeDot={{ r: 6 }} animationDuration={1000} connectNulls={false} />
                    <Area yAxisId="right" type="monotone" dataKey="avgRate"    name="Avg Rate"    stroke="#06b6d4" strokeWidth={2}   fill="url(#monthlyRateGrad)" dot={{ fill: '#06b6d4', r: 3, strokeWidth: 2, stroke: darkMode ? '#0f1629' : '#fff' }} activeDot={{ r: 5 }} animationDuration={1000} connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <TrendingUp size={28} className={darkMode ? 'text-gray-700' : 'text-gray-200'} />
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No monthly data yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Class performance */}
        <Card darkMode={darkMode} delay={250} hover>
          <div className="p-5">
            <ChartHeader icon={Target} title="Class Performance Today" color="indigo" darkMode={darkMode} />
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton darkMode={darkMode} /> : classComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classComparisonData} layout="vertical" margin={{ top: 4, right: 50, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="classGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={1}    />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke={axisColor} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, name, props) => { const d = props.payload; return [`${v}% — ${d.present} IN / ${d.absent} OUT / ${d.noLog} no log`, d.fullName]; }} />
                    <Bar dataKey="attendanceRate" name="Rate" fill="url(#classGrad)" radius={[0,6,6,0]} maxBarSize={20} animationDuration={900} animationEasing="ease-out"
                      label={{ position: 'right', fontSize: 11, fontWeight: 700, fill: darkMode ? '#94a3b8' : '#64748b', formatter: v => `${v}%` }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Target size={28} className={darkMode ? 'text-gray-700' : 'text-gray-200'} />
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No class data today</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Summary cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Today's Summary",
            icon: Calendar, iconColor: 'text-sky-500', iconBg: 'bg-sky-500/10',
            content: (
              <div className="space-y-3">
                {[
                  { label: 'Check-ins (IN)',     value: stats.presentToday },
                  { label: 'Checked Out (OUT)',  value: stats.absentToday,         red: true },
                  { label: 'Attendance Rate',    value: `${stats.attendanceRate}%`, green: true },
                ].map((r, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 border-b last:border-0 ${darkMode ? 'border-white/6' : 'border-gray-100'}`}>
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{r.label}</span>
                    <span className={`text-sm font-black ${r.green ? 'text-emerald-500' : r.red ? 'text-rose-500' : darkMode ? 'text-white' : 'text-gray-900'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            ),
            delay: 300,
          },
          {
            title: 'Week Snapshot',
            icon: TrendingUp, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10',
            content: (
              <div className="space-y-3">
                {[
                  { label: 'Avg Daily Present', value: dailyData.length > 0 ? Math.round(dailyData.reduce((s,d) => s+d.present, 0) / dailyData.length) : 0 },
                  { label: 'Avg Rate',           value: `${weekAvg}%`,                                                                                         purple: true },
                  { label: 'Best Day',           value: dailyData.length > 0 && dailyData.some(d => d.present > 0) ? dailyData.reduce((m,d) => d.present > m.present ? d : m, dailyData[0]).name : '—', green: true },
                ].map((r, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 border-b last:border-0 ${darkMode ? 'border-white/6' : 'border-gray-100'}`}>
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{r.label}</span>
                    <span className={`text-sm font-black ${r.green ? 'text-emerald-500' : r.purple ? 'text-violet-500' : darkMode ? 'text-white' : 'text-gray-900'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            ),
            delay: 350,
          },
          {
            title: 'Top Class Today',
            icon: Award, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10',
            content: classComparisonData.length > 0 ? (
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className={`font-black text-xl truncate ${darkMode ? 'text-white' : 'text-gray-900'}`} title={classComparisonData[0].fullName}>
                      {classComparisonData[0].fullName}
                    </p>
                    <p className={`text-xs mt-0.5 font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {classComparisonData[0].present} present / {classComparisonData[0].total} total
                    </p>
                  </div>
                  <span className={`text-2xl font-black flex-shrink-0 ${classComparisonData[0].attendanceRate >= 90 ? 'text-emerald-500' : classComparisonData[0].attendanceRate >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {classComparisonData[0].attendanceRate}%
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden mb-3 ${darkMode ? 'bg-white/6' : 'bg-gray-100'}`}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${classComparisonData[0].attendanceRate}%`, background: 'linear-gradient(90deg,#f59e0b,#10b981)' }}
                  />
                </div>
                {classComparisonData.length > 1 && (
                  <p className={`text-xs truncate font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    2nd: {classComparisonData[1].fullName} — {classComparisonData[1].attendanceRate}%
                  </p>
                )}
              </div>
            ) : (
              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>
            ),
            delay: 400,
          },
        ].map((card, i) => (
          <Card key={i} darkMode={darkMode} delay={card.delay} hover>
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <card.icon size={15} className={card.iconColor} />
                </div>
                <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
              </div>
              {card.content}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}