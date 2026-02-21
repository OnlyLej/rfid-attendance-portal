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

/**
 * The backend (Google Apps Script) returns timestamps as PH-local strings:
 *   "2025-02-21 14:30:00"  (already Asia/Manila time, no offset suffix)
 *
 * JavaScript's Date constructor treats a string WITHOUT an offset as LOCAL time
 * in most browsers, BUT this is unreliable — some environments treat it as UTC.
 *
 * SAFE APPROACH: parse the string manually and treat the numbers as PH local time
 * by constructing an ISO string with the +08:00 suffix.
 */
const parsePhTimestamp = (str) => {
  if (!str) return null;
  if (typeof str !== 'string') {
    // Already a Date or number
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // Format: "yyyy-MM-dd HH:mm:ss" — append PH offset so JS knows it's UTC+8
  const iso = str.replace(' ', 'T') + '+08:00';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Returns today's date string in PH timezone: "yyyy-MM-dd"
 */
const getPhTodayStr = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: PH_TZ });
};

/**
 * Returns the PH date string for a given Date object.
 * "en-CA" locale gives yyyy-MM-dd format.
 */
const toPhDateStr = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-CA', { timeZone: PH_TZ });
};

/**
 * Formats a parsed Date for display in PH time.
 */
const formatPhDateTime = (date, options = {}) => {
  if (!date) return '—';
  return date.toLocaleString('en-PH', { timeZone: PH_TZ, ...options });
};

// Legacy alias used in some places — wraps parsePhTimestamp
const parseLogTimestamp = parsePhTimestamp;

