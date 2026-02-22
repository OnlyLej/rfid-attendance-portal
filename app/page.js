'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Calendar, Users, Clock, TrendingUp, Download, Lock, Eye, EyeOff, LogOut,
  BarChart3, Activity, UserCheck, UserX, AlertCircle, Sun, Moon,
  ChevronRight, Search, RefreshCw, Award, Target, Shield, Bell,
  Filter, ArrowUpDown, X, User, Info, Menu, X as XIcon, LogIn, Sparkles, Zap, ArrowRight,
  Cpu, CheckCircle, RadioTower, Database, Cloud, ShieldCheck, Brain, Network, CloudCog, Globe,
  Monitor, Wifi, Radio, ChevronDown, ChevronUp, ChevronLeft, Home, BookOpen, FileText,
  Loader2, Waves, Signal, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import ExcelJS from 'exceljs';

const API_ENDPOINT = '/api/proxy';
const AUTH_ENDPOINT = '/api/auth';
const SESSION_TIMEOUT = 30 * 60 * 1000;
const LOGS_PER_PAGE = 20;
const PH_TZ = 'Asia/Manila';

// ─── ID normalization helper ─────────────────────────────────────────────────
const normalizeId = (id) => (id ?? '').toString().trim().toLowerCase();

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

// ─── Timezone Helpers ────────────────────────────────────────────────────────

const parsePhTimestamp = (str) => {
  if (!str) return null;
  if (typeof str !== 'string') {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  const iso = str.replace(' ', 'T') + '+08:00';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

const getPhTodayStr = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: PH_TZ });
};

const toPhDateStr = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-CA', { timeZone: PH_TZ });
};

const formatPhDateTime = (date, options = {}) => {
  if (!date) return '—';
  return date.toLocaleString('en-PH', { timeZone: PH_TZ, ...options });
};

const parseLogTimestamp = parsePhTimestamp;

const getPhLocalDate = (str) => {
  const d = parsePhTimestamp(str);
  return d ? toPhDateStr(d) : '';
};

// ─── Other Helpers ────────────────────────────────────────────────────────────
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

