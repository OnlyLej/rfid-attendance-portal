'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Calendar, Users, Clock, TrendingUp, Download, Lock, Eye, EyeOff, LogOut,
  BarChart3, Activity, UserCheck, UserX, AlertCircle, Sun, Moon,
  ChevronRight, Search, RefreshCw, Award, Target, Shield, Bell,
  Filter, ArrowUpDown, X, User, Info, Menu, X as XIcon, LogIn, Sparkles, Zap, ArrowRight,
  Cpu, CheckCircle, RadioTower, Database, Cloud, ShieldCheck, Brain, Network, CloudCog, Globe,
  Monitor, Wifi, Radio, ChevronDown, ChevronUp, ChevronLeft, Home, BookOpen, FileText,
  Loader2, Waves, Signal
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ExcelJS from 'exceljs';

const API_ENDPOINT = '/api/proxy';
const AUTH_ENDPOINT = '/api/auth';
const SESSION_TIMEOUT = 30 * 60 * 1000;
const LOGS_PER_PAGE = 20;

// ─── Hooks ───────────────────────────────────────────────────────────────────
const useFadeIn = (delay = 0) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const useIntersectionObserver = (options = {}) => {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.1, ...options });
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

// ─── App Logo (uses favicon from /app or /public) ────────────────────────────
const AppLogo = ({ size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const sz = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const iconSz = size === 'sm' ? 13 : size === 'lg' ? 20 : 16;

  if (!imgError) {
    return (
      <div className={`${sz} rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-sky-500/20 ${className}`}>
        <img
          src="/favicon.ico"
          alt="Logo"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  // Fallback to gradient icon
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/20 ${className}`}>
      <RadioTower size={iconSz} className="text-white" />
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseLogTimestamp = (str) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const getColorClasses = (color, darkMode, type = 'bg') => {
  const map = {
    green:  { dark: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }, light: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' } },
    red:    { dark: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }, light: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' } },
    blue:   { dark: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' }, light: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' } },
    purple: { dark: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' }, light: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' } },
    orange: { dark: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }, light: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' } },
    gray:   { dark: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }, light: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' } },
    indigo: { dark: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' }, light: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' } },
  };
  const c = map[color] || map.gray;
  return darkMode ? c.dark[type] : c.light[type];
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const Skeleton = ({ className = '', darkMode }) => (
  <div className={`rounded-xl overflow-hidden ${className}`}>
    <div className={`w-full h-full ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200/60'} skeleton-pulse`} />
  </div>
);

// ─── Loading Spinner (Pulse rings) ────────────────────────────────────────────
const PulseLoader = ({ darkMode, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  return (
    <div className="relative flex items-center justify-center">
      <div className={`${sz} rounded-full border-2 border-sky-500/30 animate-ping absolute`} />
      <div className={`${sz} rounded-full border-2 border-sky-500/60 animate-ping absolute`} style={{ animationDelay: '0.2s', animationDuration: '1.4s' }} />
      <div className={`${sz} rounded-full bg-sky-500/20 flex items-center justify-center`}>
        <Signal size={size === 'lg' ? 20 : 14} className="text-sky-500 animate-pulse" />
      </div>
    </div>
  );
};

// ─── Shared UI Components ─────────────────────────────────────────────────────
const Card = ({ children, className = '', darkMode, delay = 0, hover = false }) => {
  const visible = useFadeIn(delay);
  return (
    <div
      className={`
        ${darkMode ? 'bg-gray-800/70 border-gray-700/60' : 'bg-white border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]'}
        border rounded-2xl backdrop-blur-sm
        transition-all duration-500 ease-out
        ${hover ? (darkMode ? 'hover:bg-gray-800 hover:border-gray-600 hover:shadow-lg hover:-translate-y-0.5' : 'hover:border-gray-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)] hover:-translate-y-0.5') : ''}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ─── Animated Stat Card ───────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, darkMode, delay = 0, numericValue = null }) => {
  const [ref, inView] = useIntersectionObserver();
  const visible = useFadeIn(delay);
  const countedVal = useCountUp(numericValue || 0, 900, inView && numericValue !== null);
  const iconBg = getColorClasses(color, darkMode, 'bg');
  const iconText = getColorClasses(color, darkMode, 'text');
  const displayValue = numericValue !== null ? (value.includes('%') ? `${countedVal}%` : countedVal) : value;

  return (
    <div
      ref={ref}
      className={`
        ${darkMode ? 'bg-gray-800/70 border-gray-700/60 hover:bg-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'}
        border rounded-2xl p-4 md:p-5 backdrop-blur-sm
        transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        group relative overflow-hidden
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Subtle shimmer on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${darkMode ? 'bg-gradient-to-br from-white/[0.02] to-transparent' : 'bg-gradient-to-br from-black/[0.01] to-transparent'}`} />
      <div className={`inline-flex p-2.5 rounded-xl ${iconBg} mb-3 transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={20} className={`${iconText} transition-all duration-300`} />
      </div>
      <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} transition-all duration-300 group-hover:scale-105 origin-left`}>{displayValue}</p>
    </div>
  );
};

// ─── Pagination Component ─────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, darkMode }) => {
  if (totalPages <= 1) return null;
  
  const pages = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      pages.push(i);
    }
  }

  const withEllipsis = [];
  let prev = null;
  for (const p of pages) {
    if (prev && p - prev > 1) withEllipsis.push('...');
    withEllipsis.push(p);
    prev = p;
  }

  const btn = `inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200`;
  const active = darkMode ? 'bg-sky-600 text-white shadow-sm scale-105' : 'bg-sky-500 text-white shadow-sm scale-105';
  const inactive = darkMode ? 'text-gray-300 hover:bg-gray-700 hover:scale-105' : 'text-gray-600 hover:bg-gray-100 hover:scale-105';
  const nav = darkMode ? 'text-gray-400 hover:bg-gray-700 hover:scale-105 disabled:opacity-30' : 'text-gray-500 hover:bg-gray-100 hover:scale-105 disabled:opacity-30';

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
        className={`${btn} ${nav}`}>
        <ChevronLeft size={16} />
      </button>
      {withEllipsis.map((p, i) =>
        p === '...'
          ? <span key={i} className={`${btn} ${inactive} cursor-default`}>…</span>
          : <button key={i} onClick={() => onPageChange(p)}
              className={`${btn} ${currentPage === p ? active : inactive}`}>{p}</button>
      )}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        className={`${btn} ${nav}`}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ─── Fetching Overlay ─────────────────────────────────────────────────────────
const FetchingBanner = ({ darkMode, visible }) => (
  <div className={`transition-all duration-500 overflow-hidden ${visible ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
    <div className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${darkMode ? 'bg-sky-900/40 text-sky-400 border-b border-sky-800/40' : 'bg-sky-50 text-sky-600 border-b border-sky-100'}`}>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      Fetching latest data from server…
    </div>
  </div>
);

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
const DashboardTab = ({ darkMode, stats, weekData, students, logs, classes, loading }) => {
  const isMobile = useIsMobile();

  const dailyData = useMemo(() => {
    const days = [];
    const now = new Date();
    const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const today = new Date(phTime);
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Manila' });
      const dayLogs = logs.filter(log => {
        if (!log.timestamp) return false;
        try {
          const logDate = new Date(log.timestamp);
          const logDateString = logDate.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
          return logDateString === dateString;
        } catch { return false; }
      });
      const presentStudents = new Set(dayLogs.filter(l => l.status === 'IN' && l.studentId).map(l => l.studentId));
      const present = presentStudents.size;
      const absent = Math.max(0, students.length - present);
      const rate = students.length > 0 ? Math.round((present / students.length) * 100) : 0;
      days.push({ name: dayName, fullDate: dateString, present, absent, attendanceRate: rate });
    }
    return days;
  }, [logs, students]);

  const weeklyData = useMemo(() => {
    if (!students?.length) return [];
    const totalStudents = students.length;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    const getWeekKey = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const pastDays = Math.floor((d - startOfYear) / 86400000);
      return `${year}-W${String(Math.floor((pastDays + startOfYear.getDay() + 6) / 7)).padStart(2, '0')}`;
    };
    const weekToRelative = new Map();
    let relativeCounter = 1;
    let currentDate = new Date(firstOfMonth);
    while (currentDate <= new Date(currentYear, currentMonth + 1, 0)) {
      const key = getWeekKey(currentDate);
      if (!weekToRelative.has(key)) weekToRelative.set(key, relativeCounter++);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const totalWeeksInMonth = relativeCounter - 1;
    const weekMap = new Map();
    logs?.forEach(log => {
      if (log.status !== 'IN' || !log.studentId || !log.timestamp) return;
      try {
        const logDate = new Date(log.timestamp);
        if (logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth) {
          const weekKey = getWeekKey(logDate);
          if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Set());
          weekMap.get(weekKey).add(log.studentId);
        }
      } catch {}
    });
    const chartData = [];
    for (let relWeek = 1; relWeek <= totalWeeksInMonth; relWeek++) {
      const isoKey = [...weekToRelative.entries()].find(([k, v]) => v === relWeek)?.[0];
      const presentSet = isoKey ? (weekMap.get(isoKey) || new Set()) : new Set();
      const present = presentSet.size;
      const absent = totalStudents - present;
      const rate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
      const weekStartDay = (relWeek - 1) * 7 + 1;
      const weekStart = new Date(currentYear, currentMonth, weekStartDay);
      const isFuture = weekStart > now;
      chartData.push({ name: `W${relWeek}`, present: isFuture ? 0 : present, absent: isFuture ? 0 : absent, avgRate: isFuture ? 0 : rate, isFuture });
    }
    return chartData;
  }, [logs, students]);

  // FIXED: Monthly trend - properly groups by calendar month, counts unique students per day, averages
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const yearShort = year.toString().slice(-2);

      // Filter logs for this exact month/year
      const monthLogs = logs.filter(log => {
        if (!log.timestamp) return false;
        try {
          const logDate = new Date(log.timestamp);
          return logDate.getFullYear() === year && logDate.getMonth() === month;
        } catch { return false; }
      });

      // Group unique students per school day
      const dayStudentMap = new Map(); // dateStr -> Set of studentIds
      monthLogs.forEach(log => {
        if (log.status !== 'IN' || !log.studentId || !log.timestamp) return;
        try {
          const logDate = new Date(log.timestamp);
          const dayOfWeek = logDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) return; // skip weekends
          const dateStr = logDate.toISOString().split('T')[0];
          if (!dayStudentMap.has(dateStr)) dayStudentMap.set(dateStr, new Set());
          dayStudentMap.get(dateStr).add(log.studentId);
        } catch {}
      });

      const schoolDayCount = dayStudentMap.size;
      const totalPresentAcrossDays = [...dayStudentMap.values()].reduce((sum, set) => sum + set.size, 0);
      const avgDailyAttendance = schoolDayCount > 0 ? Math.round(totalPresentAcrossDays / schoolDayCount) : 0;
      const isFuture = date > now && i > 0;

      months.push({
        name: `${monthName} '${yearShort}`,
        attendance: isFuture ? null : avgDailyAttendance,
        days: schoolDayCount,
        month: monthName,
      });
    }
    return months;
  }, [logs]);

  const classComparisonData = useMemo(() => {
    if (!classes || classes.length === 0 || !students || students.length === 0) return [];
    const today = new Date().toISOString().split('T')[0];
    return classes.map(cls => {
      const classStudents = students.filter(s => s.class === cls);
      const todayLogs = logs.filter(log => {
        if (!log.timestamp || log.class !== cls) return false;
        try { return new Date(log.timestamp).toISOString().split('T')[0] === today && log.status === 'IN'; }
        catch { return false; }
      });
      const presentStudents = new Set();
      todayLogs.forEach(log => { if (log.studentId) presentStudents.add(log.studentId); });
      const presentCount = presentStudents.size;
      const totalCount = classStudents.length;
      const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
      return { name: cls.length > 12 ? `${cls.substring(0, 10)}…` : cls, attendanceRate: rate, present: presentCount, total: totalCount };
    }).filter(c => c.total > 0).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [classes, students, logs]);

  const tooltipStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    color: darkMode ? '#e2e8f0' : '#1e293b',
    fontSize: 13,
    padding: '10px 14px',
  };

  const gridColor = darkMode ? '#1e293b' : '#f1f5f9';
  const axisColor = darkMode ? '#475569' : '#94a3b8';
  const chartH = isMobile ? 220 : 280;

  const ChartSkeleton = () => (
    <div className="flex flex-col gap-3 h-full justify-end pb-2">
      <div className="flex items-end gap-2 h-full">
        {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1 items-center">
            <div className={`w-full rounded-t-lg skeleton-pulse ${darkMode ? 'bg-gray-700/60' : 'bg-gray-200/60'}`} style={{ height: `${h * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>{d}</div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Fetching indicator */}
      {loading && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium animate-slide-down
          ${darkMode ? 'bg-sky-900/20 border-sky-800/40 text-sky-400' : 'bg-sky-50 border-sky-100 text-sky-600'}`}>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
          Syncing attendance data…
          <Loader2 size={14} className="animate-spin ml-auto opacity-60" />
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Total Students', value: `${stats.totalStudents}`, numericValue: stats.totalStudents, icon: Users, color: 'blue', delay: 0 },
          { label: 'Present Today', value: `${stats.presentToday}`, numericValue: stats.presentToday, icon: UserCheck, color: 'green', delay: 60 },
          { label: 'Absent Today', value: `${stats.absentToday}`, numericValue: stats.absentToday, icon: UserX, color: 'red', delay: 120 },
          { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, numericValue: stats.attendanceRate, icon: TrendingUp, color: 'purple', delay: 180 },
          { label: 'Week Average', value: dailyData.length > 0 ? `${Math.round(dailyData.reduce((s, d) => s + d.attendanceRate, 0) / dailyData.length)}%` : '0%', numericValue: dailyData.length > 0 ? Math.round(dailyData.reduce((s, d) => s + d.attendanceRate, 0) / dailyData.length) : 0, icon: Calendar, color: 'indigo', delay: 240 },
        ].map((s, i) => <StatCard key={i} {...s} darkMode={darkMode} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly */}
        <Card darkMode={darkMode} delay={100} hover>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <Activity size={14} className="text-sky-500" />
              </div>
              <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Weekly — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton /> : weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', radius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="present" name="Present" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={50} animationDuration={800} animationEasing="ease-out" />
                    <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={50} animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Daily */}
        <Card darkMode={darkMode} delay={150} hover>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Calendar size={14} className="text-emerald-500" />
              </div>
              <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Last 7 Days</h3>
            </div>
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton /> : dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', radius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="present" name="Present" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={50} animationDuration={800} animationEasing="ease-out" />
                    <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={50} animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Monthly trend - FIXED */}
        <Card darkMode={darkMode} delay={200} hover>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <TrendingUp size={14} className="text-violet-500" />
                </div>
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Monthly Trend</h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-700 border border-violet-100'}`}>Avg daily attendance</span>
            </div>
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton /> : monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
                      formatter={(v, n, p) => [
                        v === null ? 'N/A' : `${v} students (${p.payload.days} school days)`,
                        'Avg Daily Present'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="attendance"
                      name="Avg Daily"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#purpleGrad)"
                      dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#fff' }}
                      activeDot={{ r: 7, strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#fff' }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Class performance */}
        <Card darkMode={darkMode} delay={250} hover>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Target size={14} className="text-indigo-500" />
              </div>
              <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Class Performance Today</h3>
            </div>
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton /> : classComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v}% (${p.payload.present}/${p.payload.total})`, 'Attendance']} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
                    <Bar dataKey="attendanceRate" name="Attendance" fill="#6366f1" radius={[0, 5, 5, 0]} maxBarSize={22} animationDuration={900} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No class data</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Today's Summary", icon: Calendar, iconColor: 'text-sky-500', iconBg: 'bg-sky-500/10',
            content: (
              <div className="space-y-3">
                {[
                  { label: 'Check-ins', value: dailyData.length > 0 ? dailyData[dailyData.length - 1].present : 0 },
                  { label: 'Attendance Rate', value: dailyData.length > 0 ? `${dailyData[dailyData.length - 1].attendanceRate}%` : '0%', green: true },
                  { label: 'Absent', value: dailyData.length > 0 ? dailyData[dailyData.length - 1].absent : students.length || 0, red: true },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-center group/row">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{r.label}</span>
                    <span className={`text-sm font-semibold transition-transform duration-200 group-hover/row:scale-105 ${r.green ? 'text-emerald-500' : r.red ? 'text-rose-500' : darkMode ? 'text-white' : 'text-gray-800'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            ), delay: 300
          },
          {
            title: 'Week Summary', icon: TrendingUp, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10',
            content: (
              <div className="space-y-3">
                {[
                  { label: 'Avg Daily Present', value: dailyData.length > 0 ? Math.round(dailyData.reduce((s, d) => s + d.present, 0) / dailyData.length) : 0 },
                  { label: 'Avg Rate', value: dailyData.length > 0 ? `${Math.round(dailyData.reduce((s, d) => s + d.attendanceRate, 0) / dailyData.length)}%` : '0%', purple: true },
                  { label: 'Best Day', value: dailyData.length > 0 && dailyData.some(d => d.present > 0) ? dailyData.reduce((m, d) => d.present > m.present ? d : m, dailyData[0]).name : 'N/A', green: true },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-center group/row">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{r.label}</span>
                    <span className={`text-sm font-semibold transition-transform duration-200 group-hover/row:scale-105 ${r.green ? 'text-emerald-500' : r.purple ? 'text-violet-500' : darkMode ? 'text-white' : 'text-gray-800'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            ), delay: 350
          },
          {
            title: 'Top Class', icon: Award, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10',
            content: classComparisonData.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>{classComparisonData[0].name}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{classComparisonData[0].present}/{classComparisonData[0].total} present</p>
                  </div>
                  <span className={`text-2xl font-bold ${classComparisonData[0].attendanceRate >= 90 ? 'text-emerald-500' : classComparisonData[0].attendanceRate >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>{classComparisonData[0].attendanceRate}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${classComparisonData[0].attendanceRate}%` }} />
                </div>
                {classComparisonData.length > 1 && (
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Runner-up: {classComparisonData[1].name} ({classComparisonData[1].attendanceRate}%)</p>
                )}
              </div>
            ) : <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>,
            delay: 400
          }
        ].map((card, i) => (
          <Card key={i} darkMode={darkMode} delay={card.delay} hover>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon size={14} className={card.iconColor} />
                </div>
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{card.title}</h3>
              </div>
              {card.content}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Classroom Monitor Tab ────────────────────────────────────────────────────
const ClassroomMonitorTab = ({ darkMode, students, classes, searchQuery, setSearchQuery, selectedClass, setSelectedClass, getStudentStatus }) => {
  const isMobile = useIsMobile();

  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter(cn => {
      if (cn.toLowerCase().includes(q)) return true;
      return students.filter(s => s.class === cn).some(s => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
    });
  }, [classes, students, searchQuery]);

  const getFilteredStudents = (cn) => {
    const cs = students.filter(s => s.class === cn);
    if (!searchQuery) return cs;
    const q = searchQuery.toLowerCase();
    return cs.filter(s => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 focus-within:ring-2 focus-within:ring-sky-500/25 ${darkMode ? 'bg-gray-800/70 border-gray-700 focus-within:border-sky-600' : 'bg-white border-gray-200 focus-within:border-sky-400 shadow-sm hover:border-gray-300'}`}>
        <Search size={16} className={`transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="Search class, student, or ID…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Class grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClasses.length === 0 ? (
          <div className={`col-span-full p-10 text-center rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-gray-200'}`}>
            <Search size={32} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No classes match "{searchQuery}"</p>
            <button onClick={() => setSearchQuery('')} className="mt-3 text-sm text-sky-500 hover:text-sky-600 transition-colors">Clear search</button>
          </div>
        ) : filteredClasses.map((cn, idx) => {
          const filteredSt = getFilteredStudents(cn);
          const presentCount = filteredSt.filter(s => getStudentStatus(s.studentId) === 'present').length;
          const absentCount = filteredSt.filter(s => getStudentStatus(s.studentId) === 'absent').length;
          const noLogs = filteredSt.filter(s => getStudentStatus(s.studentId) === 'no-logs').length;
          const rate = filteredSt.length > 0 ? Math.round((presentCount / filteredSt.length) * 100) : 0;
          const isExpanded = selectedClass === cn;

          return (
            <div key={idx}
              className={`
                ${darkMode ? 'bg-gray-800/70 border-gray-700/60 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'}
                border rounded-2xl shadow-sm overflow-hidden
                transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
              `}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <button
                onClick={() => setSelectedClass(isExpanded ? null : cn)}
                className="w-full p-5 text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-800'}`}>{cn}</h3>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{filteredSt.length} students</p>
                  </div>
                  <div className={`p-1 rounded-lg transition-all duration-300 ${darkMode ? 'group-hover:bg-gray-700' : 'group-hover:bg-gray-100'}`}>
                    <ChevronDown size={18} className={`${darkMode ? 'text-gray-400' : 'text-gray-400'} transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Present', count: presentCount, color: 'text-emerald-500', bg: darkMode ? 'bg-emerald-500/5' : 'bg-emerald-50' },
                    { label: 'Absent', count: absentCount, color: 'text-rose-500', bg: darkMode ? 'bg-rose-500/5' : 'bg-rose-50' },
                    { label: 'No Log', count: noLogs, color: 'text-amber-500', bg: darkMode ? 'bg-amber-500/5' : 'bg-amber-50' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-xl p-2 text-center transition-all duration-200 hover:scale-105`}>
                      <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${rate >= 80 ? 'text-emerald-500' : rate >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{rate}%</span>
                </div>
              </button>

              {isExpanded && (
                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} max-h-72 overflow-y-auto`}>
                  {filteredSt.sort((a, b) => a.name.localeCompare(b.name)).map((student, si) => {
                    const status = getStudentStatus(student.studentId);
                    return (
                      <div key={si}
                        className={`flex items-center gap-3 px-5 py-3 border-b last:border-0
                          ${darkMode ? 'border-gray-700/50 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-slate-50'}
                          transition-colors duration-150 group/student`}
                        style={{ animationDelay: `${si * 30}ms` }}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-transform duration-200 group-hover/student:scale-125 ${status === 'present' ? 'bg-emerald-500' : status === 'absent' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{student.name}</p>
                          <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{student.studentId}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all duration-200 ${status === 'present' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : status === 'absent' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-400/10 text-amber-600 dark:text-amber-400'}`}>
                          {status === 'present' ? 'IN' : status === 'absent' ? 'OUT' : '—'}
                        </span>
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
};

// ─── Logs Tab with Pagination ─────────────────────────────────────────────────
const LogsTab = ({ darkMode, loading, logs: allLogs, exportToCSV }) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [currentPage, setCurrentPage] = useState(1);

  const today = new Date().toISOString().split('T')[0];
  const uniqueClasses = useMemo(() => [...new Set(allLogs.map(l => l.class))].sort(), [allLogs]);

  const filteredLogs = useMemo(() => {
    let f = [...allLogs];
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(l => l.studentId?.toLowerCase().includes(q) || l.name?.toLowerCase().includes(q) || l.class?.toLowerCase().includes(q));
    }
    if (dateStart) f = f.filter(l => l.timestamp && l.timestamp.split('T')[0] >= dateStart);
    if (dateEnd) f = f.filter(l => l.timestamp && l.timestamp.split('T')[0] <= dateEnd);
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    if (classFilter !== 'all') f = f.filter(l => l.class === classFilter);
    f.sort((a, b) => sortOrder === 'newest' ? new Date(b.timestamp) - new Date(a.timestamp) : new Date(a.timestamp) - new Date(b.timestamp));
    return f;
  }, [allLogs, search, dateStart, dateEnd, statusFilter, classFilter, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, dateStart, dateEnd, statusFilter, classFilter, sortOrder]);

  const reset = () => { setSearch(''); setSortOrder('newest'); setStatusFilter('all'); setClassFilter('all'); setDateStart(''); setDateEnd(''); };

  const selectCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200 ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-white border-gray-200 text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'} `;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Attendance Logs</h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{filteredLogs.length.toLocaleString()} of {allLogs.length.toLocaleString()} records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}>
            <Filter size={15} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            {!isMobile && 'Filters'}
          </button>
          <button onClick={reset}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <X size={15} />
            {!isMobile && 'Reset'}
          </button>
          <button onClick={() => exportToCSV(filteredLogs)} disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 shadow-sm shadow-emerald-500/25">
            <Download size={15} />
            {!isMobile && 'Export'}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className={`transition-all duration-500 ease-out overflow-hidden ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <Card darkMode={darkMode}>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Search</label>
                <div className="relative">
                  <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, ID, class…" className={`${selectCls} pl-8`} />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
                  <option value="all">All Status</option>
                  <option value="IN">IN Only</option>
                  <option value="OUT">OUT Only</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Class</label>
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={selectCls}>
                  <option value="all">All Classes</option>
                  {uniqueClasses.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sort</label>
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={selectCls}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>From</label>
                <input type="date" value={dateStart} max={today} onChange={e => setDateStart(e.target.value)} className={selectCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
                <input type="date" value={dateEnd} min={dateStart} max={today} onChange={e => setDateEnd(e.target.value)} className={selectCls} />
              </div>
              <div className="flex items-end">
                <button onClick={() => { setDateStart(today); setDateEnd(today); }} className={`w-full px-3 py-2.5 rounded-xl text-xs border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Today</button>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setDateStart(new Date(Date.now() - 7*86400000).toISOString().split('T')[0]); setDateEnd(today); }} className={`w-full px-3 py-2.5 rounded-xl text-xs border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Last 7 days</button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Table / Cards */}
      <Card darkMode={darkMode}>
        {loading ? (
          <div className="p-12 text-center">
            <PulseLoader darkMode={darkMode} size="lg" />
            <p className={`text-sm mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading records…</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={28} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No records match your filters</p>
            <button onClick={reset} className="mt-3 text-sm text-sky-500 hover:text-sky-600 transition-colors">Clear filters</button>
          </div>
        ) : isMobile ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {pagedLogs.map((log, i) => (
              <div key={i} className={`p-4 transition-colors duration-150 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between mb-1">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{log.name}</p>
                  <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>{log.status}</span>
                </div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.studentId} · {log.class}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(log.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  {['Timestamp', 'Student ID', 'Name', 'Class', 'Status'].map(h => (
                    <th key={h} className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                {pagedLogs.map((log, i) => (
                  <tr key={i} className={`transition-colors duration-150 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/80'} group`}>
                    <td className={`px-5 py-3.5 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td className={`px-5 py-3.5 text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{log.studentId}</td>
                    <td className={`px-5 py-3.5 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{log.name}</td>
                    <td className={`px-5 py-3.5 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{log.class}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-200 group-hover:scale-105 ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {filteredLogs.length > 0 && (
          <div className={`border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Showing {((currentPage - 1) * LOGS_PER_PAGE) + 1}–{Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} darkMode={darkMode} />
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── Parent Logs Tab ──────────────────────────────────────────────────────────
const ParentLogsTab = ({ darkMode, loading, logs: allLogs, userInfo, students, exportToCSV, childInfo, childStats, parentChildId }) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const today = new Date().toISOString().split('T')[0];

  const childLogs = useMemo(() => {
    if (!parentChildId) return [];
    return allLogs.filter(l => l.studentId === parentChildId);
  }, [allLogs, parentChildId]);

  const filteredLogs = useMemo(() => {
    let f = [...childLogs];
    if (search) { const q = search.toLowerCase(); f = f.filter(l => l.name?.toLowerCase().includes(q) || l.class?.toLowerCase().includes(q) || l.studentId?.toLowerCase().includes(q)); }
    if (dateStart) f = f.filter(l => l.timestamp && l.timestamp.split('T')[0] >= dateStart);
    if (dateEnd) f = f.filter(l => l.timestamp && l.timestamp.split('T')[0] <= dateEnd);
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    f.sort((a, b) => sortOrder === 'newest' ? new Date(b.timestamp) - new Date(a.timestamp) : new Date(a.timestamp) - new Date(b.timestamp));
    return f;
  }, [childLogs, search, dateStart, dateEnd, statusFilter, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);
  useEffect(() => { setCurrentPage(1); }, [search, dateStart, dateEnd, statusFilter, sortOrder]);

  const selectCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200 ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-white border-gray-200 text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

  return (
    <div className="space-y-5">
      <Card darkMode={darkMode} delay={0}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {userInfo?.fullName ? `Welcome, ${userInfo.fullName.split(' ')[0]}!` : 'Parent Portal'}
              </h2>
              {childInfo && <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tracking: <span className="font-medium">{childInfo.name}</span> · {childInfo.class}</p>}
            </div>
            <button onClick={() => exportToCSV(filteredLogs)} disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex-shrink-0 shadow-sm shadow-emerald-500/25">
              <Download size={15} />
              {!isMobile && 'Export'}
            </button>
          </div>
          {childInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              {[
                { label: 'Student ID', value: childInfo.studentId, color: 'blue' },
                { label: "Today's Logs", value: childStats.todayLogs, color: 'green' },
                { label: 'Total Records', value: childStats.totalLogs, color: 'purple' },
                { label: 'Attendance Rate', value: `${childStats.attendanceRate}%`, color: 'orange' },
              ].map((s, i) => (
                <div key={i} className={`${getColorClasses(s.color, darkMode, 'bg')} border ${getColorClasses(s.color, darkMode, 'border')} rounded-xl p-3 transition-all duration-200 hover:scale-105 cursor-default shadow-sm`}>
                  <p className={`text-xs ${getColorClasses(s.color, darkMode, 'text')} mb-1`}>{s.label}</p>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>{s.value}</p>
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
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Search</label>
              <div className="relative">
                <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, ID…" className={`${selectCls} pl-8`} />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
                <option value="all">All</option>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>From</label>
              <input type="date" value={dateStart} max={today} onChange={e => setDateStart(e.target.value)} className={selectCls} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</label>
              <input type="date" value={dateEnd} min={dateStart} max={today} onChange={e => setDateEnd(e.target.value)} className={selectCls} />
            </div>
          </div>
        </div>
      </Card>

      <Card darkMode={darkMode} delay={150}>
        {loading ? (
          <div className="p-12 text-center">
            <PulseLoader darkMode={darkMode} size="lg" />
            <p className={`text-sm mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading…</p>
          </div>
        ) : !parentChildId ? (
          <div className="p-12 text-center">
            <User size={28} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No child linked to this account</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar size={28} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No records found</p>
          </div>
        ) : (
          <>
            <div className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
              {pagedLogs.map((log, i) => (
                <div key={i} className={`px-5 py-4 flex items-center gap-4 transition-colors duration-150 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-slate-50'} group`}>
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-200 group-hover:scale-105 ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>{log.status}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{log.class}</p>
                  </div>
                  <p className={`text-sm flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
            <div className={`border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3`}>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Showing {((currentPage - 1) * LOGS_PER_PAGE) + 1}–{Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
              </p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} darkMode={darkMode} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

// ─── Landing Page ─────────────────────────────────────────────────────────────
const LandingPage = ({ darkMode, toggleTheme, onLogin, animatedNumbers }) => {
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await onLogin(username, password, setError);
    setLoading(false);
  };

  const arch = [
    { icon: Cpu, title: 'Hardware Layer', subtitle: 'ESP8266 + RFID Readers', color: 'sky', features: ['Real-time card scanning', 'OLED status display', 'WiFi transmission', 'Audio feedback'] },
    { icon: Database, title: 'Backend System', subtitle: 'Google Apps Script', color: 'violet', features: ['Secure API endpoints', 'Role-based access', 'Real-time processing', 'GDPR compliant'] },
    { icon: Monitor, title: 'Web Portal', subtitle: 'Next.js Dashboard', color: 'emerald', features: ['Live analytics', 'Interactive charts', 'Multi-role views', 'Mobile responsive'] },
  ];

  const features = [
    { icon: Users, title: 'Multi-Role Access', desc: 'Separate portals for teachers and parents with granular controls.', color: 'sky' },
    { icon: BarChart3, title: 'Advanced Analytics', desc: 'Real-time charts, trends, and attendance insights.', color: 'violet' },
    { icon: Shield, title: 'Enterprise Security', desc: '256-bit encryption, session tokens, and API protection.', color: 'emerald' },
  ];

  const inp = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-slate-50 text-gray-900'} transition-colors duration-300`}>
      {/* Nav */}
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-300 ${scrolled ? 'shadow-md' : ''} ${darkMode ? 'bg-gray-900/85 border-gray-800' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" />
            <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>RFID Attendance</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm shadow-sky-500/25">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className={`absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-sky-900/20' : 'bg-sky-100/60'}`} />
        <div className={`absolute -bottom-10 -left-10 w-64 h-64 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-violet-900/20' : 'bg-violet-100/40'}`} />

        <div className="text-center space-y-6 max-w-3xl mx-auto relative">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border animate-fade-in-up ${darkMode ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-100 text-sky-600'}`}>
            <Sparkles size={12} className="animate-pulse" /> Enterprise Attendance Solution
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Smart RFID{' '}
            <span className="bg-gradient-to-r from-sky-500 to-violet-500 bg-clip-text text-transparent">Attendance</span>
            {' '}Management
          </h1>
          <p className={`text-lg md:text-xl max-w-xl mx-auto animate-fade-in-up ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ animationDelay: '200ms' }}>
            Real-time tracking, analytics, and multi-role dashboards for modern educational institutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/25 flex items-center gap-2">
              Access Portal <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className={`px-6 py-3 text-sm font-medium rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
              How it works
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
          {[
            { val: `${Math.floor(animatedNumbers.students)}+`, label: 'Students', icon: Users, color: 'sky' },
            { val: `${Math.floor(animatedNumbers.checkins)}+`, label: 'Daily Check-ins', icon: CheckCircle, color: 'emerald' },
            { val: `${animatedNumbers.uptime}%`, label: 'Uptime', icon: Cloud, color: 'violet' },
            { val: `<${Math.round(animatedNumbers.responseTime)}ms`, label: 'Response', icon: Zap, color: 'amber' },
          ].map((s, i) => (
            <div key={i} className={`p-4 rounded-2xl border text-center transition-all duration-300 hover:scale-105 hover:shadow-md cursor-default ${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'}`}
              style={{ animationDelay: `${400 + i * 80}ms` }}>
              <s.icon size={20} className={`mx-auto mb-2 text-${s.color}-500`} />
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{s.val}</p>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section id="how-it-works" className={`max-w-6xl mx-auto px-4 sm:px-6 py-16`}>
        <div className="text-center mb-10">
          <h2 className={`text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Three-Layer Architecture</h2>
          <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hardware, backend, and frontend working seamlessly together</p>
        </div>
        <div className="space-y-3">
          {arch.map((a, i) => (
            <div key={i} onClick={() => setActiveSection(activeSection === i ? null : i)}
              className={`border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'}`}>
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl bg-${a.color}-500/10 transition-transform duration-200 ${activeSection === i ? 'scale-110' : ''}`}>
                    <a.icon size={20} className={`text-${a.color}-500`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{a.title}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.subtitle}</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} transition-transform duration-300 ${activeSection === i ? 'rotate-180' : ''}`} />
              </div>
              <div className={`transition-all duration-400 ease-out overflow-hidden ${activeSection === i ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className={`px-5 pb-5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} pt-4 grid grid-cols-2 md:grid-cols-4 gap-2`}>
                  {a.features.map((f, fi) => (
                    <div key={fi} className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ animationDelay: `${fi * 50}ms` }}>
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={`py-16 ${darkMode ? 'bg-gray-800/20' : 'bg-white/60'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className={`text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Key Features</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default group ${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'}`}>
                <div className={`w-11 h-11 rounded-xl bg-${f.color}-500/10 flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110`}>
                  <f.icon size={20} className={`text-${f.color}-500`} />
                </div>
                <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{f.title}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ready to get started?</h2>
        <p className={`mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Join schools using modern RFID attendance management.</p>
        <button onClick={() => setShowModal(true)} className="px-8 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/25">
          Access the Portal
        </button>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm">
          {[
            { icon: ShieldCheck, label: '256-bit Encryption' },
            { icon: Cloud, label: '99.95% Uptime' },
            { icon: Users, label: 'Multi-role Access' },
          ].map((t, i) => (
            <div key={i} className={`flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <t.icon size={15} className="text-emerald-500" />
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-8 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" />
            <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>RFID Attendance Portal</span>
          </div>
          <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl animate-modal-in ${darkMode ? 'bg-gray-800 border border-gray-700 shadow-2xl' : 'bg-white border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]'}`}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <AppLogo size="sm" />
                  <div>
                    <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Welcome back</h2>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sign in to your account</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" className={inp} required disabled={loading} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className={`${inp} pr-10`} required disabled={loading} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 ${darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm animate-shake ${darkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-md shadow-sky-500/25">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AttendancePortal() {
  const [authenticated, setAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userType, setUserType] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [parentChildId, setParentChildId] = useState(null);
  const [childInfo, setChildInfo] = useState(null);
  const [childStats, setChildStats] = useState({ totalLogs: 0, todayLogs: 0, attendanceRate: 0 });
  const [animatedNumbers, setAnimatedNumbers] = useState({ students: 0, checkins: 0, uptime: 0, responseTime: 150 });

  const isMobile = useIsMobile();

  useEffect(() => {
    if (authenticated) return;
    const targets = { students: 100, checkins: 250, uptime: 99.95, responseTime: 100 };
    let step = 0;
    const totalSteps = 24;
    const timer = setInterval(() => {
      step++;
      const p = Math.min(step / totalSteps, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimatedNumbers({
        students: Math.floor(ease * targets.students),
        checkins: Math.floor(ease * targets.checkins),
        uptime: parseFloat((ease * targets.uptime).toFixed(2)),
        responseTime: Math.floor(150 - ease * 50),
      });
      if (step >= totalSteps) clearInterval(timer);
    }, 70);
    return () => clearInterval(timer);
  }, [authenticated]);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') { setDarkMode(true); document.documentElement.classList.add('dark'); }
    const sessionToken = sessionStorage.getItem('sessionToken');
    const savedUserType = sessionStorage.getItem('userType');
    const savedUserInfo = sessionStorage.getItem('userInfo');
    if (sessionToken && savedUserType) {
      setAuthenticated(true);
      setUserType(savedUserType);
      setUserInfo(savedUserInfo ? JSON.parse(savedUserInfo) : null);
    }
  }, []);

  useEffect(() => {
    if (userType === 'parent' && userInfo && students.length > 0) {
      let childId = userInfo?.studentId || userInfo?.child?.studentId || userInfo?.children?.[0]?.studentId;
      if (!childId && students.length === 1) childId = students[0].studentId;
      setParentChildId(childId);
      if (childId) {
        const cs = students.find(s => s.studentId === childId);
        setChildInfo(cs ? { studentId: cs.studentId, name: cs.name, class: cs.class } : { studentId: childId, name: userInfo?.child?.name || 'My Child', class: 'Unknown' });
      }
    }
  }, [userType, userInfo, students]);

  useEffect(() => {
    if (userType === 'parent' && parentChildId) {
      const cl = logs.filter(l => l.studentId === parentChildId);
      const today = new Date().toISOString().split('T')[0];
      const todayCl = cl.filter(l => l.timestamp?.startsWith(today));
      const uniqueDays = new Set(cl.map(l => l.timestamp?.split('T')[0]));
      const daysIn = new Set(cl.filter(l => l.status === 'IN').map(l => l.timestamp?.split('T')[0]));
      setChildStats({ totalLogs: cl.length, todayLogs: todayCl.length, attendanceRate: uniqueDays.size > 0 ? Math.round((daysIn.size / uniqueDays.size) * 100) : 0 });
    }
  }, [userType, parentChildId, logs]);

  useEffect(() => {
    if (!authenticated) return;
    const check = setInterval(() => { if (Date.now() - lastActivity > SESSION_TIMEOUT) { alert('Session expired'); handleLogout(); } }, 60000);
    return () => clearInterval(check);
  }, [authenticated, lastActivity]);

  useEffect(() => {
    if (!authenticated) return;
    const update = () => setLastActivity(Date.now());
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(e => document.addEventListener(e, update));
    return () => ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(e => document.removeEventListener(e, update));
  }, [authenticated]);

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  const secureApiCall = async (action, params = {}) => {
    const sessionToken = sessionStorage.getItem('sessionToken');
    if (!sessionToken) throw new Error('Not authenticated');
    const qs = new URLSearchParams({ action, sessionToken, ...params }).toString();
    const res = await fetch(`${API_ENDPOINT}?${qs}`, { headers: { 'X-Session-Token': sessionToken } });
    if (!res.ok) { if (res.status === 401) { handleLogout(); throw new Error('Session expired'); } throw new Error('API error'); }
    return res.json();
  };

  const handleLogin = async (username, password, setError) => {
    try {
      const res = await fetch(AUTH_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('sessionToken', data.sessionToken);
        sessionStorage.setItem('userType', data.userType);
        sessionStorage.setItem('userInfo', JSON.stringify(data));
        sessionStorage.setItem('loginTime', Date.now().toString());
        setAuthenticated(true);
        setUserType(data.userType);
        setUserInfo(data);
        setLastActivity(Date.now());
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setAuthenticated(false); setUserType(null); setUserInfo(null); setLogs([]); setChildInfo(null); setParentChildId(null);
    setChildStats({ totalLogs: 0, todayLogs: 0, attendanceRate: 0 });
  };

  const calculateWeeklyData = (logData, studentsList) => {
    if (!logData?.length || !studentsList?.length) return [];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const next = new Date(date); next.setDate(date.getDate() + 1);
      const dayLogs = logData.filter(l => { try { const d = new Date(l.timestamp); return d >= date && d < next; } catch { return false; } });
      const present = new Set(dayLogs.filter(l => l.status === 'IN' && l.studentId).map(l => l.studentId)).size;
      return { name: date.toLocaleDateString('en-US', { weekday: 'short' }), present, absent: Math.max(0, studentsList.length - present), attendanceRate: studentsList.length > 0 ? Math.round((present / studentsList.length) * 100) : 0 };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0]; // 6 months for monthly trend
      const endDate = new Date().toISOString().split('T')[0];
      const data = await secureApiCall('getDashboardStats', { startDate, endDate });
      if (data.success) {
        const sortedLogs = (data.logs || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setStudents(data.students || []);
        setLogs(sortedLogs);
        setStats(data.stats || { totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
        setWeeklyData(calculateWeeklyData(sortedLogs, data.students || []));
        if (userType === 'teacher') {
          try { const cd = await secureApiCall('getClasses'); if (cd.success) setClasses(cd.classes || []); }
          catch { setClasses([...new Set((data.students || []).map(s => s.class))].filter(Boolean)); }
        } else {
          setClasses([...new Set((data.students || []).map(s => s.class))].filter(Boolean));
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getStudentStatus = (studentId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sl = logs.filter(l => {
      if (!l.timestamp || l.studentId !== studentId) return false;
      const d = parseLogTimestamp(l.timestamp);
      return d && d.toISOString().split('T')[0] === todayStr;
    });
    if (sl.length === 0) return 'no-logs';
    const sorted = sl.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const hasIn = sorted.some(l => l.status === 'IN');
    return hasIn ? (sorted[sorted.length - 1].status === 'IN' ? 'present' : 'absent') : 'absent';
  };

  const exportToExcel = async (logsToExport = []) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Records');
    worksheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 25 },
      { header: 'Student ID', key: 'studentId', width: 18 },
      { header: 'Name', key: 'name', width: 35 },
      { header: 'Class', key: 'class', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
    ];
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    logsToExport.forEach(log => worksheet.addRow({ timestamp: log.timestamp, studentId: log.studentId, name: log.name, class: log.class, status: log.status }));
    worksheet.eachRow((row, rn) => {
      if (rn === 1) return;
      row.eachCell((cell, cn) => {
        const isEven = rn % 2 === 0;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF0F9FF' : 'FFFFFFFF' } };
        cell.font = { size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: cn === 3 ? 'left' : 'center' };
        cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        if (cn === 5) {
          const v = cell.value;
          cell.font = { ...cell.font, bold: true, color: { argb: v === 'IN' ? 'FF059669' : 'FFE11D48' } };
        }
      });
    });
    worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: worksheet.rowCount, column: 5 } };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (logsToExport) => exportToExcel(logsToExport || logs);

  useEffect(() => { if (authenticated) fetchData(); }, [authenticated]);

  if (!mounted) return null;

  if (!authenticated) {
    return <LandingPage darkMode={darkMode} toggleTheme={toggleTheme} onLogin={handleLogin} animatedNumbers={animatedNumbers} />;
  }

  const tabs = userType === 'teacher'
    ? [{ name: 'Dashboard', icon: Home }, { name: 'Classroom', icon: Users }, { name: 'Logs', icon: FileText }]
    : [];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-slate-50/80'}`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-all duration-300 ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/95 border-gray-200'} shadow-sm`}>
        {/* Fetching thin progress bar */}
        {loading && (
          <div className="h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-violet-500 animate-loading-bar" />
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Left - Logo */}
            <div className="flex items-center gap-3 min-w-0">
              <AppLogo size="sm" />
              <div className="min-w-0 hidden sm:block">
                <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {userType === 'teacher' ? 'Teacher Portal' : 'Parent Portal'}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} truncate max-w-[180px] md:max-w-xs`} title={userInfo?.fullName || 'User'}>
                  {getGreeting()}, <span className="font-medium">{userInfo?.fullName || 'User'}</span>
                </p>
              </div>
            </div>

            {/* Center tabs (desktop, teacher only) */}
            {!isMobile && userType === 'teacher' && (
              <div className={`flex items-center gap-1 p-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} ${!darkMode ? 'ring-1 ring-gray-200' : ''}`}>
                {tabs.map((tab, i) => (
                  <button key={i} onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === i
                      ? darkMode ? 'bg-gray-700 text-white shadow-sm scale-100' : 'bg-white text-gray-800 shadow-sm'
                      : darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                    } hover:scale-105 active:scale-95`}>
                    <tab.icon size={15} />
                    {tab.name}
                  </button>
                ))}
              </div>
            )}

            {/* Right */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button onClick={fetchData} disabled={loading} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <RefreshCw size={17} className={loading ? 'animate-spin text-sky-500' : ''} />
              </button>
              <button onClick={handleLogout} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <LogOut size={16} />
                {!isMobile && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 ${isMobile && userType === 'teacher' ? 'pb-24' : ''}`}>
        <div className="animate-fade-in-up">
          {userType === 'teacher' ? (
            <>
              {activeTab === 0 && <DashboardTab darkMode={darkMode} stats={stats} weekData={weeklyData} students={students} logs={logs} classes={classes} loading={loading} />}
              {activeTab === 1 && <ClassroomMonitorTab darkMode={darkMode} students={students} classes={classes} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedClass={selectedClass} setSelectedClass={setSelectedClass} getStudentStatus={getStudentStatus} />}
              {activeTab === 2 && <LogsTab darkMode={darkMode} loading={loading} logs={logs} exportToCSV={exportToCSV} />}
            </>
          ) : (
            <ParentLogsTab darkMode={darkMode} loading={loading} logs={logs} userInfo={userInfo} students={students} exportToCSV={exportToCSV} childInfo={childInfo} childStats={childStats} parentChildId={parentChildId} />
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav (teachers only) */}
      {isMobile && userType === 'teacher' && (
        <nav className={`fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl ${darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white border-gray-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]'}`}>
          <div className="flex">
            {tabs.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 active:scale-95 ${activeTab === i
                  ? 'text-sky-500'
                  : darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'
                }`}>
                <tab.icon size={22} className={`transition-transform duration-200 ${activeTab === i ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium">{tab.name}</span>
                <div className={`h-0.5 rounded-full transition-all duration-300 ${activeTab === i ? 'w-5 bg-sky-500' : 'w-0'}`} />
              </button>
            ))}
          </div>
        </nav>
      )}

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
        .animate-slide-down { animation: slide-down 0.3s ease-out both; }
        .animate-modal-in { animation: modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-shake { animation: shake 0.4s ease-out; }
        .animate-loading-bar { animation: loading-bar 1.5s ease-in-out infinite; }
        .skeleton-pulse { animation: skeleton-pulse 1.5s ease-in-out infinite; }
        html { scroll-behavior: smooth; }
        body, html { overflow-x: hidden; }
        * { box-sizing: border-box; }
        @media (max-width: 767px) {
          input, select, textarea { font-size: 16px !important; }
        }
        /* Smooth tab transitions */
        .transition-max-h {
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* Recharts tooltip animation */
        .recharts-tooltip-wrapper {
          transition: transform 0.15s ease-out, opacity 0.15s ease-out !important;
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.35); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.6); }
      `}</style>
    </div>
  );
}