// Legacy alias — returns PH date string from a timestamp string
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

  /**
   * All chart computations use PH timezone:
   * - parsePhTimestamp() converts backend strings to Date objects anchored to UTC+8
   * - toPhDateStr() extracts the PH calendar date for grouping
   * - getPhTodayStr() gives today's PH date for boundary comparisons
   */
  const dailyData = useMemo(() => {
    const days = [];
    const todayPh = getPhTodayStr(); // "yyyy-MM-dd" in PH time

    for (let i = 6; i >= 0; i--) {
      // Compute target PH date by offsetting from today
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const targetPhStr = targetDate.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: PH_TZ });

      const dayLogs = logs.filter(log => {
        if (!log.timestamp) return false;
        return getPhLocalDate(log.timestamp) === targetPhStr;
      });

      const presentStudents = new Set(dayLogs.filter(l => l.status === 'IN' && l.studentId).map(l => l.studentId));
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

    // Current month in PH time
    const nowPh = new Date(new Date().toLocaleString('en-US', { timeZone: PH_TZ }));
    const currentYear = nowPh.getFullYear();
    const currentMonth = nowPh.getMonth();

    const getWeekOfMonth = (date) => {
      // Week number within the month (1-based)
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      return Math.ceil((date.getDate() + firstDay.getDay()) / 7);
    };

    const totalWeeks = getWeekOfMonth(new Date(currentYear, currentMonth + 1, 0)); // last day of month
    const weekMap = new Map();

    logs?.forEach(log => {
      if (log.status !== 'IN' || !log.studentId || !log.timestamp) return;
      const logDate = parsePhTimestamp(log.timestamp);
      if (!logDate) return;

      // Use PH calendar date for month/year check
      const logPhStr = toPhDateStr(logDate);
      const [ly, lm] = logPhStr.split('-').map(Number);
      if (ly !== currentYear || lm - 1 !== currentMonth) return;

      // Get PH local date object for week calculation
      const phLocal = new Date(logDate.toLocaleString('en-US', { timeZone: PH_TZ }));
      const week = getWeekOfMonth(phLocal);
      if (!weekMap.has(week)) weekMap.set(week, new Set());
      weekMap.get(week).add(log.studentId);
    });

    return Array.from({ length: totalWeeks }, (_, wi) => {
      const week = wi + 1;
      const presentSet = weekMap.get(week) || new Set();
      const present = presentSet.size;
      const absent = totalStudents - present;
      const rate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
      // Is this week in the future?
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
      const targetMonth = targetDate.getMonth(); // 0-based
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
      const yearShort = targetYear.toString().slice(-2);

      const dayStudentMap = new Map();

      logs.forEach(log => {
        if (log.status !== 'IN' || !log.studentId || !log.timestamp) return;
        const logDate = parsePhTimestamp(log.timestamp);
        if (!logDate) return;

        // Check year/month in PH time
        const phLocal = new Date(logDate.toLocaleString('en-US', { timeZone: PH_TZ }));
        if (phLocal.getFullYear() !== targetYear || phLocal.getMonth() !== targetMonth) return;

        // Skip weekends (PH local day of week)
        const dow = phLocal.getDay();
        if (dow === 0 || dow === 6) return;

        const dateStr = toPhDateStr(logDate);
        if (!dayStudentMap.has(dateStr)) dayStudentMap.set(dateStr, new Set());
        dayStudentMap.get(dateStr).add(log.studentId);
      });

      const schoolDayCount = dayStudentMap.size;
      const totalPresent = [...dayStudentMap.values()].reduce((s, set) => s + set.size, 0);
      const avgPresent = schoolDayCount > 0 ? Math.round(totalPresent / schoolDayCount) : 0;
      const avgRate = schoolDayCount > 0 && students.length > 0 ? Math.round((avgPresent / students.length) * 100) : 0;
      const isFuture = targetDate > nowPh;

      months.push({
        name: `${monthName} '${yearShort}`,
        avgPresent: isFuture ? null : avgPresent,
        avgRate: isFuture ? null : avgRate,
        days: schoolDayCount,
        month: monthName,
      });
    }
    return months;
  }, [logs, students]);

  const classComparisonData = useMemo(() => {
    if (!classes?.length || !students?.length) return [];
    const todayPhStr = getPhTodayStr();

    return classes.map(cls => {
      const classStudents = students.filter(s => s.class === cls);
      const totalCount = classStudents.length;
      if (!totalCount) return null;

      const todayClassLogs = logs.filter(log => {
        if (!log.timestamp || log.class !== cls) return false;
        return getPhLocalDate(log.timestamp) === todayPhStr;
      });

      let presentCount = 0, absentCount = 0, noLogCount = 0;
      classStudents.forEach(student => {
        const studentLogs = todayClassLogs
          .filter(l => l.studentId === student.studentId)
          .sort((a, b) => parsePhTimestamp(a.timestamp) - parsePhTimestamp(b.timestamp));
        if (!studentLogs.length) {
          noLogCount++;
        } else {
          studentLogs[studentLogs.length - 1].status === 'IN' ? presentCount++ : absentCount++;
        }
      });

      const rate = Math.round((presentCount / totalCount) * 100);
      return {
        name: cls.length > 14 ? `${cls.substring(0, 12)}…` : cls,
        fullName: cls,
        attendanceRate: rate,
        present: presentCount,
        absent: absentCount,
        noLog: noLogCount,
        total: totalCount,
      };
    }).filter(Boolean).filter(c => c.total > 0).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [classes, students, logs]);

  const tooltipStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    color: darkMode ? '#e2e8f0' : '#1e293b',
    fontSize: 12,
    padding: '10px 14px',
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Total Students',  value: `${stats.totalStudents}`,  numericValue: stats.totalStudents,  icon: Users,    color: 'blue',   delay: 0   },
          { label: 'Present Today',   value: `${stats.presentToday}`,   numericValue: stats.presentToday,   icon: UserCheck, color: 'green',  delay: 60  },
          { label: 'Absent Today',    value: `${stats.absentToday}`,    numericValue: stats.absentToday,    icon: UserX,    color: 'red',    delay: 120 },
          { label: "Today's Rate",    value: `${stats.attendanceRate}%`, numericValue: stats.attendanceRate, icon: TrendingUp, color: 'purple', delay: 180 },
          { label: 'Week Average',    value: `${weekAvg}%`,             numericValue: weekAvg,              icon: Calendar,  color: 'indigo', delay: 240 },
        ].map((s, i) => <StatCard key={i} {...s} darkMode={darkMode} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Weekly Bar Chart */}
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
                    <Bar dataKey="absent"  name="Absent"  fill="url(#absentGrad)"  radius={[6,6,0,0]} maxBarSize={44} animationDuration={800} animationEasing="ease-out" />
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

        {/* Daily 7-Day Area Chart */}
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
                    <Area type="monotone" dataKey="absent"  name="Absent"  stroke="#f43f5e" strokeWidth={2}   fill="url(#dailyAbsentGrad)"  dot={{ fill: '#f43f5e', r: 3, strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#fff' }} activeDot={{ r: 5 }} animationDuration={900} />
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

        {/* Monthly Trend */}
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
                    <YAxis yAxisId="left"  stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke={axisColor} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
                      formatter={(v, name) => [v === null ? '—' : name === 'Avg Rate' ? `${v}%` : `${v} students`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: '8px' }} />
                    <Area yAxisId="left"  type="monotone" dataKey="avgPresent" name="Avg Present" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#monthlyGrad)"     dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#fff' }} activeDot={{ r: 6 }} animationDuration={1000} connectNulls={false} />
                    <Area yAxisId="right" type="monotone" dataKey="avgRate"    name="Avg Rate"    stroke="#06b6d4" strokeWidth={2}   fill="url(#monthlyRateGrad)" dot={{ fill: '#06b6d4', r: 3, strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#fff' }} activeDot={{ r: 5 }} animationDuration={1000} connectNulls={false} />
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

        {/* Class Performance */}
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
                    <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} width={90} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                      formatter={(v, name, props) => {
                        const d = props.payload;
                        return [`${v}% — ${d.present} IN / ${d.absent} OUT / ${d.noLog} no log`, d.fullName];
                      }}
                    />
                    <Bar dataKey="attendanceRate" name="Rate" fill="url(#classGrad)" radius={[0,6,6,0]} maxBarSize={20} animationDuration={900} animationEasing="ease-out"
                      label={{ position: 'right', fontSize: 11, fontWeight: 600, fill: darkMode ? '#94a3b8' : '#64748b', formatter: v => `${v}%` }} />
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

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Today's Summary", icon: Calendar, iconColor: 'text-sky-500', iconBg: 'bg-sky-500/10',
            content: (
              <div className="space-y-3">
                {[
                  { label: 'Check-ins (IN)',   value: stats.presentToday },
                  { label: 'Checked Out (OUT)', value: stats.absentToday, red: true },
                  { label: 'Attendance Rate',  value: `${stats.attendanceRate}%`, green: true },
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
                  { label: 'Avg Rate',           value: `${weekAvg}%`, purple: true },
                  { label: 'Best Day',           value: dailyData.length > 0 && dailyData.some(d => d.present > 0) ? dailyData.reduce((m,d) => d.present > m.present ? d : m, dailyData[0]).name : '—', green: true },
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
                  <div>
                    <p className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>{classComparisonData[0].name}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{classComparisonData[0].present} present / {classComparisonData[0].total} total</p>
                  </div>
                  <span className={`text-2xl font-black ${classComparisonData[0].attendanceRate >= 90 ? 'text-emerald-500' : classComparisonData[0].attendanceRate >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {classComparisonData[0].attendanceRate}%
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${classComparisonData[0].attendanceRate}%` }} />
                </div>
                {classComparisonData.length > 1 && (
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    2nd: {classComparisonData[1].name} — {classComparisonData[1].attendanceRate}%
                  </p>
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
    const todayLogs = logs
      .filter(l => {
        if (!l.timestamp || l.studentId !== studentId) return false;
        return getPhLocalDate(l.timestamp) === todayPhStr;
      })
      .sort((a, b) => parsePhTimestamp(a.timestamp) - parsePhTimestamp(b.timestamp));

    if (!todayLogs.length) return 'no-log';
    return todayLogs[todayLogs.length - 1].status === 'IN' ? 'in' : 'out';
  }, [logs]);

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

  const statusConfig = {
    'in':     { dot: 'bg-emerald-500', badge: darkMode ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-100', label: 'IN',     pulse: true  },
    'out':    { dot: 'bg-rose-500',    badge: darkMode ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'           : 'bg-rose-50 text-rose-700 border border-rose-100',           label: 'OUT',    pulse: false },
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
          { label: 'IN (Present)',     color: 'bg-emerald-500', pulse: true  },
          { label: 'OUT (Left)',       color: 'bg-rose-500',    pulse: false },
          { label: 'Absent (No log)', color: 'bg-gray-400',    pulse: false },
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
                  <div>
                    <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-800'}`}>{cn}</h3>
                    <p className={`text-xs mt-0.5 font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{filteredSt.length} students</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${rate >= 80 ? 'text-emerald-500' : rate >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{rate}%</span>
                    <ChevronDown size={16} className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'IN',     count: statusCounts.in,        bg: darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100', text: 'text-emerald-500' },
                    { label: 'OUT',    count: statusCounts.out,       bg: darkMode ? 'bg-rose-500/10 border-rose-500/20'       : 'bg-rose-50 border-rose-100',       text: 'text-rose-500' },
                    { label: 'Absent', count: statusCounts['no-log'], bg: darkMode ? 'bg-gray-700/60 border-gray-600/30'       : 'bg-gray-50 border-gray-100',        text: darkMode ? 'text-gray-400' : 'text-gray-500' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} border rounded-xl p-2.5 text-center`}>
                      <p className={`text-xl font-black ${s.text}`}>{s.count}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${rate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : rate >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-rose-400 to-rose-600'}`}
                    style={{ width: `${rate}%` }} />
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
                          <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{student.name}</p>
                          <p className={`text-xs font-mono truncate mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{student.studentId}</p>
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

  // "Today" in PH time for the date input max
  const today = getPhTodayStr();
  const uniqueClasses = useMemo(() => [...new Set(allLogs.map(l => l.class))].sort(), [allLogs]);

  const filteredLogs = useMemo(() => {
    let f = [...allLogs];
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(l => l.studentId?.toLowerCase().includes(q) || l.name?.toLowerCase().includes(q) || l.class?.toLowerCase().includes(q));
    }
    // Date filters compare PH date strings directly (backend returns PH-formatted timestamps)
    if (dateStart) f = f.filter(l => getPhLocalDate(l.timestamp) >= dateStart);
    if (dateEnd)   f = f.filter(l => getPhLocalDate(l.timestamp) <= dateEnd);
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    if (classFilter  !== 'all') f = f.filter(l => l.class  === classFilter);
    f.sort((a, b) => {
      const da = parsePhTimestamp(a.timestamp);
      const db = parsePhTimestamp(b.timestamp);
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return f;
  }, [allLogs, search, dateStart, dateEnd, statusFilter, classFilter, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);
  useEffect(() => setCurrentPage(1), [search, dateStart, dateEnd, statusFilter, classFilter, sortOrder]);
  const reset = () => { setSearch(''); setSortOrder('newest'); setStatusFilter('all'); setClassFilter('all'); setDateStart(''); setDateEnd(''); };

  const selectCls = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200
    ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-white border-gray-200 text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

  // Format timestamp for display — backend sends PH time strings, parse as PH local
  const formatTs = (ts) => {
    const d = parsePhTimestamp(ts);
    if (!d) return '—';
    return d.toLocaleString('en-PH', {
      timeZone: PH_TZ,
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Attendance Logs</h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{filteredLogs.length.toLocaleString()} of {allLogs.length.toLocaleString()} records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all duration-200 hover:scale-105 active:scale-95
              ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}>
            <Filter size={15} className={showFilters ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
            {!isMobile && 'Filters'}
          </button>
          <button onClick={reset}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all duration-200 hover:scale-105 active:scale-95
              ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}>
            <X size={15} />{!isMobile && 'Reset'}
          </button>
          <button onClick={() => exportToCSV(filteredLogs)} disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 shadow-sm shadow-emerald-500/25">
            <Download size={15} />{!isMobile && 'Export'}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-500 overflow-hidden ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <Card darkMode={darkMode}>
          <div className="p-4 space-y-4">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>From</label>
                <input type="date" value={dateStart} max={today} onChange={e => setDateStart(e.target.value)} className={selectCls} />
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>To</label>
                <input type="date" value={dateEnd} min={dateStart} max={today} onChange={e => setDateEnd(e.target.value)} className={selectCls} />
              </div>
              <div className="flex items-end">
                <button onClick={() => { setDateStart(today); setDateEnd(today); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95
                    ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Today</button>
              </div>
              <div className="flex items-end">
                <button onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 7);
                  setDateStart(d.toLocaleDateString('en-CA', { timeZone: PH_TZ }));
                  setDateEnd(today);
                }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95
                    ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Last 7 days</button>
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
                <div className="flex items-start justify-between mb-1">
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{log.name}</p>
                  <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>{log.status}</span>
                </div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.studentId} · {log.class}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatTs(log.timestamp)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
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
                    <td className={`px-5 py-3.5 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatTs(log.timestamp)}</td>
                    <td className={`px-5 py-3.5 text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.studentId}</td>
                    <td className={`px-5 py-3.5 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{log.name}</td>
                    <td className={`px-5 py-3.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.class}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredLogs.length > 0 && (
          <div className={`border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Showing {((currentPage-1)*LOGS_PER_PAGE)+1}–{Math.min(currentPage*LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
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

  const today = getPhTodayStr();

  const childLogs = useMemo(() => {
    if (!parentChildId) return [];
    return allLogs.filter(l => l.studentId === parentChildId);
  }, [allLogs, parentChildId]);

  const filteredLogs = useMemo(() => {
    let f = [...childLogs];
    if (search) { const q = search.toLowerCase(); f = f.filter(l => l.name?.toLowerCase().includes(q) || l.class?.toLowerCase().includes(q) || l.studentId?.toLowerCase().includes(q)); }
    if (dateStart) f = f.filter(l => getPhLocalDate(l.timestamp) >= dateStart);
    if (dateEnd)   f = f.filter(l => getPhLocalDate(l.timestamp) <= dateEnd);
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    f.sort((a, b) => {
      const da = parsePhTimestamp(a.timestamp);
      const db = parsePhTimestamp(b.timestamp);
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return f;
  }, [childLogs, search, dateStart, dateEnd, statusFilter, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((currentPage-1)*LOGS_PER_PAGE, currentPage*LOGS_PER_PAGE);
  useEffect(() => setCurrentPage(1), [search, dateStart, dateEnd, statusFilter, sortOrder]);

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

  return (
    <div className="space-y-5">
      <Card darkMode={darkMode} delay={0}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {userInfo?.fullName ? `Welcome, ${userInfo.fullName.split(' ')[0]}!` : 'Parent Portal'}
              </h2>
              {childInfo && <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tracking: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{childInfo.name}</span> · {childInfo.class}</p>}
            </div>
            <button onClick={() => exportToCSV(filteredLogs)} disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0 shadow-sm shadow-emerald-500/25">
              <Download size={15} />{!isMobile && 'Export'}
            </button>
          </div>
          {childInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Student ID',      value: childInfo.studentId,          color: 'blue' },
                { label: "Today's Logs",    value: childStats.todayLogs,         color: 'green' },
                { label: 'Total Records',   value: childStats.totalLogs,         color: 'purple' },
                { label: 'Attendance Rate', value: `${childStats.attendanceRate}%`, color: 'orange' },
              ].map((s, i) => (
                <div key={i} className={`${getColorClasses(s.color, darkMode, 'bg')} border ${getColorClasses(s.color, darkMode, 'border')} rounded-xl p-3.5 transition-all duration-200 hover:scale-105 cursor-default`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${getColorClasses(s.color, darkMode, 'text')} mb-1`}>{s.label}</p>
                  <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>{s.value}</p>
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
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, ID…" className={`${selectCls} pl-8`} />
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

      <Card darkMode={darkMode} delay={150}>
        {loading ? (
          <div className="p-12 text-center"><PulseLoader darkMode={darkMode} size="lg" /></div>
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
            <div className={`divide-y ${darkMode ? 'divide-gray-700/40' : 'divide-gray-50'}`}>
              {pagedLogs.map((log, i) => (
                <div key={i} className={`px-5 py-4 flex items-center gap-4 transition-colors duration-150 ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-slate-50'} group`}>
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${log.status === 'IN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>{log.status}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatDate(log.timestamp)}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{log.class}</p>
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
  const [activeSection, setActiveSection] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    await onLogin(username, password, setError);
    setLoading(false);
  };

  const arch = [
    { icon: Cpu,      title: 'Hardware Layer',  subtitle: 'ESP8266 + RFID Readers',  color: 'sky',     features: ['Real-time card scanning', 'OLED status display', 'WiFi transmission', 'Audio feedback'] },
    { icon: Database, title: 'Backend System',  subtitle: 'Google Apps Script',      color: 'violet',  features: ['Secure API endpoints', 'Role-based access', 'Real-time processing', 'GDPR compliant'] },
    { icon: Monitor,  title: 'Web Portal',      subtitle: 'Next.js Dashboard',       color: 'emerald', features: ['Live analytics', 'Interactive charts', 'Multi-role views', 'Mobile responsive'] },
  ];

  const features = [
    { icon: Users,    title: 'Multi-Role Access',   desc: 'Separate portals for teachers and parents with granular controls.',  color: 'sky' },
    { icon: BarChart3, title: 'Advanced Analytics', desc: 'Real-time charts, trends, and attendance insights.',                 color: 'violet' },
    { icon: Shield,   title: 'Enterprise Security', desc: '256-bit encryption, session tokens, and API protection.',            color: 'emerald' },
  ];

  const inp = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200
    ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-slate-50 text-gray-900'} transition-colors duration-300`}>
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-300 ${scrolled ? 'shadow-md' : ''} ${darkMode ? 'bg-gray-900/85 border-gray-800' : 'bg-white/90 border-gray-200/80'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" />
            <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>RFID Attendance</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm shadow-sky-500/25">Sign In</button>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative overflow-hidden">
        <div className={`absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-sky-900/20' : 'bg-sky-100/60'}`} />
        <div className={`absolute -bottom-10 -left-10 w-64 h-64 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-violet-900/20' : 'bg-violet-100/40'}`} />
        <div className="text-center space-y-6 max-w-3xl mx-auto relative">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${darkMode ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-100 text-sky-600'}`}>
            <Sparkles size={12} className="animate-pulse" /> Enterprise Attendance Solution
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Smart RFID{' '}<span className="bg-gradient-to-r from-sky-500 to-violet-500 bg-clip-text text-transparent">Attendance</span>{' '}Management
          </h1>
          <p className={`text-lg md:text-xl max-w-xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Real-time tracking, analytics, and multi-role dashboards for modern educational institutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/25 flex items-center gap-2">
              Access Portal <ArrowRight size={16} />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className={`px-6 py-3 text-sm font-semibold rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
              How it works
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
          {[
            { val: `${Math.floor(animatedNumbers.students)}+`, label: 'Students',     icon: Users,        color: 'sky' },
            { val: `${Math.floor(animatedNumbers.checkins)}+`, label: 'Daily Check-ins', icon: CheckCircle, color: 'emerald' },
            { val: `${animatedNumbers.uptime}%`,               label: 'Uptime',        icon: Cloud,        color: 'violet' },
            { val: `<${Math.round(animatedNumbers.responseTime)}ms`, label: 'Response', icon: Zap,         color: 'amber' },
          ].map((s, i) => (
            <div key={i} className={`p-4 rounded-2xl border text-center transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 cursor-default ${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-md'}`}>
              <s.icon size={20} className={`mx-auto mb-2 text-${s.color}-500`} />
              <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>{s.val}</p>
              <p className={`text-xs mt-0.5 font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className={`text-3xl font-black mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Three-Layer Architecture</h2>
          <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hardware, backend, and frontend working seamlessly together</p>
        </div>
        <div className="space-y-3">
          {arch.map((a, i) => (
            <div key={i} onClick={() => setActiveSection(activeSection === i ? null : i)}
              className={`border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-md'}`}>
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl bg-${a.color}-500/10`}><a.icon size={20} className={`text-${a.color}-500`} /></div>
                  <div>
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{a.title}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.subtitle}</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} transition-transform duration-300 ${activeSection === i ? 'rotate-180' : ''}`} />
              </div>
              <div className={`transition-all duration-400 overflow-hidden ${activeSection === i ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className={`px-5 pb-5 border-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  {a.features.map((f, fi) => (
                    <div key={fi} className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />{f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`py-16 ${darkMode ? 'bg-gray-800/20' : 'bg-white/60'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className={`text-3xl font-black mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Key Features</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default group ${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-md'}`}>
                <div className={`w-11 h-11 rounded-xl bg-${f.color}-500/10 flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110`}>
                  <f.icon size={20} className={`text-${f.color}-500`} />
                </div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{f.title}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className={`text-3xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ready to get started?</h2>
        <p className={`mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Join schools using modern RFID attendance management.</p>
        <button onClick={() => setShowModal(true)} className="px-8 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/25">
          Access the Portal
        </button>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm">
          {[
            { icon: ShieldCheck, label: '256-bit Encryption' },
            { icon: Cloud,       label: '99.95% Uptime' },
            { icon: Users,       label: 'Multi-role Access' },
          ].map((t, i) => (
            <div key={i} className={`flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <t.icon size={15} className="text-emerald-500" /><span>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className={`border-t py-8 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" />
            <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>RFID Attendance Portal</span>
          </div>
          <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl animate-modal-in ${darkMode ? 'bg-gray-800 border border-gray-700 shadow-2xl' : 'bg-white border border-gray-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'}`}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <AppLogo size="sm" />
                  <div>
                    <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Welcome back</h2>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sign in to your account</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" className={inp} required disabled={loading} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className={`${inp} pr-10`} required disabled={loading} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className={`absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-all ${darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm animate-shake ${darkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                    <AlertCircle size={15} />{error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-sky-500/25">
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
      const todayPhStr = getPhTodayStr();
      const todayCl = cl.filter(l => getPhLocalDate(l.timestamp) === todayPhStr);
      // Count unique days with attendance using PH dates
      const uniqueDays = new Set(cl.map(l => getPhLocalDate(l.timestamp)).filter(Boolean));
      const daysIn   = new Set(cl.filter(l => l.status === 'IN').map(l => getPhLocalDate(l.timestamp)).filter(Boolean));
      setChildStats({
        totalLogs: cl.length,
        todayLogs: todayCl.length,
        attendanceRate: uniqueDays.size > 0 ? Math.round((daysIn.size / uniqueDays.size) * 100) : 0
      });
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
    // Use PH time for greeting
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

  const handleLogout = () => {
    sessionStorage.clear();
    setAuthenticated(false); setUserType(null); setUserInfo(null); setLogs([]);
    setChildInfo(null); setParentChildId(null);
    setChildStats({ totalLogs: 0, todayLogs: 0, attendanceRate: 0 });
  };

  const calculateWeeklyData = (logData, studentsList) => {
    if (!logData?.length || !studentsList?.length) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - (6 - i));
      const targetPhStr = targetDate.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: PH_TZ });

      const dayLogs = logData.filter(l => getPhLocalDate(l.timestamp) === targetPhStr);
      const present = new Set(dayLogs.filter(l => l.status === 'IN' && l.studentId).map(l => l.studentId)).size;
      return {
        name: dayName,
        present,
        absent: Math.max(0, studentsList.length - present),
        attendanceRate: studentsList.length > 0 ? Math.round((present / studentsList.length) * 100) : 0
      };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Request 6 months of data; dates are PH calendar dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 180);
      const startStr = startDate.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const endStr   = getPhTodayStr();

      const data = await secureApiCall('getDashboardStats', { startDate: startStr, endDate: endStr });
      if (data.success) {
        // Sort newest first — backend timestamps are PH strings, parsePhTimestamp handles them correctly
        const sortedLogs = (data.logs || []).sort((a, b) => parsePhTimestamp(b.timestamp) - parsePhTimestamp(a.timestamp));
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

  const exportToExcel = async (logsToExport = []) => {
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
    logsToExport.forEach(log => worksheet.addRow({
      timestamp: log.timestamp, // already PH-formatted string
      studentId: log.studentId,
      name: log.name,
      class: log.class,
      status: log.status
    }));
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
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${getPhTodayStr()}.xlsx`; a.click();
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
            <ParentLogsTab darkMode={darkMode} loading={loading} logs={logs} userInfo={userInfo} students={students} exportToCSV={exportToCSV} childInfo={childInfo} childStats={childStats} parentChildId={parentChildId} />
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