// ─── App Logo ────────────────────────────────────────────────────────────────
const AppLogo = ({ size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const sz = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const iconSz = size === 'sm' ? 13 : size === 'lg' ? 20 : 16;
  if (!imgError) {
    return (
      <div className={`${sz} rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-sky-500/20 ${className}`}>
        <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" onError={() => setImgError(true)} />
      </div>
    );
  }
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/20 ${className}`}>
      <RadioTower size={iconSz} className="text-white" />
    </div>
  );
};

// ─── Skeleton / Loaders ───────────────────────────────────────────────────────
const Skeleton = ({ className = '', darkMode }) => (
  <div className={`rounded-xl overflow-hidden ${className}`}>
    <div className={`w-full h-full ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200/60'} skeleton-pulse`} />
  </div>
);

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

// ─── Shared Card ──────────────────────────────────────────────────────────────
const Card = ({ children, className = '', darkMode, delay = 0, hover = false }) => {
  const visible = useFadeIn(delay);
  return (
    <div className={`
      ${darkMode ? 'bg-gray-800/70 border-gray-700/60' : 'bg-white border-gray-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)]'}
      border rounded-2xl backdrop-blur-sm
      transition-all duration-500 ease-out
      ${hover ? (darkMode ? 'hover:bg-gray-800 hover:border-gray-600 hover:shadow-lg hover:-translate-y-0.5' : 'hover:border-gray-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5') : ''}
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      ${className}
    `}>
      {children}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, darkMode, delay = 0, numericValue = null, trend = null, trendLabel = '' }) => {
  const [ref, inView] = useIntersectionObserver();
  const visible = useFadeIn(delay);
  const countedVal = useCountUp(numericValue || 0, 900, inView && numericValue !== null);
  const iconBg = getColorClasses(color, darkMode, 'bg');
  const iconText = getColorClasses(color, darkMode, 'text');
  const displayValue = numericValue !== null ? (value.includes('%') ? `${countedVal}%` : countedVal) : value;
  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-rose-500' : darkMode ? 'text-gray-500' : 'text-gray-400';
  const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;

  return (
    <div
      ref={ref}
      className={`
        ${darkMode ? 'bg-gray-800/80 border-gray-700/60 hover:bg-gray-800 hover:border-gray-500' : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-[0_1px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.09)]'}
        border rounded-2xl p-5 backdrop-blur-sm
        transition-all duration-500 ease-out hover:-translate-y-1 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        group relative overflow-hidden
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        color === 'green' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
        color === 'red' ? 'bg-gradient-to-r from-rose-400 to-rose-600' :
        color === 'blue' ? 'bg-gradient-to-r from-sky-400 to-sky-600' :
        color === 'purple' ? 'bg-gradient-to-r from-violet-400 to-violet-600' :
        color === 'indigo' ? 'bg-gradient-to-r from-indigo-400 to-indigo-600' :
        'bg-gradient-to-r from-amber-400 to-amber-600'
      }`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex p-2.5 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={18} className={iconText} />
        </div>
        {trend !== null && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={12} /><span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} transition-all duration-300 group-hover:scale-105 origin-left`}>{displayValue}</p>
      {trendLabel && <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{trendLabel}</p>}
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, darkMode }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) pages.push(i);
  }
  const withEllipsis = [];
  let prev = null;
  for (const p of pages) {
    if (prev && p - prev > 1) withEllipsis.push('...');
    withEllipsis.push(p);
    prev = p;
  }
  const btn = `inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200`;
  const active = darkMode ? 'bg-sky-600 text-white shadow-sm' : 'bg-sky-500 text-white shadow-sm';
  const inactive = darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100';
  const nav = darkMode ? 'text-gray-400 hover:bg-gray-700 disabled:opacity-30' : 'text-gray-500 hover:bg-gray-100 disabled:opacity-30';
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`${btn} ${nav}`}><ChevronLeft size={16} /></button>
      {withEllipsis.map((p, i) =>
        p === '...' ? <span key={i} className={`${btn} cursor-default ${inactive}`}>…</span>
        : <button key={i} onClick={() => onPageChange(p)} className={`${btn} ${currentPage === p ? active : inactive}`}>{p}</button>
      )}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`${btn} ${nav}`}><ChevronRight size={16} /></button>
    </div>
  );
};

// ─── Chart Skeleton ───────────────────────────────────────────────────────────
const ChartSkeleton = ({ darkMode }) => (
  <div className="flex flex-col gap-3 h-full justify-end pb-2">
    <div className="flex items-end gap-2 h-full">
      {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5].map((h, i) => (
        <div key={i} className="flex-1">
          <div className={`w-full rounded-t-lg skeleton-pulse ${darkMode ? 'bg-gray-700/60' : 'bg-gray-200/60'}`} style={{ height: `${h * 100}%` }} />
        </div>
      ))}
    </div>
  </div>
);

const ChartHeader = ({ icon: Icon, title, badge, color = 'sky', darkMode }) => {
  const iconColors = {
    sky: 'bg-sky-500/10 text-sky-500', emerald: 'bg-emerald-500/10 text-emerald-500',
    violet: 'bg-violet-500/10 text-violet-500', indigo: 'bg-indigo-500/10 text-indigo-500',
    amber: 'bg-amber-500/10 text-amber-500',
  };
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl ${iconColors[color]} flex items-center justify-center`}>
          <Icon size={15} />
        </div>
        <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
      </div>
      {badge && (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
          darkMode ? 'bg-gray-700/60 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>{badge}</span>
      )}
    </div>
  );
};

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
const DashboardTab = ({ darkMode, stats, weekData, students, logs, classes, loading }) => {
  const isMobile = useIsMobile();

  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const targetPhStr = targetDate.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: PH_TZ });
      const dayLogs = logs.filter(log => {
        if (!log.timestamp) return false;
        return getPhLocalDate(log.timestamp) === targetPhStr;
      });
      const presentStudents = new Set(
        dayLogs.filter(l => l.status === 'IN' && l.studentId).map(l => normalizeId(l.studentId))
      );
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
    const getWeekOfMonth = (date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      return Math.ceil((date.getDate() + firstDay.getDay()) / 7);
    };
    const totalWeeks = getWeekOfMonth(new Date(currentYear, currentMonth + 1, 0));
    const weekMap = new Map();
    logs?.forEach(log => {
      if (log.status !== 'IN' || !log.studentId || !log.timestamp) return;
      const logDate = parsePhTimestamp(log.timestamp);
      if (!logDate) return;
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
        const logDate = parsePhTimestamp(log.timestamp);
        if (!logDate) return;
        const phLocal = new Date(logDate.toLocaleString('en-US', { timeZone: PH_TZ }));
        if (phLocal.getFullYear() !== targetYear || phLocal.getMonth() !== targetMonth) return;
        const dow = phLocal.getDay();
        if (dow === 0 || dow === 6) return;
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
          const da = parsePhTimestamp(a.timestamp);
          const db = parsePhTimestamp(b.timestamp);
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

  const tooltipStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
    borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    color: darkMode ? '#e2e8f0' : '#1e293b', fontSize: 12, padding: '10px 14px',
  };
  const gridColor = darkMode ? '#1e293b' : '#f1f5f9';
  const axisColor = darkMode ? '#475569' : '#94a3b8';
  const chartH = isMobile ? 220 : 260;
  const weekAvg = dailyData.length > 0 ? Math.round(dailyData.reduce((s, d) => s + d.attendanceRate, 0) / dailyData.length) : 0;

  return (
    <div className="space-y-5">
      {loading && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium
          ${darkMode ? 'bg-sky-900/20 border-sky-800/40 text-sky-400' : 'bg-sky-50 border-sky-100 text-sky-600'}`}>
          <div className="flex gap-1">
            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />)}
          </div>
          Syncing attendance data…
          <Loader2 size={14} className="animate-spin ml-auto opacity-60" />
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Total Students', value: `${stats.totalStudents}`, numericValue: stats.totalStudents, icon: Users, color: 'blue', delay: 0 },
          { label: 'Present Today', value: `${stats.presentToday}`, numericValue: stats.presentToday, icon: UserCheck, color: 'green', delay: 60 },
          { label: 'Absent Today', value: `${stats.absentToday}`, numericValue: stats.absentToday, icon: UserX, color: 'red', delay: 120 },
          { label: "Today's Rate", value: `${stats.attendanceRate}%`, numericValue: stats.attendanceRate, icon: TrendingUp, color: 'purple', delay: 180 },
          { label: 'Week Average', value: `${weekAvg}%`, numericValue: weekAvg, icon: Calendar, color: 'indigo', delay: 240 },
        ].map((s, i) => <StatCard key={i} {...s} darkMode={darkMode} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card darkMode={darkMode} delay={100} hover>
          <div className="p-5">
            <ChartHeader icon={BarChart3} title={`Weekly — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric', timeZone: PH_TZ })}`} color="sky" darkMode={darkMode} />
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton darkMode={darkMode} /> : weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="35%">
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={1}/><stop offset="95%" stopColor="#059669" stopOpacity={0.85}/>
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={1}/><stop offset="95%" stopColor="#e11d48" stopOpacity={0.85}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', radius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: '8px' }} />
                    <Bar dataKey="present" name="Present" fill="url(#presentGrad)" radius={[6,6,0,0]} maxBarSize={44} animationDuration={800} animationEasing="ease-out" />
                    <Bar dataKey="absent" name="Absent" fill="url(#absentGrad)" radius={[6,6,0,0]} maxBarSize={44} animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <BarChart3 size={28} className={darkMode ? 'text-gray-700' : 'text-gray-200'} />
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data for this month</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card darkMode={darkMode} delay={150} hover>
          <div className="p-5">
            <ChartHeader icon={Activity} title="Last 7 Days" badge="Daily attendance" color="emerald" darkMode={darkMode} />
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton darkMode={darkMode} /> : dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dailyPresentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="dailyAbsentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: '8px' }} />
                    <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={2.5} fill="url(#dailyPresentGrad)" dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#fff' }} activeDot={{ r: 6 }} animationDuration={900} />
                    <Area type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" strokeWidth={2} fill="url(#dailyAbsentGrad)" dot={{ fill: '#f43f5e', r: 3, strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#fff' }} activeDot={{ r: 5 }} animationDuration={900} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Activity size={28} className={darkMode ? 'text-gray-700' : 'text-gray-200'} />
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card darkMode={darkMode} delay={200} hover>
          <div className="p-5">
            <ChartHeader icon={TrendingUp} title="Monthly Trend" badge="6 months" color="violet" darkMode={darkMode} />
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton darkMode={darkMode} /> : monthlyData.some(m => m.avgPresent !== null && m.avgPresent > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="monthlyRateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} formatter={(v, name) => [v === null ? '—' : name === 'Avg Rate' ? `${v}%` : `${v} students`, name]} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: '8px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="avgPresent" name="Avg Present" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#monthlyGrad)" dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#fff' }} activeDot={{ r: 6 }} animationDuration={1000} connectNulls={false} />
                    <Area yAxisId="right" type="monotone" dataKey="avgRate" name="Avg Rate" stroke="#06b6d4" strokeWidth={2} fill="url(#monthlyRateGrad)" dot={{ fill: '#06b6d4', r: 3, strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#fff' }} activeDot={{ r: 5 }} animationDuration={1000} connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <TrendingUp size={28} className={darkMode ? 'text-gray-700' : 'text-gray-200'} />
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No monthly data yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card darkMode={darkMode} delay={250} hover>
          <div className="p-5">
            <ChartHeader icon={Target} title="Class Performance Today" color="indigo" darkMode={darkMode} />
            <div style={{ height: chartH }}>
              {loading ? <ChartSkeleton darkMode={darkMode} /> : classComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classComparisonData} layout="vertical" margin={{ top: 4, right: 50, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="classGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={1}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.85}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke={axisColor} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }} formatter={(v, name, props) => { const d = props.payload; return [`${v}% — ${d.present} IN / ${d.absent} OUT / ${d.noLog} no log`, d.fullName]; }} />
                    <Bar dataKey="attendanceRate" name="Rate" fill="url(#classGrad)" radius={[0,6,6,0]} maxBarSize={20} animationDuration={900} animationEasing="ease-out" label={{ position: 'right', fontSize: 11, fontWeight: 600, fill: darkMode ? '#94a3b8' : '#64748b', formatter: v => `${v}%` }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Target size={28} className={darkMode ? 'text-gray-700' : 'text-gray-200'} />
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No class data today</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Today's Summary", icon: Calendar, iconColor: 'text-sky-500', iconBg: 'bg-sky-500/10',
            content: (
              <div className="space-y-3">
                {[
                  { label: 'Check-ins (IN)', value: stats.presentToday },
                  { label: 'Checked Out (OUT)', value: stats.absentToday, red: true },
                  { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, green: true },
                ].map((r, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 border-b last:border-0 ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{r.label}</span>
                    <span className={`text-sm font-bold ${r.green ? 'text-emerald-500' : r.red ? 'text-rose-500' : darkMode ? 'text-white' : 'text-gray-800'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            ), delay: 300
          },
          {
            title: 'Week Snapshot', icon: TrendingUp, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10',
            content: (
              <div className="space-y-3">
                {[
                  { label: 'Avg Daily Present', value: dailyData.length > 0 ? Math.round(dailyData.reduce((s,d) => s+d.present, 0) / dailyData.length) : 0 },
                  { label: 'Avg Rate', value: `${weekAvg}%`, purple: true },
                  { label: 'Best Day', value: dailyData.length > 0 && dailyData.some(d => d.present > 0) ? dailyData.reduce((m,d) => d.present > m.present ? d : m, dailyData[0]).name : '—', green: true },
                ].map((r, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 border-b last:border-0 ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{r.label}</span>
                    <span className={`text-sm font-bold ${r.green ? 'text-emerald-500' : r.purple ? 'text-violet-500' : darkMode ? 'text-white' : 'text-gray-800'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            ), delay: 350
          },
          {
            title: 'Top Class Today', icon: Award, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10',
            content: classComparisonData.length > 0 ? (
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className={`font-bold text-xl truncate ${darkMode ? 'text-white' : 'text-gray-800'}`} title={classComparisonData[0].fullName}>{classComparisonData[0].fullName}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{classComparisonData[0].present} present / {classComparisonData[0].total} total</p>
                  </div>
                  <span className={`text-2xl font-black flex-shrink-0 ${classComparisonData[0].attendanceRate >= 90 ? 'text-emerald-500' : classComparisonData[0].attendanceRate >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>{classComparisonData[0].attendanceRate}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${classComparisonData[0].attendanceRate}%` }} />
                </div>
                {classComparisonData.length > 1 && (
                  <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} title={classComparisonData[1].fullName}>2nd: {classComparisonData[1].fullName} — {classComparisonData[1].attendanceRate}%</p>
                )}
              </div>
            ) : <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>,
            delay: 400
          }
        ].map((card, i) => (
          <Card key={i} darkMode={darkMode} delay={card.delay} hover>
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <card.icon size={15} className={card.iconColor} />
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

// ─── Classroom Monitor Tab ─────────────────────────────────────────────────────
const ClassroomMonitorTab = ({ darkMode, students, classes, searchQuery, setSearchQuery, selectedClass, setSelectedClass, logs }) => {
  const isMobile = useIsMobile();

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
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 focus-within:ring-2 focus-within:ring-sky-500/20
        ${darkMode ? 'bg-gray-800/70 border-gray-700 focus-within:border-sky-600' : 'bg-white border-gray-200 shadow-sm focus-within:border-sky-400 hover:border-gray-300'}`}>
        <Search size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
        <input type="text" placeholder="Search class, student, or ID…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`} />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Legend:</span>
        {[
          { label: 'IN (Present)', color: 'bg-emerald-500', pulse: true },
          { label: 'OUT (Left)', color: 'bg-rose-500', pulse: false },
          { label: 'Absent (No log)', color: 'bg-gray-400', pulse: false },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.color} relative`}>
              {l.pulse && <div className={`absolute inset-0 rounded-full ${l.color} animate-ping opacity-60`} />}
            </div>
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
            <div key={idx} className={`border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5
              ${darkMode ? 'bg-gray-800/80 border-gray-700/60 hover:border-gray-500 hover:bg-gray-800' : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-md'}`}>
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
                      <div key={si} className={`flex items-center gap-3 px-5 py-3 border-b last:border-0 transition-colors duration-150
                        ${darkMode ? 'border-gray-700/40 hover:bg-gray-700/30' : 'border-gray-100/80 hover:bg-slate-50'}`}>
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
};

// ─── Logs Tab ─────────────────────────────────────────────────────────────────
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

  const today = getPhTodayStr();
  const uniqueClasses = useMemo(() => [...new Set(allLogs.map(l => l.class))].sort(), [allLogs]);

  const filteredLogs = useMemo(() => {
    let f = [...allLogs];
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(l => normalizeId(l.studentId).includes(q) || l.name?.toLowerCase().includes(q) || l.class?.toLowerCase().includes(q));
    }
    if (dateStart) f = f.filter(l => getPhLocalDate(l.timestamp) >= dateStart);
    if (dateEnd)   f = f.filter(l => getPhLocalDate(l.timestamp) <= dateEnd);
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    if (classFilter  !== 'all') f = f.filter(l => l.class  === classFilter);
    f.sort((a, b) => {
      const da = parsePhTimestamp(a.timestamp);
      const db = parsePhTimestamp(b.timestamp);
      return sortOrder === 'newest' ? (db?.getTime() ?? 0) - (da?.getTime() ?? 0) : (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
    });
    return f;
  }, [allLogs, search, dateStart, dateEnd, statusFilter, classFilter, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);
  useEffect(() => setCurrentPage(1), [search, dateStart, dateEnd, statusFilter, classFilter, sortOrder]);
  const reset = () => { setSearch(''); setSortOrder('newest'); setStatusFilter('all'); setClassFilter('all'); setDateStart(''); setDateEnd(''); };

  const selectCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200
    ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-white border-gray-200 text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

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
          <button onClick={() => exportToCSV(filteredLogs)} disabled={filteredLogs.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 shadow-sm shadow-emerald-500/25">
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
                  <option value="all">All Status</option>
                  <option value="IN">IN Only</option>
                  <option value="OUT">OUT Only</option>
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
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
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
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>{log.status}</span>
                </div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.studentId} · {log.class}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatTs(log.timestamp)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '22%' }} /><col style={{ width: '14%' }} />
                <col style={{ width: '30%' }} /><col style={{ width: '22%' }} /><col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  {['Timestamp (PH Time)', 'Student ID', 'Name', 'Class', 'Status'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700/40' : 'divide-gray-50'}`}>
                {pagedLogs.map((log, i) => (
                  <tr key={i} className={`transition-colors duration-100 group ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-slate-50/80'}`}>
                    <td className={`px-5 py-3.5 text-sm overflow-hidden ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}><span className="block truncate">{formatTs(log.timestamp)}</span></td>
                    <td className={`px-5 py-3.5 text-sm font-mono overflow-hidden ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><span className="block truncate" title={log.studentId}>{log.studentId}</span></td>
                    <td className={`px-5 py-3.5 text-sm font-semibold overflow-hidden`}><span className={`block truncate ${darkMode ? 'text-white' : 'text-gray-800'}`} title={log.name}>{log.name}</span></td>
                    <td className={`px-5 py-3.5 text-sm overflow-hidden`}><span className={`block truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={log.class}>{log.class}</span></td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>{log.status}</span>
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
};

// ─── Parent Logs Tab ──────────────────────────────────────────────────────────
// Supports multiple children. Shows a child-selector pill row when >1 child is linked.
// 'all' pseudo-ID shows combined logs across all children.
const ParentLogsTab = ({ darkMode, loading, logs: allLogs, userInfo, students, exportToCSV, childrenInfo, selectedChildId, setSelectedChildId }) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const today = getPhTodayStr();
  const hasMultipleChildren = childrenInfo.length > 1;

  // The child(ren) whose logs we want to show
  const activeChildIds = useMemo(() => {
    if (!hasMultipleChildren || selectedChildId === 'all') {
      return childrenInfo.map(c => normalizeId(c.studentId));
    }
    return [normalizeId(selectedChildId)];
  }, [childrenInfo, selectedChildId, hasMultipleChildren]);

  // Current child info for header display (null when 'all')
  const activeChildInfo = useMemo(() => {
    if (!hasMultipleChildren || selectedChildId === 'all') return null;
    return childrenInfo.find(c => normalizeId(c.studentId) === normalizeId(selectedChildId)) || null;
  }, [childrenInfo, selectedChildId, hasMultipleChildren]);

  // Logs scoped to active child(ren)
  const childLogs = useMemo(() => {
    if (!activeChildIds.length) return [];
    return allLogs.filter(l => l.studentId && activeChildIds.includes(normalizeId(l.studentId)));
  }, [allLogs, activeChildIds]);

  // Per-child stats (for the stat cards row)
  const activeStats = useMemo(() => {
    const todayPhStr = getPhTodayStr();
    const todayCl = childLogs.filter(l => getPhLocalDate(l.timestamp) === todayPhStr);
    const uniqueDays = new Set(childLogs.map(l => getPhLocalDate(l.timestamp)).filter(Boolean));
    const daysIn = new Set(
      childLogs.filter(l => l.status === 'IN').map(l => getPhLocalDate(l.timestamp)).filter(Boolean)
    );
    return {
      totalLogs: childLogs.length,
      todayLogs: todayCl.length,
      attendanceRate: uniqueDays.size > 0 ? Math.round((daysIn.size / uniqueDays.size) * 100) : 0,
    };
  }, [childLogs]);

  const filteredLogs = useMemo(() => {
    let f = [...childLogs];
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(l => l.name?.toLowerCase().includes(q) || l.class?.toLowerCase().includes(q) || normalizeId(l.studentId).includes(q));
    }
    if (dateStart) f = f.filter(l => getPhLocalDate(l.timestamp) >= dateStart);
    if (dateEnd)   f = f.filter(l => getPhLocalDate(l.timestamp) <= dateEnd);
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    f.sort((a, b) => {
      const da = parsePhTimestamp(a.timestamp);
      const db = parsePhTimestamp(b.timestamp);
      return sortOrder === 'newest' ? (db?.getTime() ?? 0) - (da?.getTime() ?? 0) : (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
    });
    return f;
  }, [childLogs, search, dateStart, dateEnd, statusFilter, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((currentPage-1)*LOGS_PER_PAGE, currentPage*LOGS_PER_PAGE);
  useEffect(() => setCurrentPage(1), [search, dateStart, dateEnd, statusFilter, sortOrder, selectedChildId]);

  const selectCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200
    ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-white border-gray-200 text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

  const formatTs = (ts) => {
    const d = parsePhTimestamp(ts);
    return d ? d.toLocaleString('en-PH', { timeZone: PH_TZ, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  };
  const formatDate = (ts) => {
    const d = parsePhTimestamp(ts);
    return d ? d.toLocaleDateString('en-PH', { timeZone: PH_TZ, weekday: 'short', month: 'short', day: 'numeric' }) : '—';
  };
  const formatTime = (ts) => {
    const d = parsePhTimestamp(ts);
    return d ? d.toLocaleTimeString('en-PH', { timeZone: PH_TZ, hour: '2-digit', minute: '2-digit' }) : '—';
  };

  // Export filename uses active child name(s)
  const handleExport = () => {
    const suffix = activeChildInfo ? `_${activeChildInfo.name.replace(/\s+/g, '_')}` : '_all_children';
    exportToCSV(filteredLogs, suffix);
  };

  return (
    <div className="space-y-5">

      {/* ── Welcome / header card ── */}
      <Card darkMode={darkMode} delay={0}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {userInfo?.fullName ? `Welcome, ${userInfo.fullName.split(' ')[0]}!` : 'Parent Portal'}
              </h2>
              {childrenInfo.length > 0 && (
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {hasMultipleChildren
                    ? `Tracking ${childrenInfo.length} children`
                    : <>Tracking: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`} title={childrenInfo[0]?.name}>{childrenInfo[0]?.name}</span> · {childrenInfo[0]?.class}</>}
                </p>
              )}
            </div>
            <button onClick={handleExport} disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0 shadow-sm shadow-emerald-500/25">
              <Download size={15} />{!isMobile && 'Export'}
            </button>
          </div>

          {/* ── Child selector pills (multi-child only) ── */}
          {hasMultipleChildren && (
            <div className="mb-4">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>View records for:</p>
              <div className="flex flex-wrap gap-2">
                {/* "All children" pill */}
                <button
                  onClick={() => setSelectedChildId('all')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 hover:scale-105 active:scale-95
                    ${selectedChildId === 'all'
                      ? 'bg-sky-500 border-sky-500 text-white shadow-sm shadow-sky-500/25'
                      : darkMode ? 'border-gray-600 text-gray-300 hover:border-sky-500 hover:text-sky-400' : 'border-gray-200 text-gray-600 hover:border-sky-400 hover:text-sky-600'
                    }`}
                >
                  <Users size={12} />
                  All Children
                </button>
                {/* Per-child pills */}
                {childrenInfo.map((child, i) => {
                  const isActive = normalizeId(selectedChildId) === normalizeId(child.studentId);
                  const gradients = [
                    ['#34d399','#14b8a6'], // emerald→teal
                    ['#a78bfa','#a855f7'], // violet→purple
                    ['#fbbf24','#f97316'], // amber→orange
                    ['#fb7185','#ec4899'], // rose→pink
                  ];
                  const [c1, c2] = gradients[i % gradients.length];
                  return (
                    <button
                      key={child.studentId}
                      onClick={() => setSelectedChildId(child.studentId)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 hover:scale-105 active:scale-95
                        ${isActive
                          ? 'text-white border-transparent shadow-sm'
                          : darkMode ? 'border-gray-600 text-gray-300 hover:border-gray-400 bg-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                        }`}
                      style={isActive ? { background: `linear-gradient(135deg, ${c1}, ${c2})` } : {}}
                    >
                      <User size={12} />
                      <span className="max-w-[120px] truncate" title={child.name}>{child.name.split(' ')[0]}</span>
                      {isActive && (
                        <span className="bg-white/25 px-1.5 py-0.5 rounded-full text-[10px]">{child.class}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Child info row (single child or selected specific child) ── */}
          {(activeChildInfo || (!hasMultipleChildren && childrenInfo[0])) && (() => {
            const child = activeChildInfo || childrenInfo[0];
            return (
              <div className={`rounded-xl p-3.5 border mb-4 ${darkMode ? 'bg-gray-700/40 border-gray-600/40' : 'bg-slate-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0`}>
                    <User size={16} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`} title={child.name}>{child.name}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="font-mono">{child.studentId}</span> · {child.class}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Stats grid ── */}
          {childrenInfo.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: hasMultipleChildren && selectedChildId === 'all' ? 'Children Tracked' : 'Student ID', value: hasMultipleChildren && selectedChildId === 'all' ? childrenInfo.length : (activeChildInfo || childrenInfo[0])?.studentId, color: 'blue' },
                { label: "Today's Logs",    value: activeStats.todayLogs,         color: 'green'  },
                { label: 'Total Records',   value: activeStats.totalLogs,         color: 'purple' },
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

      {/* ── Filters ── */}
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
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
                <option value="all">All</option>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
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

      {/* ── Logs list ── */}
      <Card darkMode={darkMode} delay={150}>
        {(loading || (!childrenInfo.length && !students.length)) ? (
          <div className="p-12 text-center"><PulseLoader darkMode={darkMode} size="lg" /></div>
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
                <div key={i} className={`px-5 py-4 flex items-center gap-4 transition-colors duration-150 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-slate-50'} group`}>
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>{log.status}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatDate(log.timestamp)}</p>
                      {/* Show child name badge when viewing 'all' in multi-child mode */}
                      {hasMultipleChildren && selectedChildId === 'all' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`} title={log.studentId}>
                          {(() => {
                            const child = childrenInfo.find(c => normalizeId(c.studentId) === normalizeId(log.studentId));
                            return child ? child.name.split(' ')[0] : log.studentId;
                          })()}
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
};

// ─── Landing Page ─────────────────────────────────────────────────────────────
const LandingPage = ({ darkMode, toggleTheme, onLogin, animatedNumbers }) => {
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeFaq, setActiveFaq] = useState(null);
  const heroRef = useRef(null);

  const [liveStats, setLiveStats] = useState({ students: 124, present: 108, absent: 16, rate: 87, checkins: 251, uptime: 99.95, responseTime: 112 });
  const [statFlash, setStatFlash] = useState({});

  useEffect(() => {
    const tick = setInterval(() => {
      setLiveStats(prev => {
        const rand = (base, spread) => Math.max(0, base + Math.round((Math.random() - 0.5) * spread));
        const students = rand(prev.students, 4);
        const present  = Math.min(students, rand(prev.present, 5));
        const absent   = students - present;
        const rate     = students > 0 ? Math.round((present / students) * 100) : 0;
        const checkins = rand(prev.checkins, 6);
        const uptime   = Math.min(100, Math.max(99, parseFloat((prev.uptime + (Math.random() - 0.5) * 0.02).toFixed(2))));
        const responseTime = Math.max(80, Math.min(180, rand(prev.responseTime, 8)));
        const changed = {};
        if (students !== prev.students) changed.students = true;
        if (present  !== prev.present)  changed.present  = true;
        if (absent   !== prev.absent)   changed.absent   = true;
        if (checkins !== prev.checkins) changed.checkins = true;
        if (responseTime !== prev.responseTime) changed.responseTime = true;
        setStatFlash(changed);
        return { students, present, absent, rate, checkins, uptime, responseTime };
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (Object.keys(statFlash).length === 0) return;
    const t = setTimeout(() => setStatFlash({}), 400);
    return () => clearTimeout(t);
  }, [statFlash]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature(p => (p + 1) % 4), 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    await onLogin(username, password, setError);
    setLoading(false);
  };

  const inp = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200
    ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

  const features = [
    { icon: Cpu, label: 'Hardware Layer', color: 'sky', gradient: 'from-sky-500 to-cyan-400', title: 'ESP8266 RFID Readers', desc: 'Physical RFID scanners at every entry point. Students tap their card and attendance is logged in under 200ms — no manual input, no errors.', bullets: ['Dual-band WiFi transmission', 'OLED status display', 'Audio & visual feedback', 'Tamper-resistant casing'] },
    { icon: Database, label: 'Secure Backend', color: 'violet', gradient: 'from-violet-500 to-purple-400', title: 'Google Apps Script API', desc: 'Role-based API endpoints process every scan instantly. Data is encrypted at rest and in transit, with full audit trails.', bullets: ['Session token auth', 'Role-based access control', 'Real-time processing', 'GDPR compliant logging'] },
    { icon: BarChart3, label: 'Analytics', color: 'emerald', gradient: 'from-emerald-500 to-teal-400', title: 'Live Dashboard Analytics', desc: 'Beautiful charts, daily/weekly/monthly trends, and class comparisons. Export any view to Excel in one click.', bullets: ['7-day & monthly trends', 'Class performance ranking', 'Export to Excel/CSV', 'Mobile-responsive'] },
    { icon: Bell, label: 'Parent Portal', color: 'amber', gradient: 'from-amber-500 to-orange-400', title: 'Real-Time Parent Visibility', desc: "Parents see their child's check-in and check-out in real time. Supports multiple children per account with per-child or combined views.", bullets: ['Multi-child support', 'Per-child attendance log', 'Historical records', 'Exportable history'] },
  ];

  const faqs = [
    { q: 'What RFID hardware is required?', a: 'Any standard 125kHz or 13.56MHz RFID card/fob works. The reader units run on ESP8266 microcontrollers connected to your school WiFi. Setup takes under 30 minutes per unit.' },
    { q: 'How is student data protected?', a: 'All data is encrypted in transit (TLS 1.3) and at rest. Session tokens expire after 30 minutes of inactivity. No personally identifiable data is stored on the hardware itself.' },
    { q: 'Can parents access admin features?', a: "No. The parent portal is strictly read-only, scoped to their own children's records. Teachers and administrators have separate credential tiers." },
    { q: 'Can one parent account track multiple children?', a: 'Yes. A parent account can be linked to multiple students. The portal shows a child-selector to switch between individual views or see all records combined.' },
    { q: 'What happens if the WiFi goes down?', a: 'The ESP8266 reader queues scans locally and syncs automatically when connectivity is restored. No attendance data is lost during outages.' },
    { q: 'How do I export attendance records?', a: 'Click Export on any filtered view in the Logs tab. Records download as a formatted Excel (.xlsx) file with color-coded statuses and auto-filters pre-applied.' },
  ];

  const steps = [
    { step: '01', icon: Wifi,     title: 'Student taps RFID card',   desc: 'The ESP8266 reader at the classroom door instantly detects the card and reads the unique UID in under 50ms.', gradient: 'from-sky-500 to-cyan-400',     accent: '#0ea5e9' },
    { step: '02', icon: CloudCog, title: 'WiFi transmission to API',  desc: 'The reader sends the UID, timestamp, and reader ID to the Google Apps Script endpoint over HTTPS.',          gradient: 'from-violet-500 to-purple-400', accent: '#7c3aed' },
    { step: '03', icon: Database, title: 'Data stored & classified',  desc: 'The log is written to Google Sheets in real time with the student name, class, IN/OUT status, and PH-timezone timestamp.', gradient: 'from-indigo-500 to-blue-400', accent: '#6366f1' },
    { step: '04', icon: Monitor,  title: 'Dashboard updates live',    desc: 'Teachers see the attendance count update in real time. Charts, class comparisons, and parent portals all reflect the new data.', gradient: 'from-emerald-500 to-teal-400', accent: '#10b981' },
  ];

  const px = mousePos.x;
  const py = mousePos.y;
  const flashCls = (key) => statFlash[key] ? 'scale-110 text-sky-400 transition-all duration-150' : 'transition-all duration-300';

  return (
    <div className={`min-h-screen overflow-x-hidden ${darkMode ? 'bg-[#080c14] text-white' : 'bg-[#f7f9fc] text-gray-900'} transition-colors duration-300`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] transition-[left,top] duration-1000 ease-out ${darkMode ? 'bg-sky-900/25' : 'bg-sky-200/50'}`} style={{ left: `${-10 + px * 15}%`, top: `${-10 + py * 10}%` }} />
        <div className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] transition-[right,bottom] duration-[1400ms] ease-out ${darkMode ? 'bg-violet-900/20' : 'bg-violet-100/60'}`} style={{ right: `${-5 + (1 - px) * 12}%`, bottom: `${10 + py * 8}%` }} />
        <div className={`absolute w-[300px] h-[300px] rounded-full blur-[80px] ${darkMode ? 'bg-emerald-900/15' : 'bg-emerald-100/40'}`} style={{ left: '40%', top: '60%' }} />
      </div>

      <nav className={`sticky top-0 z-50 border-b backdrop-blur-2xl transition-all duration-500 ${scrolled ? 'shadow-lg shadow-black/5' : ''} ${darkMode ? 'bg-[#080c14]/80 border-white/5' : 'bg-white/80 border-black/5'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <span className={`font-black text-sm tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>RFID Attendance</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {['Features', 'How It Works', 'FAQ'].map((item) => (
              <button key={item} onClick={() => document.getElementById(item.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' })} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'}`}>{item}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-black/5 text-gray-500'}`}>
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => setShowModal(true)} className="relative px-4 py-2 text-sm font-bold text-white rounded-xl overflow-hidden group transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/30" style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
              <span className="relative z-10 flex items-center gap-1.5"><LogIn size={14} /> Sign In</span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:pt-28 md:pb-36" style={{ zIndex: 1 }}>
        <div className="flex justify-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border backdrop-blur-sm animate-fade-in-up ${darkMode ? 'bg-white/5 border-white/10 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            Live · {liveStats.present} students present right now
          </div>
        </div>
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tighter animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className={darkMode ? 'text-white' : 'text-gray-900'}>Attendance, </span>
            <br className="hidden md:block" />
            <span className="relative inline-block">
              <span style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 50%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Automated.</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
                <path d="M0 5 Q50 0 100 4 Q150 8 200 3" stroke="url(#heroUnderlineGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <defs><linearGradient id="heroUnderlineGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="50%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs>
              </svg>
            </span>
          </h1>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in-up ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ animationDelay: '0.2s' }}>
            RFID card taps replace manual roll-calls. Real-time dashboards, parent portals with multi-child support, and one-click Excel exports — built for Philippine schools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button onClick={() => setShowModal(true)} className="group relative px-7 py-3.5 text-sm font-bold text-white rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-sky-500/30 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)' }}>
              <span className="relative z-10 flex items-center gap-2">Access Portal <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" /></span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className={`px-7 py-3.5 text-sm font-bold rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
              See how it works <ChevronDown size={16} />
            </button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
          {[
            { key: 'students',     val: `${liveStats.students}`,        label: 'Students Enrolled', icon: Users,       accent: '#0ea5e9' },
            { key: 'checkins',     val: `${liveStats.checkins}+`,       label: "Today's Check-ins", icon: CheckCircle, accent: '#10b981' },
            { key: 'uptime',       val: `${liveStats.uptime}%`,         label: 'System Uptime',     icon: Cloud,       accent: '#7c3aed' },
            { key: 'responseTime', val: `<${liveStats.responseTime}ms`, label: 'Scan Response',     icon: Zap,         accent: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className={`group relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default text-center ${darkMode ? 'bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />
              <s.icon size={20} className="mx-auto mb-2.5" style={{ color: s.accent }} />
              <p className={`text-2xl font-black tabular-nums inline-block ${flashCls(s.key)} ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.val}</p>
              <p className={`text-xs mt-1 font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 relative animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-30 ${darkMode ? 'bg-gradient-to-br from-sky-800 to-violet-800' : 'bg-gradient-to-br from-sky-200 to-violet-200'}`} />
          <div className={`relative rounded-3xl border overflow-hidden ${darkMode ? 'bg-gray-900/80 border-white/8' : 'bg-white border-gray-200 shadow-xl'}`}>
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${darkMode ? 'border-white/5 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex gap-1.5">{['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}</div>
              <div className={`flex-1 mx-4 px-3 py-1 rounded-lg text-xs font-mono ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>rfid-attendance.vercel.app</div>
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Live</span>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total Students', val: liveStats.students, color: '#0ea5e9', flashKey: 'students', suffix: '' },
                  { label: 'Present Today',  val: liveStats.present,  color: '#10b981', flashKey: 'present',  suffix: '' },
                  { label: 'Absent Today',   val: liveStats.absent,   color: '#f43f5e', flashKey: 'absent',   suffix: '' },
                  { label: "Today's Rate",   val: liveStats.rate,     color: '#7c3aed', flashKey: 'rate',     suffix: '%' },
                ].map((c, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/70 border-gray-700/50' : 'bg-slate-50 border-gray-100'}`}>
                    <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{c.label}</p>
                    <p className={`text-xl font-black tabular-nums inline-block transition-all duration-200 ${statFlash[c.flashKey] ? 'scale-110' : ''}`} style={{ color: c.color }}>{c.val}{c.suffix}</p>
                  </div>
                ))}
              </div>
              <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800/70 border-gray-700/50' : 'bg-slate-50 border-gray-100'}`}>
                <p className={`text-xs font-bold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Weekly Attendance</p>
                <div className="flex items-end gap-2 h-16">
                  {[72, 85, 78, 90, 83, 88, liveStats.rate].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-lg transition-all duration-500" style={{ height: `${Math.max(8, h)}%`, background: i === 6 ? 'linear-gradient(to top, #0ea5e9, #7c3aed)' : darkMode ? '#1e293b' : '#e2e8f0' }} />
                      <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{['M','T','W','T','F','S','S'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-16 rounded-b-3xl ${darkMode ? 'bg-gradient-to-t from-[#080c14]' : 'bg-gradient-to-t from-[#f7f9fc]'}`} />
        </div>
      </section>

      <section id="features" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20" style={{ zIndex: 1 }}>
        <div className="text-center mb-12">
          <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>Platform Features</p>
          <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Everything you need,<br />nothing you don't</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            {features.map((f, i) => (
              <button key={i} onClick={() => setActiveFeature(i)} className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${activeFeature === i ? darkMode ? 'bg-white/6 border-white/15 shadow-lg' : 'bg-white border-gray-200 shadow-lg' : darkMode ? 'border-white/4 hover:bg-white/4 hover:border-white/10' : 'border-transparent hover:bg-white hover:border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${activeFeature === i ? `bg-gradient-to-br ${f.gradient}` : darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <f.icon size={15} className={activeFeature === i ? 'text-white' : darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${activeFeature === i ? darkMode ? 'text-sky-400' : 'text-sky-600' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{f.label}</p>
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.title}</p>
                  </div>
                  <ChevronRight size={16} className={`ml-auto transition-all duration-300 ${activeFeature === i ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                {activeFeature === i && (
                  <div className="mt-3 pl-11 space-y-2">
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                      {f.bullets.map((b, bi) => (
                        <div key={bi} className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />{b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className={`sticky top-24 rounded-3xl border overflow-hidden ${darkMode ? 'bg-gray-900/60 border-white/8' : 'bg-white border-gray-200 shadow-xl'}`} style={{ minHeight: '340px' }}>
            {features.map((f, i) => (
              <div key={i} className={`transition-all duration-500 ${activeFeature === i ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
                <div className={`h-2 w-full bg-gradient-to-r ${f.gradient}`} />
                <div className="p-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br ${f.gradient}`}><f.icon size={26} className="text-white" /></div>
                  <h3 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {f.bullets.map((b, bi) => (
                      <div key={bi} className={`flex items-center gap-3 p-3 rounded-xl border ${darkMode ? 'border-white/5 bg-white/3' : 'border-gray-100 bg-slate-50'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${f.gradient}`}><CheckCircle size={12} className="text-white" /></div>
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`relative py-20 ${darkMode ? 'bg-white/2' : 'bg-white'}`} style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Process</p>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>From tap to dashboard<br />in 200 milliseconds</h2>
          </div>
          <div className="relative">
            <div className={`absolute top-8 bottom-8 w-px ${darkMode ? 'bg-gradient-to-b from-sky-500 via-violet-500 to-emerald-500' : 'bg-gradient-to-b from-sky-300 via-violet-300 to-emerald-300'}`} style={{ left: '31px' }} />
            <div className="space-y-6">
              {steps.map((item, i) => (
                <div key={i} className="relative flex gap-5 items-start group">
                  <div className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br ${item.gradient} transition-transform duration-300 group-hover:scale-105`}>
                    <item.icon size={24} className="text-white" />
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border-2 ${darkMode ? 'bg-gray-900' : 'bg-white'}`} style={{ color: item.accent, borderColor: item.accent }}>{i + 1}</div>
                  </div>
                  <div className={`flex-1 p-5 rounded-2xl border transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md ${darkMode ? 'bg-white/3 border-white/6 hover:border-white/12' : 'bg-slate-50 border-gray-100 hover:border-gray-200 hover:bg-white'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: item.accent }}>Step {item.step}</p>
                    <h3 className={`text-base font-black mb-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`relative py-14 overflow-hidden ${darkMode ? 'bg-white/2' : 'bg-white'}`} style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className={`p-8 md:p-10 rounded-3xl border overflow-hidden relative ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-white/8' : 'bg-gradient-to-br from-slate-900 to-gray-800 border-transparent'}`}>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 blur-3xl bg-sky-400" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10 blur-2xl bg-violet-400" />
            <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-4"><Shield size={20} className="text-sky-400" /><span className="text-sky-400 text-xs font-bold uppercase tracking-widest">Enterprise Security</span></div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">Your data stays yours.</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Every request is authenticated with a rotating session token. Connections use TLS 1.3. No attendance data is stored on the hardware itself — only the school's backend holds student records.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield,      label: 'TLS 1.3 Encryption', val: '256-bit'   },
                  { icon: Clock,       label: 'Session Timeout',    val: '30 min'    },
                  { icon: Database,    label: 'Data Isolation',     val: 'Per-role'  },
                  { icon: CheckCircle, label: 'Audit Logs',         val: 'Full trail'},
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/8">
                    <s.icon size={16} className="text-sky-400 mb-2" />
                    <p className="text-white font-bold text-lg">{s.val}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20" style={{ zIndex: 1 }}>
        <div className="text-center mb-12">
          <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>FAQ</p>
          <h2 className={`text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Common questions</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className={`rounded-2xl border overflow-hidden transition-all duration-300 ${activeFaq === i ? darkMode ? 'bg-white/5 border-white/12' : 'bg-white border-gray-200 shadow-md' : darkMode ? 'border-white/5 hover:border-white/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
              <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.q}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ml-3 transition-all duration-300 ${activeFaq === i ? 'bg-sky-500' : darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {activeFaq === i ? <ChevronUp size={14} className="text-white" /> : <ChevronDown size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />}
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-40 pb-5' : 'max-h-0'}`}>
                <p className={`px-5 text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center" style={{ zIndex: 1 }}>
        <div className={`relative p-10 md:p-14 rounded-3xl overflow-hidden border ${darkMode ? 'border-white/8' : 'border-transparent'}`} style={{ background: darkMode ? 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(124,58,237,0.08))' : 'linear-gradient(135deg, #eff6ff, #f5f3ff)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
          </div>
          <div className="relative z-10">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border mb-6 ${darkMode ? 'bg-white/5 border-white/10 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'}`}>
              <Sparkles size={11} className="animate-pulse" /> Ready to transform attendance?
            </div>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Start tracking smarter</h2>
            <p className={`text-base mb-8 max-w-lg mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sign in to access live dashboards, parent portals, and one-click reports — all powered by your RFID readers.</p>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-bold text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-sky-500/30 group" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)' }}>
              Access Portal <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm">
              {[{ icon: ShieldCheck, label: 'Secure by default' }, { icon: Cloud, label: '99.95% uptime' }, { icon: Globe, label: 'PH timezone native' }].map((t, i) => (
                <div key={i} className={`flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><t.icon size={15} className="text-emerald-500" /><span className="font-medium">{t.label}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className={`relative border-t py-10 ${darkMode ? 'border-white/5 bg-black/20' : 'border-gray-100 bg-white'}`} style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3"><AppLogo size="sm" /><span className={`font-black text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>RFID Attendance</span></div>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Modern attendance management for Philippine schools. Built on proven hardware and cloud infrastructure.</p>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Quick Links</p>
              <div className="space-y-2">
                {['Features', 'How It Works', 'FAQ'].map(l => (
                  <button key={l} onClick={() => document.getElementById(l.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' })} className={`block text-xs font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Stack</p>
              <div className="flex flex-wrap gap-2">
                {['ESP8266', 'RFID RC522', 'Google Apps Script', 'Next.js', 'Recharts', 'ExcelJS'].map(t => (
                  <span key={t} className={`text-xs px-2 py-1 rounded-lg font-medium ${darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className={`border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs ${darkMode ? 'border-white/5 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
            <p>© {new Date().getFullYear()} RFID Attendance Portal. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
              All systems operational
            </p>
          </div>
        </div>
      </footer>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className={`relative w-full max-w-md rounded-3xl animate-modal-in overflow-hidden ${darkMode ? 'bg-gray-900 border border-white/10 shadow-2xl' : 'bg-white border border-gray-200/80 shadow-[0_32px_80px_rgba(0,0,0,0.18)]'}`}>
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0ea5e9, #7c3aed, #10b981)' }} />
            <div className="p-8">
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                  <AppLogo size="sm" />
                  <div>
                    <h2 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome back</h2>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sign in to your portal</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" className={inp} required disabled={loading} />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className={`${inp} pr-11`} required disabled={loading} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className={`absolute right-3.5 top-1/2 -translate-y-1/2 hover:scale-110 transition-all ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm animate-shake border ${darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    <AlertCircle size={15} />{error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="w-full py-3.5 text-white font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25" style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
                </button>
              </form>
              <div className={`mt-6 pt-5 border-t flex items-center justify-center gap-4 text-xs ${darkMode ? 'border-white/5 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                {[ShieldCheck, Globe, Zap].map((Icon, i) => (
                  <div key={i} className="flex items-center gap-1"><Icon size={11} className="text-emerald-500" /><span>{['Encrypted','PH Timezone','Fast'][i]}</span></div>
                ))}
              </div>
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
  const [animatedNumbers, setAnimatedNumbers] = useState({ students: 0, checkins: 0, uptime: 0, responseTime: 150 });

  // ── Multi-child parent state ──────────────────────────────────────────────
  // childrenInfo: array of { studentId, name, class } for all linked children
  // selectedChildId: 'all' | specific studentId string
  const [childrenInfo, setChildrenInfo] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('all');

  const isMobile = useIsMobile();

  useEffect(() => {
    if (authenticated) return;
    const targets = { students: 100, checkins: 250, uptime: 99.95, responseTime: 100 };
    let step = 0; const totalSteps = 24;
    const timer = setInterval(() => {
      step++;
      const p = Math.min(step / totalSteps, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimatedNumbers({ students: Math.floor(ease * targets.students), checkins: Math.floor(ease * targets.checkins), uptime: parseFloat((ease * targets.uptime).toFixed(2)), responseTime: Math.floor(150 - ease * 50) });
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
      setAuthenticated(true); setUserType(savedUserType);
      setUserInfo(savedUserInfo ? JSON.parse(savedUserInfo) : null);
    }
  }, []);

  // ── Resolve childrenInfo from students list + userInfo.studentIds ──────────
  useEffect(() => {
    if (userType !== 'parent' || !userInfo) return;
    // Wait for students to load; don't wipe childrenInfo while still loading
    if (!students.length) return;

    // Parse studentIds robustly — handles array, JSON string, or legacy single string
    let rawIds = userInfo.studentIds;
    if (typeof rawIds === 'string') {
      try { rawIds = JSON.parse(rawIds); } catch { rawIds = rawIds ? [rawIds] : []; }
    }
    let linkedIds = Array.isArray(rawIds) ? rawIds.map(id => id.toString().trim()).filter(Boolean) : [];

    // Legacy single-id fallback
    if (!linkedIds.length && userInfo.studentId) {
      linkedIds = [userInfo.studentId.toString().trim()];
    }

    // Ultimate fallback: the API already pre-filters students to this parent's children,
    // so if we still have no IDs, just use whatever students came back from the server.
    if (!linkedIds.length) {
      linkedIds = students.map(s => s.studentId.toString().trim());
    }

    const resolved = linkedIds.map(id => {
      const nid = normalizeId(id);
      const match = students.find(s => normalizeId(s.studentId) === nid);
      return match
        ? { studentId: match.studentId, name: match.name, class: match.class }
        : { studentId: id, name: `Child (${id})`, class: '' };
    }).filter(Boolean);

    setChildrenInfo(resolved);
    // 1 child  → select directly (no selector pill row shown)
    // 2+ children → default to 'all' combined view
    setSelectedChildId(resolved.length === 1 ? resolved[0].studentId : 'all');
  }, [userType, userInfo, students]);

  useEffect(() => {
    if (!authenticated) return;
    const check = setInterval(() => { if (Date.now() - lastActivity > SESSION_TIMEOUT) { alert('Session expired'); handleLogout(); } }, 60000);
    return () => clearInterval(check);
  }, [authenticated, lastActivity]);

  useEffect(() => {
    if (!authenticated) return;
    const update = () => setLastActivity(Date.now());
    ['mousedown','keydown','scroll','touchstart'].forEach(e => document.addEventListener(e, update));
    return () => ['mousedown','keydown','scroll','touchstart'].forEach(e => document.removeEventListener(e, update));
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
    const h = new Date().toLocaleString('en-PH', { hour: 'numeric', hour12: false, timeZone: PH_TZ });
    const hour = parseInt(h);
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
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
        setAuthenticated(true); setUserType(data.userType); setUserInfo(data); setLastActivity(Date.now());
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch { setError('Login failed. Please try again.'); }
  };

  const handleLogout = useCallback(async () => {
    // Tell the server to delete the session row — fire-and-forget, don't block the UI
    const token = sessionStorage.getItem('sessionToken');
    if (token) {
      try {
        await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout', sessionToken: token }),
        });
      } catch { /* ignore network errors — session will expire on its own */ }
    }
    // Clear all session data from the browser
    sessionStorage.clear();
    // Reset every piece of dashboard state so nothing leaks after logout
    setAuthenticated(false);
    setUserType(null);
    setUserInfo(null);
    setLogs([]);
    setStudents([]);
    setClasses([]);
    setStats({ totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
    setWeeklyData([]);
    setChildrenInfo([]);
    setSelectedChildId('all');
  }, []);

  const calculateWeeklyData = (logData, studentsList) => {
    if (!logData?.length || !studentsList?.length) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - (6 - i));
      const targetPhStr = targetDate.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: PH_TZ });
      const dayLogs = logData.filter(l => getPhLocalDate(l.timestamp) === targetPhStr);
      const present = new Set(dayLogs.filter(l => l.status === 'IN' && l.studentId).map(l => normalizeId(l.studentId))).size;
      return { name: dayName, present, absent: Math.max(0, studentsList.length - present), attendanceRate: studentsList.length > 0 ? Math.round((present / studentsList.length) * 100) : 0 };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 180);
      const startStr = startDate.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const endStr   = getPhTodayStr();
      const data = await secureApiCall('getDashboardStats', { startDate: startStr, endDate: endStr });
      if (data.success) {
        const sortedLogs = (data.logs || []).sort((a, b) => {
          const da = parsePhTimestamp(a.timestamp);
          const db = parsePhTimestamp(b.timestamp);
          return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
        });
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

  const exportToExcel = async (logsToExport = [], filenameSuffix = '') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Records');
    worksheet.columns = [
      { header: 'Timestamp (PH Time)', key: 'timestamp', width: 25 },
      { header: 'Student ID',          key: 'studentId', width: 18 },
      { header: 'Name',                key: 'name',      width: 35 },
      { header: 'Class',               key: 'class',     width: 18 },
      { header: 'Status',              key: 'status',    width: 12 },
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
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rn % 2 === 0 ? 'FFF0F9FF' : 'FFFFFFFF' } };
        cell.font = { size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: cn === 3 ? 'left' : 'center' };
        cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        if (cn === 5) { cell.font = { ...cell.font, bold: true, color: { argb: cell.value === 'IN' ? 'FF059669' : 'FFE11D48' } }; }
      });
    });
    worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: worksheet.rowCount, column: 5 } };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${getPhTodayStr()}${filenameSuffix}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // exportToCSV signature now accepts optional filenameSuffix for parent portal
  const exportToCSV = (logsToExport, filenameSuffix = '') => exportToExcel(logsToExport || logs, filenameSuffix);

  useEffect(() => { if (authenticated) fetchData(); }, [authenticated]);

  if (!mounted) return null;

  if (!authenticated) {
    return <LandingPage darkMode={darkMode} toggleTheme={toggleTheme} onLogin={handleLogin} animatedNumbers={animatedNumbers} />;
  }

  const tabs = userType === 'teacher'
    ? [{ name: 'Dashboard', icon: Home }, { name: 'Classroom', icon: Users }, { name: 'Logs', icon: FileText }]
    : [];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f1117]' : 'bg-slate-50/80'}`}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-all duration-300 ${darkMode ? 'bg-[#0f1117]/90 border-gray-800/80' : 'bg-white/95 border-gray-200/80'} shadow-sm`}>
        {loading && <div className="h-0.5 bg-gradient-to-r from-sky-400 via-violet-500 to-sky-400 animate-loading-bar" />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <AppLogo size="sm" />
              <div className="min-w-0 hidden sm:block">
                <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {userType === 'teacher' ? 'Teacher Portal' : 'Parent Portal'}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} truncate max-w-[180px] md:max-w-xs`} title={userInfo?.fullName || 'User'}>
                  {getGreeting()}, <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userInfo?.fullName || 'User'}</span>
                </p>
              </div>
            </div>

            {!isMobile && userType === 'teacher' && (
              <div className={`flex items-center gap-1 p-1 rounded-xl ${darkMode ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
                {tabs.map((tab, i) => (
                  <button key={i} onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                      ${activeTab === i
                        ? darkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm'
                        : darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                      } hover:scale-105 active:scale-95`}>
                    <tab.icon size={15} />{tab.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button onClick={fetchData} disabled={loading} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <RefreshCw size={17} className={loading ? 'animate-spin text-sky-500' : ''} />
              </button>
              <button onClick={handleLogout} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <LogOut size={16} />{!isMobile && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 ${isMobile && userType === 'teacher' ? 'pb-24' : ''}`}>
        <div className="animate-fade-in-up">
          {userType === 'teacher' ? (
            <>
              {activeTab === 0 && <DashboardTab darkMode={darkMode} stats={stats} weekData={weeklyData} students={students} logs={logs} classes={classes} loading={loading} />}
              {activeTab === 1 && <ClassroomMonitorTab darkMode={darkMode} students={students} classes={classes} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedClass={selectedClass} setSelectedClass={setSelectedClass} logs={logs} />}
              {activeTab === 2 && <LogsTab darkMode={darkMode} loading={loading} logs={logs} exportToCSV={exportToCSV} />}
            </>
          ) : (
            <ParentLogsTab
              darkMode={darkMode}
              loading={loading}
              logs={logs}
              userInfo={userInfo}
              students={students}
              exportToCSV={exportToCSV}
              childrenInfo={childrenInfo}
              selectedChildId={selectedChildId}
              setSelectedChildId={setSelectedChildId}
            />
          )}
        </div>
      </main>

      {isMobile && userType === 'teacher' && (
        <nav className={`fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl ${darkMode ? 'bg-[#0f1117]/95 border-gray-800' : 'bg-white border-gray-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]'}`}>
          <div className="flex">
            {tabs.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 active:scale-95
                  ${activeTab === i ? 'text-sky-500' : darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'}`}>
                <tab.icon size={22} className={`transition-transform duration-200 ${activeTab === i ? 'scale-110' : ''}`} />
                <span className="text-xs font-semibold">{tab.name}</span>
                <div className={`h-0.5 rounded-full transition-all duration-300 ${activeTab === i ? 'w-5 bg-sky-500' : 'w-0'}`} />
              </button>
            ))}
          </div>
        </nav>
      )}

      <style jsx global>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modal-in { from { opacity: 0; transform: scale(0.94) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(100%); } }
        @keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .animate-fade-in-up { animation: fade-in-up 0.45s ease-out both; }
        .animate-modal-in { animation: modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-shake { animation: shake 0.4s ease-out; }
        .animate-loading-bar { animation: loading-bar 1.6s ease-in-out infinite; }
        .skeleton-pulse { animation: skeleton-pulse 1.5s ease-in-out infinite; }
        html { scroll-behavior: smooth; }
        body, html { overflow-x: hidden; }
        * { box-sizing: border-box; }
        @media (max-width: 767px) { input, select, textarea { font-size: 16px !important; } }
        .recharts-tooltip-wrapper { transition: transform 0.15s ease-out, opacity 0.15s ease-out !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.55); }
      `}</style>
    </div>
  );
}
