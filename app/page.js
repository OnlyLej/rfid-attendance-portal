'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Clock, TrendingUp, Download, Lock, Eye, EyeOff, LogOut,
  BarChart3, Activity, UserCheck, UserX, AlertCircle, Sun, Moon,
  ChevronRight, Search, RefreshCw, Award, Target, Shield, Bell,
  Filter, ArrowUpDown, X, User, Info, Menu, X as XIcon
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_ENDPOINT = '/api/proxy';
const AUTH_ENDPOINT = '/api/auth';
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Custom hooks for animations
const useFadeIn = (delay = 0) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return visible;
};

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Safe parser for "YYYY-MM-DD HH:mm:ss" format
const parseLogTimestamp = (str) => {
  if (!str) return null;

  // Match YYYY-MM-DD HH:mm:ss (with optional .SSS or timezone)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[+-]\d{2}:\d{2})?$/);
  if (!match) {
    console.warn("Invalid timestamp format:", str);
    return null;
  }

  const [, year, month, day, hour, min, sec] = match;
  const date = new Date(+year, +month - 1, +day, +hour, +min, +sec);

  if (isNaN(date.getTime())) {
    console.warn("Parsed invalid date from:", str);
    return null;
  }

  return date;
};

// 2. Get YYYY-MM-DD string **always in UTC** (stable, no local timezone shift)
const getUTCDateString = (dateOrTimestamp) => {
  let d;
  if (typeof dateOrTimestamp === 'string') {
    d = parseLogTimestamp(dateOrTimestamp);
  } else if (dateOrTimestamp instanceof Date) {
    d = dateOrTimestamp;
  } else {
    return null;
  }
  if (!d) return null;
  return d.toISOString().split('T')[0];
};

// Helper function for dynamic colors
const getColorClasses = (color, darkMode, type = 'bg') => {
  const colorMap = {
    green: {
      dark: {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/20'
      },
      light: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-100'
      }
    },
    red: {
      dark: {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20'
      },
      light: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-100'
      }
    },
    blue: {
      dark: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20'
      },
      light: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-100'
      }
    },
    purple: {
      dark: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/20'
      },
      light: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-100'
      }
    },
    orange: {
      dark: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/20'
      },
      light: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-100'
      }
    },
    gray: {
      dark: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/20'
      },
      light: {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-100'
      }
    },
    indigo: {
      dark: {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'border-indigo-500/20'
      },
      light: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-100'
      }
    }
  };

  const colors = colorMap[color] || colorMap.gray;
  return darkMode ? colors.dark[type] : colors.light[type];
};

// Animated Card Component
const AnimatedCard = ({ children, delay = 0, className = '' }) => {
  const visible = useFadeIn(delay);
  
  return (
    <div 
      className={`${className} ${visible ? 'animate-fade-in-up' : 'opacity-0'} 
      transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Dashboard Tab Component - MOBILE FIX
const DashboardTab = ({ darkMode, stats, weekData, students, logs, classes }) => {
  const isMobile = useIsMobile();
  
const dailyData = useMemo(() => {
  const days = [];
  const today = new Date();

  // Set to midnight in local time (safe starting point)
  today.setHours(0, 0, 0, 0);

  // Loop: today (i=0) ← yesterday ← ... ← 6 days ago (i=6)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dateString = date.toISOString().split('T')[0]; // UTC YYYY-MM-DD for comparison

    // Weekday name in Philippine time (correct display)
    const dayName = date.toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'Asia/Manila'
    });

    // Find logs exactly on this day (UTC date match)
    const dayLogs = logs.filter(log => {
      if (!log.timestamp) return false;
      try {
        const logDate = new Date(log.timestamp);
        return logDate.toISOString().split('T')[0] === dateString;
      } catch {
        return false;
      }
    });

    // Unique students with 'IN' on that day
    const presentStudents = new Set(
      dayLogs
        .filter(log => log.status === 'IN' && log.studentId)
        .map(log => log.studentId)
    );

    const present = presentStudents.size;
    const absent = Math.max(0, students.length - present);
    const rate = students.length > 0 ? Math.round((present / students.length) * 100) : 0;

    days.push({
      name: dayName,
      fullDate: dateString,
      present,
      absent,
      attendanceRate: rate
    });
  }

  // Debug output – helps confirm the dates and values
  console.log("Daily Data – last 7 calendar days (today included):", 
    days.map(d => ({
      day: d.name,
      date: d.fullDate,
      present: d.present,
      absent: d.absent,
      rate: d.attendanceRate + '%'
    }))
  );

  return days;
}, [logs, students]);

const weeklyData = useMemo(() => {
  if (!students?.length) {
    console.log("[weekly month] No students → empty");
    return [];
  }

  const totalStudents = students.length;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // First day of month
  const firstOfMonth = new Date(currentYear, currentMonth, 1);

  // Helper: ISO week key (for grouping logs)
  const getWeekKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const pastDays = Math.floor((d - startOfYear) / 86400000);
    const weekNum = Math.floor((pastDays + startOfYear.getDay() + 6) / 7);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  };

  // Map real ISO week → relative week number (1 = first week in month)
  const weekToRelative = new Map();
  let relativeCounter = 1;
  let currentDate = new Date(firstOfMonth);
  while (currentDate <= new Date(currentYear, currentMonth + 1, 0)) {
    const key = getWeekKey(currentDate);
    if (!weekToRelative.has(key)) {
      weekToRelative.set(key, relativeCounter++);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const totalWeeksInMonth = relativeCounter - 1;

  // Group logs by ISO week (only current month)
  const weekMap = new Map(); // ISO weekKey → Set<studentId>

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

  // Build data using relative week numbers
  const chartData = [];
  for (let relWeek = 1; relWeek <= totalWeeksInMonth; relWeek++) {
    // Find the ISO key for this relative week
    const isoKey = [...weekToRelative.entries()].find(([k, v]) => v === relWeek)?.[0];
    const presentSet = isoKey ? (weekMap.get(isoKey) || new Set()) : new Set();

    const present = presentSet.size;
    const absent = totalStudents - present;
    const rate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;

    // Is this week in the future?
    const weekStartDay = (relWeek - 1) * 7 + 1;
    const weekStart = new Date(currentYear, currentMonth, weekStartDay);
    const isFuture = weekStart > now;

    chartData.push({
      name: `W${relWeek}`,
      present: isFuture ? 0 : present,
      absent: isFuture ? 0 : absent,   // no bars for future
      avgRate: isFuture ? 0 : rate,
      isFuture
    });
  }

  console.log("[weekly month] Final data (relative W1–Wn):", chartData);

  return chartData;
}, [logs, students]);

const hourlyData = useMemo(() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Filter logs for current month only
  const monthLogs = logs.filter(log => {
    if (!log.timestamp || log.status !== 'IN') return false;
    try {
      const d = new Date(log.timestamp);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    } catch {
      return false;
    }
  });

  if (monthLogs.length === 0) {
    return Array.from({ length: 12 }, (_, i) => ({
      name: isMobile ? `${i + 7}` : `${i + 7}:00`,
      W1: 0, W2: 0, W3: 0, W4: 0, W5: 0, W6: 0
    }));
  }

  // Helper: get relative week number in month (W1 = first week)
  const firstOfMonth = new Date(currentYear, currentMonth, 1);
  const getRelativeWeek = (date) => {
    const dayOfMonth = date.getDate();
    const firstWeekday = firstOfMonth.getDay();
    const adjusted = (firstWeekday === 0 ? 7 : firstWeekday); // Monday start
    return Math.ceil((dayOfMonth + adjusted - 1) / 7);
  };

  // Count check-ins per hour per week
  const weekHourCount = {};

  monthLogs.forEach(log => {
    try {
      const d = new Date(log.timestamp);
      const hour = d.getHours();
      if (hour < 7 || hour > 18) return; // only 7 AM - 6 PM

      const relWeek = getRelativeWeek(d);
      if (relWeek > 6) return; // safety

      const key = `${relWeek}-${hour}`;
      weekHourCount[key] = (weekHourCount[key] || 0) + 1;
    } catch {}
  });

  // Build final data: one entry per hour (7 AM to 6 PM)
  const data = [];
  for (let h = 7; h <= 18; h++) {
    const entry = {
      name: isMobile ? `${h}` : `${h}:00`,
    };

    // For each possible week (1 to 6), get count or 0
    for (let w = 1; w <= 6; w++) {
      const count = weekHourCount[`${w}-${h}`] || 0;
      entry[`W${w}`] = count;
    }

    data.push(entry);
  }

  console.log("Check-ins by Time (weekly in current month):", data);

  return data;
}, [logs, isMobile]);
  // Calculate monthly attendance trend
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      const monthName = isMobile ? 
        date.toLocaleDateString('en-US', { month: 'short' }).charAt(0) :
        date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      
      const monthLogs = logs.filter(log => {
        if (!log.timestamp) return false;
        try {
          const logDate = new Date(log.timestamp);
          return logDate.getMonth() === date.getMonth() && 
                 logDate.getFullYear() === date.getFullYear();
        } catch (e) {
          return false;
        }
      });
      
      const attendanceDays = new Set();
      const presentStudents = new Set();
      
      monthLogs.forEach(log => {
        if (log.status === 'IN' && log.timestamp) {
          try {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            attendanceDays.add(logDate);
            presentStudents.add(log.studentId);
          } catch (e) {
            console.error('Error processing month log:', e);
          }
        }
      });
      
      const avgDailyAttendance = attendanceDays.size > 0 
        ? Math.round(presentStudents.size / attendanceDays.size) 
        : 0;
      
      months.push({
        name: isMobile ? monthName : `${monthName} '${year}`,
        attendance: avgDailyAttendance,
        days: attendanceDays.size
      });
    }
    
    return months;
  }, [logs, isMobile]);

  // Calculate class comparison data
  const classComparisonData = useMemo(() => {
    if (!classes || classes.length === 0 || !students || students.length === 0) {
      return [];
    }
    
    const data = classes.map(cls => {
      const classStudents = students.filter(s => s.class === cls);
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(log => {
        if (!log.timestamp || log.class !== cls) return false;
        try {
          const logDateString = new Date(log.timestamp).toISOString().split('T')[0];
          return logDateString === today && log.status === 'IN';
        } catch (e) {
          return false;
        }
      });
      
      const presentStudents = new Set();
      todayLogs.forEach(log => {
        if (log.studentId) {
          presentStudents.add(log.studentId);
        }
      });
      
      const presentCount = presentStudents.size;
      const totalCount = classStudents.length;
      const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
      
      return { 
        name: cls.length > (isMobile ? 8 : 12) ? 
          `${cls.substring(0, isMobile ? 6 : 10)}...` : cls, 
        attendanceRate: rate,
        attendance: rate,
        present: presentCount, 
        total: totalCount 
      };
    })
    .filter(cls => cls.total > 0)
    .sort((a, b) => b.attendanceRate - a.attendanceRate);
    
    return data;
  }, [classes, students, logs, isMobile]);

  // Helper: Get start of current week (Monday) in PH time
const getCurrentWeekStart = () => {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};
  
  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in overflow-x-hidden">
      {/* Stats Cards - Responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
        {[
          { 
            title: 'Total', 
            value: stats.totalStudents, 
            icon: Users, 
            color: 'blue',
            delay: 100
          },
          { 
            title: 'Present', 
            value: stats.presentToday, 
            icon: UserCheck, 
            color: 'green',
            delay: 200
          },
          { 
            title: 'Absent', 
            value: stats.absentToday, 
            icon: UserX, 
            color: 'red',
            delay: 300
          },
          { 
            title: 'Rate', 
            value: `${stats.attendanceRate}%`, 
            icon: TrendingUp, 
            color: 'purple',
            delay: 400
          },
          {
            title: 'Week Avg',
            value: dailyData?.length > 0 
              ? `${Math.round(
                  dailyData.reduce((sum, day) => sum + (day.attendanceRate || 0), 0) / dailyData.length
                )}%`
              : '0%',
            icon: Calendar,
            color: 'indigo',
            delay: 500
          },
        ].map((stat, idx) => (
          <AnimatedCard key={idx} delay={stat.delay}>
            <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/95 border-blue-100/50'} 
              shadow-lg border backdrop-blur-xl p-3 md:p-4 lg:p-6 rounded-xl md:rounded-2xl 
              transform transition-all duration-300 h-full w-full`}>
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${getColorClasses(stat.color, darkMode, 'bg')}`}>
                  <stat.icon size={isMobile ? 18 : 24} className={getColorClasses(stat.color, darkMode, 'text')} />
                </div>
                {isMobile && (
                  <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {stat.title.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1 truncate`}>
                  {isMobile && stat.title.length > 10 ? stat.title.substring(0, 9) + '..' : stat.title}
                </p>
                <p className={`text-xl md:text-2xl lg:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Weekly Attendance Trend - MOBILE OPTIMIZED */}
        <AnimatedCard delay={100}>
          <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/95 border-blue-100'} 
            backdrop-blur-xl p-4 md:p-6 rounded-xl md:rounded-2xl border shadow-xl h-full w-full`}>
            <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <Activity className="text-blue-500" size={isMobile ? 16 : 20} />
              <span className="truncate">Weekly Attendance - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            </h3>
            <div className="w-full" style={{ height: isMobile ? 260 : 300 }}>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
  <BarChart
    data={weeklyData}
    margin={{ top: 10, right: isMobile ? 8 : 20, left: 0, bottom: isMobile ? 40 : 20 }}
  >
    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} vertical={false} />
    <XAxis 
      dataKey="name" 
      stroke={darkMode ? '#9ca3af' : '#6b7280'} 
      tick={{ fontSize: isMobile ? 10 : 12 }} 
      tickLine={false} 
    />
    <YAxis 
      stroke={darkMode ? '#9ca3af' : '#6b7280'} 
      tick={{ fontSize: isMobile ? 10 : 12 }} 
      tickLine={false} 
      width={isMobile ? 30 : 60} 
    />
    <Tooltip 
      contentStyle={{
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        color: darkMode ? '#ffffff' : '#000000',
        fontSize: isMobile ? 11 : 14
      }}
    />
    <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 14 }} iconSize={isMobile ? 10 : 14} />

    <Bar 
      dataKey="present" 
      name="Present" 
      fill="#10b981" 
      radius={[4, 4, 0, 0]} 
      maxBarSize={isMobile ? 40 : 60}
      opacity={(props) => props.payload.isFuture ? 0.4 : 1} // gray future
    />
    <Bar 
      dataKey="absent" 
      name="Absent" 
      fill="#ef4444" 
      radius={[4, 4, 0, 0]} 
      maxBarSize={isMobile ? 40 : 60}
      opacity={(props) => props.payload.isFuture ? 0.4 : 1} // gray future
    />
  </BarChart>
</ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>No data available</p>
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>
        
        {/* Daily Attendance - MOBILE OPTIMIZED */}
        <AnimatedCard delay={200}>
          <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/95 border-blue-100'}
            backdrop-blur-xl p-4 md:p-6 rounded-xl md:rounded-2xl border shadow-xl h-full w-full`}>
            <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <Calendar className="text-green-500" size={isMobile ? 16 : 20} />
              <span className="truncate">Daily Attendance (Last 7 Days)</span>
            </h3>
            <div className="w-full" style={{ height: isMobile ? 260 : 300 }}>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyData}
                    margin={{
                      top: 10,
                      right: isMobile ? 8 : 20,
                      left: isMobile ? 0 : 0,
                      bottom: isMobile ? 40 : 20
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} tick={{ fontSize: isMobile ? 10 : 12 }} tickLine={false} />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} tick={{ fontSize: isMobile ? 10 : 12 }} tickLine={false} width={isMobile ? 30 : 60} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        color: darkMode ? '#ffffff' : '#000000',
                        fontSize: isMobile ? 11 : 14
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 14 }} iconSize={isMobile ? 10 : 14} />
                    <Bar 
                      dataKey="present" 
                      name="Present" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={isMobile ? 40 : 60}
                      opacity={(props) => props.payload.present === 0 ? 0.3 : 1} // ← Gray out zero bars
                    />
                    <Bar 
                      dataKey="absent" 
                      name="Absent" 
                      fill="#ef4444" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={isMobile ? 40 : 60}
                      opacity={(props) => props.payload.absent === 0 ? 0.3 : 1} // ← Gray out zero bars
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>No data available</p>
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>
        
        {/* Monthly Trend - Only on larger screens */}
        {!isMobile && (
          <AnimatedCard delay={300}>
            <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/95 border-blue-100'} 
              backdrop-blur-xl p-6 rounded-2xl border shadow-xl h-full w-full`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                <TrendingUp className="text-purple-500" size={20} />
                Monthly Trend
              </h3>
              <div style={{ height: '250px', width: '100%' }}>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={monthlyData}
                      margin={{
                        top: 10,
                        right: isMobile ? 8 : 20,
                        left: isMobile ? 0 : 0,  
                        bottom: isMobile ? 40 : 20 
                      }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={darkMode ? '#374151' : '#e5e7eb'} 
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="name" 
                        stroke={darkMode ? '#9ca3af' : '#6b7280'}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                          border: 'none', 
                          borderRadius: '12px', 
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          color: darkMode ? '#ffffff' : '#000000'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendance" 
                        name="Avg Daily" 
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        dot={{ fill: '#8b5cf6', r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data available</p>
                  </div>
                )}
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Check-ins by Time - Weekly in Current Month */}
{!isMobile && (
  <AnimatedCard delay={400}>
    <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/95 border-blue-100'}
      backdrop-blur-xl p-6 rounded-2xl border shadow-xl h-full w-full`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
        <Clock className="text-orange-500" size={20} />
        Check-ins by Time (Weekly)
      </h3>
      <div style={{ height: '250px', width: '100%' }}>
        {hourlyData.some(h => Object.values(h).some(v => typeof v === 'number' && v > 0)) ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  color: darkMode ? '#ffffff' : '#000000'
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />

              {/* One line per week */}
              {['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map((week, idx) => (
                <Line
                  key={week}
                  type="monotone"
                  dataKey={week}
                  name={week}
                  stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][idx]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No check-ins this month</p>
          </div>
        )}
      </div>
    </div>
  </AnimatedCard>
)}

        {/* Class Performance - MOBILE OPTIMIZED */}
        <AnimatedCard delay={isMobile ? 300 : 500}>
          <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/95 border-blue-100'} 
            backdrop-blur-xl p-4 md:p-6 rounded-xl md:rounded-2xl border shadow-xl h-full w-full`}>
            <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <Target className="text-indigo-500" size={isMobile ? 16 : 20} />
              <span className="truncate">Class Performance</span>
            </h3>
            <div className="w-full" style={{ height: isMobile ? 260 : 300 }}>
              {classComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={classComparisonData}
                   margin={{
                      top: 10,
                      right: isMobile ? 8 : 20,
                      left: isMobile ? 0 : 0,  
                      bottom: isMobile ? 40 : 20  
                    }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={darkMode ? '#374151' : '#e5e7eb'} 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="name" 
                      stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      tick={{ fontSize: isMobile ? 9 : 12 }}
                      angle={isMobile ? -60 : -45} 
                      textAnchor="end"
                      height={isMobile ? 70 : 50}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke={darkMode ? '#9ca3af' : '#6b7280'}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickLine={false}
                      width={isMobile ? 35 : 60}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        color: darkMode ? '#ffffff' : '#000000',
                        fontSize: isMobile ? 11 : 14
                      }}
                      formatter={(value, name, props) => {
                        if (name === 'attendanceRate') {
                          return [`${value}% (${props.payload.present || 0}/${props.payload.total || 0})`, 'Attendance'];
                        }
                        return [value, name];
                      }}
                    />
                    <Bar 
                      dataKey="attendanceRate" 
                      name="Attendance %" 
                      fill="#6366f1" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 40 : 60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>No class data available</p>
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Summary Cards - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[
  {
    title: "Today's Summary",
    icon: Calendar,
    iconColor: "text-blue-500",
    content: (
      <div className="space-y-2 md:space-y-3">
        <div className="flex justify-between items-center">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            Total Check-ins:
          </span>
          <span className={`${darkMode ? 'text-white' : 'text-gray-600'} font-bold`}>
            {dailyData.length > 0 ? dailyData[dailyData.length - 1].present : 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            Attendance Rate:
          </span>
          <span className="font-bold text-green-500">
            {dailyData.length > 0 ? `${dailyData[dailyData.length - 1].attendanceRate}%` : '0%'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            Absent:
          </span>
          <span className="font-bold text-red-500">
            {dailyData.length > 0 ? dailyData[dailyData.length - 1].absent : students.length || 0}
          </span>
        </div>
      </div>
    ),
    delay: 600
  },
{
  title: "Week Summary",
  icon: TrendingUp,
  iconColor: "text-green-500",
  content: (
    <div className="space-y-2 md:space-y-3">
      {/* Avg Daily Present Students – this week only */}
      <div className="flex justify-between items-center">
        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
          Avg Daily Present:
        </span>
        <span className="font-bold">
          {dailyData.length > 0
            ? Math.round(
                dailyData.reduce((sum, day) => sum + day.present, 0) / dailyData.length
              )
            : 0}
        </span>
      </div>

      {/* Avg Rate – this week only */}
      <div className="flex justify-between items-center">
        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
          Avg Rate:
        </span>
        <span className="font-bold text-purple-500">
          {dailyData.length > 0
            ? `${Math.round(
                dailyData.reduce((sum, day) => sum + day.attendanceRate, 0) / dailyData.length
              )}%`
            : '0%'}
        </span>
      </div>

      {/* Best Day – only in current week */}
      <div className="flex justify-between items-center">
        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
          Best Day This Week:
        </span>
        <span className="font-bold text-green-500">
          {dailyData.length > 0 && dailyData.some(d => d.present > 0)
            ? dailyData.reduce((max, day) => (day.present > max.present ? day : max), dailyData[0]).name
            : 'N/A'}
        </span>
      </div>

      {/* Trend – last day vs first day in available data */}
      <div className="flex justify-between items-center">
        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
          Trend This Week:
        </span>
        <span
          className={`font-bold ${
            dailyData.length > 1
              ? dailyData[dailyData.length - 1].attendanceRate > dailyData[0].attendanceRate
                ? 'text-green-500'
                : dailyData[dailyData.length - 1].attendanceRate < dailyData[0].attendanceRate
                  ? 'text-red-500'
                  : 'text-yellow-500'
              : 'text-gray-500'
          }`}
        >
          {dailyData.length > 1
            ? dailyData[dailyData.length - 1].attendanceRate > dailyData[0].attendanceRate
              ? '↗ Improving'
              : dailyData[dailyData.length - 1].attendanceRate < dailyData[0].attendanceRate
                ? '↘ Declining'
                : '→ Stable'
            : 'Not enough data'}
        </span>
      </div>
    </div>
  ),
  delay: 700
},
  {
    title: "Top Class",
    icon: Award,
    iconColor: "text-yellow-500",
    content: classComparisonData.length > 0 ? (
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className={`${darkMode ? 'text-white' : 'text-gray-600'} font-bold text-lg md:text-xl truncate`}>
              {classComparisonData[0].name}
            </p>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-xs md:text-sm truncate`}>
              {classComparisonData[0].present}/{classComparisonData[0].total} present today
            </p>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${
            classComparisonData[0].attendanceRate >= 90 ? 'text-green-500' :
            classComparisonData[0].attendanceRate >= 70 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {classComparisonData[0].attendanceRate}%
          </div>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
            style={{ width: `${Math.min(classComparisonData[0].attendanceRate, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600 truncate'}>
            Rank: 1/{classComparisonData.length}
          </span>
          {classComparisonData.length > 1 && (
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600 truncate'}>
              Next: {classComparisonData[1].attendanceRate}% ({classComparisonData[1].name})
            </span>
          )}
        </div>
      </div>
    ) : (
      <div className="text-center py-4">
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm md:text-base`}>
          {classes.length === 0 ? "No classes found" : "No attendance data yet"}
        </p>
      </div>
    ),
    delay: 800
  }
].map((card, idx) => (
          <AnimatedCard key={idx} delay={card.delay}>
            <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/95 border-blue-100'} 
              backdrop-blur-xl p-4 md:p-6 rounded-xl md:rounded-2xl border shadow-xl h-full w-full overflow-hidden`}>
              <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                <card.icon className={card.iconColor} size={isMobile ? 16 : 20} />
                <span className="truncate">{card.title}</span>
              </h3>
              {card.content}
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
};
              

// Classroom Monitor Tab Component - Enhanced for mobile
const ClassroomMonitorTab = ({ 
  darkMode, 
  students, 
  classes, 
  searchQuery, 
  setSearchQuery, 
  selectedClass, 
  setSelectedClass,
  getStudentStatus 
}) => {
  const isMobile = useIsMobile();

  // Filter classes based on search query
  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes;
    
    const query = searchQuery.toLowerCase();
    return classes.filter(className => {
      // Check if class name matches
      if (className.toLowerCase().includes(query)) return true;
      
      // Check if any student in this class matches
      const classStudents = students.filter(s => s.class === className);
      return classStudents.some(student => 
        student.name.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query)
      );
    });
  }, [classes, students, searchQuery]);

  // Get students for a specific class that match search
  const getFilteredClassStudents = (className) => {
    const classStudents = students.filter(s => s.class === className);
    
    if (!searchQuery) return classStudents;
    
    const query = searchQuery.toLowerCase();
    return classStudents.filter(student => 
      student.name.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query)
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in overflow-x-hidden">
      {/* Enhanced Search Bar for Mobile */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1 w-full">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
            size={isMobile ? 18 : 20} />
          <input
            type="text"
            placeholder={isMobile ? "Search class, student, ID..." : "Search by class name, student name, or ID..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800/60 border-gray-700 text-white' : 'bg-white/90 border-blue-100 text-gray-800'} 
              border-2 backdrop-blur-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm md:text-base`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <X size={isMobile ? 16 : 18} />
            </button>
          )}
        </div>
        
        {/* Search Results Info */}
        {searchQuery && (
          <div className={`px-3 md:px-4 py-2 rounded-xl ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'} 
            text-sm flex-shrink-0 flex items-center`}>
            <span className="font-medium whitespace-nowrap">
              {filteredClasses.length}/{classes.length} classes
            </span>
          </div>
        )}
      </div>

      {/* Class Cards - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full">
            <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/90 border-blue-100'} 
              backdrop-blur-xl p-6 md:p-8 rounded-2xl border shadow-xl text-center animate-pulse w-full`}>
              <Search size={isMobile ? 32 : 48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <h3 className={`text-lg md:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                No matching classes
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base`}>
                No classes match "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className={`mt-4 px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'} 
                  transition-colors text-sm md:text-base`}
              >
                Clear search
              </button>
            </div>
          </div>
        ) : (
          filteredClasses.map((className, idx) => {
            const classStudents = students.filter(s => s.class === className);
            const filteredStudents = getFilteredClassStudents(className);
            const presentCount = filteredStudents.filter(s => getStudentStatus(s.studentId) === 'present').length;
            const absentCount = filteredStudents.filter(s => getStudentStatus(s.studentId) === 'absent').length;
            const noLogsCount = filteredStudents.filter(s => getStudentStatus(s.studentId) === 'no-logs').length;
            const isExpanded = selectedClass === className;
            
            return (
              <AnimatedCard key={idx} delay={idx * 100}>
                <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/90 border-blue-100'} 
                  backdrop-blur-xl rounded-xl md:rounded-2xl border shadow-xl transition-all duration-300 h-full flex flex-col w-full`}>
                  {/* Class Header */}
                  <div
                    onClick={() => setSelectedClass(isExpanded ? null : className)}
                    className="p-4 md:p-6 cursor-pointer hover:bg-white/5 transition-colors rounded-t-xl md:rounded-t-2xl flex-grow"
                  >
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
                          {className}
                          {searchQuery && filteredStudents.length !== classStudents.length && (
                            <span className="ml-2 text-xs font-normal px-2 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              {filteredStudents.length}/{classStudents.length}
                            </span>
                          )}
                        </h3>
                        {searchQuery && (
                          <p className={`text-xs md:text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} match search
                          </p>
                        )}
                      </div>
                      <ChevronRight 
                        size={isMobile ? 20 : 24} 
                        className={`${isExpanded ? 'rotate-90' : ''} transition-transform flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-600'} ml-2`} 
                      />
                    </div>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
                      {[
                        { count: presentCount, color: 'green', label: 'Present' },
                        { count: absentCount, color: 'red', label: 'Absent' },
                        { count: noLogsCount, color: 'gray', label: 'No Logs' }
                      ].map((stat, statIdx) => (
                        <div key={statIdx} 
                          className={`${getColorClasses(stat.color, darkMode, 'bg')} border ${getColorClasses(stat.color, darkMode, 'border')}
                            rounded-lg p-2 md:p-3 text-center w-full`}>
                          <p className={`text-xs ${getColorClasses(stat.color, darkMode, 'text')} mb-1 truncate`}>
                            {isMobile ? stat.label.charAt(0) : stat.label}
                          </p>
                          <p className={`text-xl md:text-2xl font-bold ${getColorClasses(stat.color, darkMode, 'text')}`}>
                            {stat.count}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600 truncate'}>
                          {searchQuery ? 'Filtered:' : 'Total:'} {filteredStudents.length}
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                          {filteredStudents.length > 0 ? Math.round((presentCount / filteredStudents.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden w-full`}>
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                          style={{ width: `${filteredStudents.length > 0 ? (presentCount / filteredStudents.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Student List */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 md:p-4 space-y-2 max-h-64 md:max-h-96 overflow-y-auto w-full">
                      {filteredStudents.length === 0 ? (
                        <div className="text-center py-3 md:py-4 w-full">
                          <Search size={isMobile ? 20 : 24} className={`mx-auto mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            No students match search
                          </p>
                        </div>
                      ) : (
                        filteredStudents
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((student, sIdx) => {
                            const status = getStudentStatus(student.studentId);
                            const statusBg = status === 'present' ? 'bg-green-500/10' :
                                            status === 'absent' ? 'bg-red-500/10' :
                                            'bg-gray-500/10';
                            const statusBorder = status === 'present' ? 'border-green-100' :
                                               status === 'absent' ? 'border-red-100' :
                                               'border-gray-100';
                            const statusBgLight = status === 'present' ? 'bg-green-50' :
                                                status === 'absent' ? 'bg-red-50' :
                                                'bg-gray-50';
                            const statusHover = status === 'present' ? 'hover:bg-green-500/20' :
                                              status === 'absent' ? 'hover:bg-red-500/20' :
                                              'hover:bg-gray-500/20';
                            const statusHoverLight = status === 'present' ? 'hover:bg-green-100' :
                                                   status === 'absent' ? 'hover:bg-red-100' :
                                                   'hover:bg-gray-100';
                            
                            return (
                              <div 
                                key={sIdx} 
                                className={`flex items-center justify-between p-2 md:p-3 rounded-xl transition-all transform hover:scale-[1.02] animate-fade-in-up
                                  ${darkMode ? `${statusBg} ${statusHover}` : `${statusBgLight} ${statusHoverLight} border ${statusBorder}`}
                                  w-full`}
                                style={{ animationDelay: `${sIdx * 50}ms` }}
                              >
                                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                  <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0 ${
                                    status === 'present' ? 'bg-green-500 shadow-lg shadow-green-500/50' :
                                    status === 'absent' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                                    'bg-gray-400 shadow-lg shadow-gray-400/50'
                                  }`}></div>
                                  <div className="min-w-0 flex-1">
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} truncate text-sm md:text-base`}>
                                      {student.name}
                                      {searchQuery && (
                                        <span className="ml-1 md:ml-2 text-xs px-1 md:px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                          Match
                                        </span>
                                      )}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                                      {student.studentId}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-2 md:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ml-2
                                  ${status === 'present' ? 'bg-green-500 text-white' :
                                    status === 'absent' ? 'bg-red-500 text-white' :
                                    'bg-gray-400 text-white'
                                  }`}>
                                  {status === 'present' ? 'IN' : status === 'absent' ? 'OUT' : 'NO LOGS'}
                                </span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>
              </AnimatedCard>
            );
          })
        )}
      </div>
    </div>
  );
};

// Enhanced Logs Tab Component - Responsive
const LogsTab = ({ darkMode, loading, logs: allLogs, exportToCSV, students, classes }) => {
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(!isMobile);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortOrder('newest');
    setDateFilter({ startDate: '', endDate: '' });
    setStatusFilter('all');
    setClassFilter('all');
  };

  // Get unique classes from logs
  const uniqueClasses = useMemo(() => {
    const classesSet = new Set(allLogs.map(log => log.class));
    return Array.from(classesSet).sort();
  }, [allLogs]);

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let filtered = [...allLogs];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.studentId.toLowerCase().includes(term) ||
        log.name.toLowerCase().includes(term) ||
        log.class.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateFilter.startDate) {
      filtered = filtered.filter(log => {
        const logDate = log.timestamp.split('T')[0];
        return logDate >= dateFilter.startDate;
      });
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(log => {
        const logDate = log.timestamp.split('T')[0];
        return logDate <= dateFilter.endDate;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Apply class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter(log => log.class === classFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [allLogs, searchTerm, sortOrder, dateFilter, statusFilter, classFilter]);

  // Get date range for default values
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in overflow-x-hidden">
      {/* Header with mobile controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div className="w-full sm:w-auto">
          <h2 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
            Attendance Logs
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {filteredLogs.length} of {allLogs.length} records
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto flex-wrap">
          {isMobile && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50 hover:bg-blue-100'} transition-colors`}
            >
              <Filter size={18} />
              <span className="text-sm">Filters</span>
            </button>
          )}
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm md:text-base"
          >
            <X size={18} />
            {!isMobile && "Reset"}
          </button>
          <button
            onClick={() => exportToCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 md:px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            <Download size={18} />
            {!isMobile && "Export"}
          </button>
        </div>
      </div>

      {/* Enhanced Filter Controls - Mobile responsive */}
      {(showFilters || !isMobile) && (
        <AnimatedCard>
          <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/90 border-blue-100/50'} 
            backdrop-blur-xl p-4 md:p-6 rounded-xl md:rounded-2xl border shadow-xl w-full`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Filter size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                <h3 className={`text-base md:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Filter Logs
                </h3>
              </div>
              {isMobile && (
                <button
                  onClick={() => setShowFilters(false)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XIcon size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Search
                </label>
                <div className="relative w-full">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ID, Name, Class..."
                    className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} 
                      border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sort
                </label>
                <div className="relative w-full">
                  <ArrowUpDown className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} 
                      border-2 backdrop-blur-sm appearance-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} 
                    border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                >
                  <option value="all">All Status</option>
                  <option value="IN">IN Only</option>
                  <option value="OUT">OUT Only</option>
                </select>
              </div>

              {/* Class Filter */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Class
                </label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} 
                    border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                >
                  <option value="all">All Classes</option>
                  {uniqueClasses.map((cls, idx) => (
                    <option key={idx} value={cls}>
                      {cls.length > 15 ? cls.substring(0, 12) + '...' : cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Date Presets */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quick Range
                </label>
                <select
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'today') {
                      setDateFilter({ startDate: today, endDate: today });
                    } else if (value === 'week') {
                      setDateFilter({ startDate: oneWeekAgo, endDate: today });
                    } else if (value === 'month') {
                      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setDateFilter({ startDate: oneMonthAgo, endDate: today });
                    }
                  }}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} 
                    border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                >
                  <option value="">Select Range</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>

            {/* Date Range Pickers - Stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
              <div className="space-y-2 w-full">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  max={today}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} 
                    border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                />
              </div>
              <div className="space-y-2 w-full">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  max={today}
                  min={dateFilter.startDate}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} 
                    border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                />
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || dateFilter.startDate || dateFilter.endDate || statusFilter !== 'all' || classFilter !== 'all') && (
              <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fade-in w-full">
                <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'} truncate`}>
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {dateFilter.startDate && (
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'} truncate`}>
                      From: {dateFilter.startDate}
                    </span>
                  )}
                  {dateFilter.endDate && (
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'} truncate`}>
                      To: {dateFilter.endDate}
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'} truncate`}>
                      Status: {statusFilter}
                    </span>
                  )}
                  {classFilter !== 'all' && (
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-600'} truncate`}>
                      Class: {classFilter}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </AnimatedCard>
      )}

      {/* Logs Table - Mobile optimized */}
      <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/90 border-blue-100/50'} 
        backdrop-blur-xl rounded-xl md:rounded-2xl border shadow-xl overflow-hidden w-full`}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 md:p-12 text-center w-full">
              <div className="inline-block animate-pulse">
                <RefreshCw size={isMobile ? 32 : 48} className={`mx-auto mb-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              </div>
              <p className={`text-base md:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} animate-pulse`}>
                Loading logs...
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 md:p-12 text-center animate-fade-in w-full">
              <Calendar size={isMobile ? 32 : 48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              <p className={`text-base md:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No records match your filters
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-700/50">
                <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing {filteredLogs.length} records • Sorted {sortOrder === 'newest' ? 'newest first' : 'oldest first'}
                </p>
              </div>
              {isMobile ? (
                // Mobile cards view
                <div className="p-4 space-y-3 w-full">
                  {filteredLogs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`${darkMode ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-gray-50/50 hover:bg-gray-50/70'} 
                        p-4 rounded-xl transition-all duration-200 transform hover:scale-[1.01] animate-fade-in-up w-full`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex justify-between items-start mb-2 w-full">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'} mb-1 truncate`}>
                            {log.name}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                            {log.studentId} • {log.class}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                          log.status === 'IN' 
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                            : 'bg-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} truncate`}>
                        {new Date(log.timestamp).toLocaleDateString()} • 
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop table view
                <table className="w-full">
                  <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}>
                    <tr>
                      <th className={`px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Timestamp</th>
                      <th className={`px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Student ID</th>
                      <th className={`px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Name</th>
                      <th className={`px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Class</th>
                      <th className={`px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {filteredLogs.map((log, idx) => (
                      <tr 
                        key={idx} 
                        className={`${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'} transition-colors duration-150 animate-fade-in-up`}
                        style={{ animationDelay: `${idx * 20}ms` }}
                      >
                        <td className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{log.studentId}</td>
                        <td className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{log.name}</td>
                        <td className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{log.class}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            log.status === 'IN' 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                              : 'bg-red-500/20 text-red-600 dark:text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
// Parent Logs Tab Component - Enhanced for mobile
const ParentLogsTab = ({ 
  darkMode, 
  loading, 
  logs: allLogs, 
  userInfo, 
  students, 
  exportToCSV,
  childInfo: propChildInfo,
  childStats: propChildStats,
  parentChildId 
}) => {
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(!isMobile);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState('all');
  
  const childInfo = propChildInfo;
  const childStats = propChildStats;

  // Filter logs to show only parent's child
  const childLogs = useMemo(() => {
    if (!parentChildId) return [];
    
    const filtered = allLogs.filter(log => log.studentId === parentChildId);
    return filtered;
  }, [allLogs, parentChildId]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortOrder('newest');
    setDateFilter({ startDate: '', endDate: '' });
    setStatusFilter('all');
  };

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let filtered = [...childLogs];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.studentId?.toLowerCase().includes(term) ||
        log.name?.toLowerCase().includes(term) ||
        log.class?.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateFilter.startDate) {
      filtered = filtered.filter(log => {
        if (!log.timestamp) return false;
        const logDate = log.timestamp.split('T')[0];
        return logDate >= dateFilter.startDate;
      });
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(log => {
        if (!log.timestamp) return false;
        const logDate = log.timestamp.split('T')[0];
        return logDate <= dateFilter.endDate;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [childLogs, searchTerm, sortOrder, dateFilter, statusFilter]);

  // Get date range for default values
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in overflow-x-hidden">
      {/* Welcome Header - Mobile optimized */}
      <AnimatedCard delay={100}>
        <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/90 border-blue-100'} 
          backdrop-blur-xl p-4 md:p-6 rounded-xl md:rounded-2xl border shadow-xl w-full`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
                Welcome, {userInfo?.fullName?.split(' ')[0] || 'Parent'}!
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 md:mt-2 text-sm md:text-base truncate`}>
                {childInfo 
                  ? `Viewing attendance for ${isMobile ? childInfo.name.split(' ')[0] : childInfo.name}`
                  : 'Loading child information...'
                }
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => exportToCSV(filteredLogs)}
                disabled={filteredLogs.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 md:px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                <Download size={18} />
                {!isMobile && "Export CSV"}
              </button>
            </div>
          </div>
          
          {/* Child Summary - Mobile responsive */}
          {childInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
              {[
                { label: 'Student ID', value: childInfo.studentId, color: 'blue' },
                { label: "Today's Logs", value: childStats.todayLogs, color: 'green' },
                { label: 'Total Records', value: childStats.totalLogs, color: 'purple' },
                { label: 'Attendance Rate', value: `${childStats.attendanceRate}%`, color: 'orange' }
              ].map((stat, idx) => (
                <div key={idx} 
                  className={`${getColorClasses(stat.color, darkMode, 'bg')} border ${getColorClasses(stat.color, darkMode, 'border')}
                    p-3 md:p-4 rounded-xl w-full`}>
                  <p className={`text-xs ${getColorClasses(stat.color, darkMode, 'text')} mb-1 truncate`}>
                    {isMobile && stat.label.includes(' ') ? stat.label.split(' ')[0] : stat.label}
                  </p>
                  <p className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Filter Controls - Mobile toggle */}
      {(showFilters || !isMobile) && (
        <AnimatedCard delay={200}>
          <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/90 border-blue-100'} 
            backdrop-blur-xl p-4 md:p-6 rounded-xl md:rounded-2xl border shadow-xl w-full`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Filter size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                <h3 className={`text-base md:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Filter Records
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm px-2 py-1 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                  {filteredLogs.length} of {childLogs.length}
                </span>
                {isMobile && (
                  <button
                    onClick={() => setShowFilters(false)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <XIcon size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Search
                </label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by date, status..."
                    className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-blue-200 text-gray-900'} 
                      border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sort
                </label>
                <div className="relative">
                  <ArrowUpDown className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-blue-200 text-gray-900'} 
                      border-2 backdrop-blur-sm appearance-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-blue-200 text-gray-900'} 
                    border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                >
                  <option value="all">All Status</option>
                  <option value="IN">IN Only</option>
                  <option value="OUT">OUT Only</option>
                </select>
              </div>

              {/* Quick Date Presets */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quick Presets
                </label>
                <select
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'today') {
                      setDateFilter({ startDate: today, endDate: today });
                    } else if (value === 'week') {
                      setDateFilter({ startDate: oneWeekAgo, endDate: today });
                    } else if (value === 'month') {
                      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setDateFilter({ startDate: oneMonthAgo, endDate: today });
                    } else if (value === 'clear') {
                      setDateFilter({ startDate: '', endDate: '' });
                    }
                  }}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-blue-200 text-gray-900'} 
                    border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                >
                  <option value="">Select Range</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="clear">Clear Dates</option>
                </select>
              </div>
            </div>

            {/* Date Range Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4">
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  max={today}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-blue-200 text-gray-900'} 
                    border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                />
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  max={today}
                  min={dateFilter.startDate}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-blue-200 text-gray-900'} 
                    border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 text-sm md:text-base`}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm md:text-base"
                >
                  <X size={18} />
                  Reset All Filters
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || dateFilter.startDate || dateFilter.endDate || statusFilter !== 'all') && (
              <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fade-in">
                <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'} truncate`}>
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {dateFilter.startDate && (
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'} truncate`}>
                      From: {dateFilter.startDate}
                    </span>
                  )}
                  {dateFilter.endDate && (
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'} truncate`}>
                      To: {dateFilter.endDate}
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'} truncate`}>
                      Status: {statusFilter}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </AnimatedCard>
      )}

      {/* Mobile Filter Toggle Button */}
      {isMobile && !showFilters && (
        <button
          onClick={() => setShowFilters(true)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50 hover:bg-blue-100'} 
            transition-colors border ${darkMode ? 'border-gray-600' : 'border-blue-200'} animate-pulse`}
        >
          <Filter size={18} />
          <span className="font-medium truncate">Show Filters ({filteredLogs.length}/{childLogs.length})</span>
        </button>
      )}

      {/* Attendance Records - Mobile optimized */}
      <AnimatedCard delay={300}>
        <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/90 border-blue-100'} 
          backdrop-blur-xl rounded-xl md:rounded-2xl border shadow-xl overflow-hidden w-full`}>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 md:p-12 text-center w-full">
                <RefreshCw size={isMobile ? 32 : 48} className={`mx-auto mb-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                <p className={`text-base md:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading records...</p>
              </div>
            ) : !parentChildId ? (
              <div className="p-8 md:p-12 text-center w-full">
                <User size={isMobile ? 32 : 48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                <h3 className={`text-lg md:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  No Child Assigned
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base`}>
                  Account not linked to any student
                </p>
              </div>
            ) : childLogs.length === 0 ? (
              <div className="p-8 md:p-12 text-center w-full">
                <Calendar size={isMobile ? 32 : 48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                <h3 className={`text-lg md:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  No Records Found
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base`}>
                  No attendance logs found yet
                </p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 md:p-12 text-center w-full">
                <Calendar size={isMobile ? 32 : 48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                <h3 className={`text-lg md:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  No Matching Records
                </h3>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all text-sm md:text-base"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-700/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                      Showing {filteredLogs.length} of {childLogs.length} records
                    </p>
                    <p className={`text-xs md:text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-600'} truncate`}>
                      {childInfo?.name || 'Child'} • {childInfo?.class || 'Class'}
                    </p>
                  </div>
                </div>
                {isMobile ? (
                  // Mobile cards view
                  <div className="p-4 space-y-3 w-full">
                    {filteredLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={`${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/50'} 
                          p-4 rounded-xl transition-colors animate-fade-in-up w-full`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                            log.status === 'IN' 
                              ? `${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700 border border-green-200'}` 
                              : `${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700 border border-red-200'}`
                          }`}>
                            {log.status || 'UNKNOWN'}
                          </span>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <span className="font-medium text-sm truncate">{log.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={darkMode ? 'text-gray-500' : 'text-gray-600 truncate'}>
                              Class: {log.class || 'Unknown'}
                            </span>
                            <span className={darkMode ? 'text-gray-500' : 'text-gray-600 truncate'}>
                              • ID: {log.studentId || 'N/A'}
                            </span>
                          </div>
                          {log.timestamp && (
                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                              Time: {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Desktop table view
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-gray-700/50' : 'bg-blue-50/70 border-b border-blue-100'}>
                      <tr>
                        <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-blue-600'} uppercase`}>Timestamp</th>
                        <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-blue-600'} uppercase`}>Status</th>
                        <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-blue-600'} uppercase`}>Details</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {filteredLogs.map((log, idx) => (
                        <tr 
                          key={idx} 
                          className={`${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50/50'} transition-colors animate-fade-in-up`}
                          style={{ animationDelay: `${idx * 20}ms` }}
                        >
                          <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div className="text-sm font-medium">
                              {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-xs opacity-75">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                              log.status === 'IN' 
                                ? `${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700 border border-green-200'}` 
                                : `${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700 border border-red-200'}`
                            }`}>
                              {log.status || 'UNKNOWN'}
                            </span>
                          </td>
                          <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div className="text-sm">
                              <span className="font-medium truncate">{log.name || 'Unknown'}</span>
                              <div className="text-xs opacity-75 mt-1">
                                Class: {log.class || 'Unknown'} • ID: {log.studentId || 'N/A'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
};
// Main component with mobile menu - UPDATED HEADER
export default function AttendancePortal() {
  const [authenticated, setAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userType, setUserType] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
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
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Add parent-specific states
  const [parentChildId, setParentChildId] = useState(null);
  const [childInfo, setChildInfo] = useState(null);
  const [childStats, setChildStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    attendanceRate: 0
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Check existing session
    const sessionToken = sessionStorage.getItem('sessionToken');
    const loginTime = sessionStorage.getItem('loginTime');
    
    if (sessionToken && loginTime) {
      const timeSinceLogin = Date.now() - parseInt(loginTime);
      if (timeSinceLogin > SESSION_TIMEOUT) {
        sessionStorage.clear();
      }
    }
  }, []);

  // Calculate child info when userInfo or students change
  useEffect(() => {
    if (userType === 'parent' && userInfo && students.length > 0) {
      let childId = null;
      
      if (userInfo?.studentId) {
        childId = userInfo.studentId;
      } else if (userInfo?.child?.studentId) {
        childId = userInfo.child.studentId;
      } else if (userInfo?.children && userInfo.children.length > 0) {
        childId = userInfo.children[0].studentId;
      } else if (students.length === 1) {
        childId = students[0].studentId;
      } else if (students.length > 0) {
        const logStudentIds = [...new Set(logs.map(log => log.studentId))];
        if (logStudentIds.length === 1) {
          childId = logStudentIds[0];
        }
      }
      
      setParentChildId(childId);
      
      if (childId) {
        const childStudent = students.find(s => s.studentId === childId);
        if (childStudent) {
          setChildInfo({
            studentId: childStudent.studentId,
            name: childStudent.name,
            class: childStudent.class
          });
        } else {
          setChildInfo({
            studentId: childId,
            name: userInfo?.child?.name || userInfo?.fullName || 'My Child',
            class: userInfo?.child?.class || userInfo?.class || 'Unknown'
          });
        }
      }
    } else if (userType === 'parent') {
      setChildInfo(null);
      setParentChildId(null);
    }
  }, [userType, userInfo, students, logs]);

  // Calculate child logs and stats
  useEffect(() => {
    if (userType === 'parent' && parentChildId) {
      const childLogs = logs.filter(log => log.studentId === parentChildId);
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = childLogs.filter(log => log.timestamp?.startsWith(today));
      
      const uniqueDays = new Set(childLogs.map(log => log.timestamp?.split('T')[0]));
      const daysWithIN = new Set(
        childLogs.filter(log => log.status === 'IN').map(log => log.timestamp?.split('T')[0])
      );
      const attendanceRate = uniqueDays.size > 0 
        ? Math.round((daysWithIN.size / uniqueDays.size) * 100) 
        : 0;
      
      setChildStats({
        totalLogs: childLogs.length,
        todayLogs: todayLogs.length,
        attendanceRate: attendanceRate
      });
    } else if (userType === 'parent') {
      setChildStats({
        totalLogs: 0,
        todayLogs: 0,
        attendanceRate: 0
      });
    }
  }, [userType, parentChildId, logs]);

  // Session timeout monitoring
  useEffect(() => {
    if (!authenticated) return;

    const checkSession = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      if (timeSinceActivity > SESSION_TIMEOUT) {
        alert('Session expired due to inactivity');
        handleLogout();
      }
    }, 60000);

    return () => clearInterval(checkSession);
  }, [authenticated, lastActivity]);

  // Activity tracker
  useEffect(() => {
    if (!authenticated) return;

    const updateActivity = () => setLastActivity(Date.now());
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => document.addEventListener(event, updateActivity));
    return () => {
      events.forEach(event => document.removeEventListener(event, updateActivity));
    };
  }, [authenticated]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const secureApiCall = async (action, params = {}) => {
    const sessionToken = sessionStorage.getItem('sessionToken');
    if (!sessionToken) throw new Error('Not authenticated');
  
    const queryParams = new URLSearchParams({ 
      action, 
      sessionToken,
      ...params 
    }).toString();
    
    const response = await fetch(`${API_ENDPOINT}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
      },
    });
  
    if (!response.ok) {
      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired');
      }
      throw new Error('API request failed');
    }
  
    return response.json();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const response = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('sessionToken', data.sessionToken);
        sessionStorage.setItem('userType', data.userType);
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('userInfo', JSON.stringify(data));
        sessionStorage.setItem('loginTime', Date.now().toString());
        
        setAuthenticated(true);
        setUserType(data.userType);
        setUserInfo(data);
        setLastActivity(Date.now());
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setAuthenticated(false);
    setUserType(null);
    setUsername('');
    setPassword('');
    setUserInfo(null);
    setLogs([]);
    setChildInfo(null);
    setParentChildId(null);
    setChildStats({
      totalLogs: 0,
      todayLogs: 0,
      attendanceRate: 0
    });
    setMobileMenuOpen(false);
  };

const fetchData = async () => {
  setLoading(true);
  try {
    // Get data for the last 30 days to have enough data for weekly charts
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    console.log('📊 Fetching data with dates:', { startDate, endDate });
    
    const dashboardData = await secureApiCall('getDashboardStats', {
      startDate,
      endDate
    });

    console.log('📊 Raw API Response:', {
      success: dashboardData.success,
      studentsCount: dashboardData.students?.length,
      logsCount: dashboardData.logs?.length,
      stats: dashboardData.stats,
      firstLog: dashboardData.logs?.[0]
    });
    
    if (dashboardData.success) {
      const fetchedStudents = dashboardData.students || [];
      const fetchedLogs = dashboardData.logs || [];
      const fetchedStats = dashboardData.stats || {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0
      };

      // Sort logs by timestamp (newest first)
      const sortedLogs = fetchedLogs.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      setStudents(fetchedStudents);
      setLogs(sortedLogs);
      setStats(fetchedStats);
      
      // Calculate weekly data - FIXED VERSION
      const calculatedWeeklyData = calculateWeeklyData(sortedLogs, fetchedStudents);
      console.log('📊 Calculated Weekly Data:', calculatedWeeklyData);
      
      setWeeklyData(calculatedWeeklyData);
      
      if (userType === 'teacher') {
        try {
          const classesData = await secureApiCall('getClasses');
          if (classesData.success) {
            setClasses(classesData.classes || []);
          }
        } catch (classError) {
          console.error('Error fetching classes:', classError);
          // Extract unique classes from students as fallback
          const uniqueClasses = [...new Set(fetchedStudents.map(s => s.class))].filter(Boolean);
          setClasses(uniqueClasses);
        }
      } else {
        // For parents, get classes from their child
        const uniqueClasses = [...new Set(fetchedStudents.map(s => s.class))].filter(Boolean);
        setClasses(uniqueClasses);
      }
    } else {
      console.error('API returned unsuccessful:', dashboardData);
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    // Don't reset data on error, keep existing data
  } finally {
    setLoading(false);
  }
};

 const calculateWeeklyData = (logData, studentsList) => {
  console.log('📊 Starting weekly data calculation:', {
    totalLogs: logData?.length,
    totalStudents: studentsList?.length,
    firstLogTimestamp: logData?.[0]?.timestamp,
    lastLogTimestamp: logData?.[logData.length - 1]?.timestamp
  });

  // If no data, return empty array
  if (!logData || logData.length === 0 || !studentsList || studentsList.length === 0) {
    console.log('📊 No data available for weekly calculation');
    return [];
  }

  try {
    // Create array for last 7 days
    const last7Days = [];
    const today = new Date();
    
    // Get data for each of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0); // Start of day
      
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1); // Start of next day
      
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Filter logs for this specific date (whole day)
      const dayLogs = logData.filter(log => {
        if (!log.timestamp) return false;
        
        try {
          const logDate = new Date(log.timestamp);
          return logDate >= date && logDate < nextDay;
        } catch (e) {
          console.error('Error parsing log date:', log.timestamp, e);
          return false;
        }
      });

      // Count unique students who checked IN today
      const presentStudents = new Set();
      dayLogs.forEach(log => {
        if (log.status === 'IN' && log.studentId) {
          presentStudents.add(log.studentId);
        }
      });

      const presentCount = presentStudents.size;
      const totalStudents = studentsList.length;
      const absentCount = Math.max(0, totalStudents - presentCount);
      const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
      
      last7Days.push({
        name: dayName,
        present: presentCount,
        absent: absentCount,
        attendanceRate: attendanceRate,
        date: dateString,
        totalStudents: totalStudents
      });
    }
    
    console.log('📊 Calculated weekly data:', last7Days);
    return last7Days;
    
  } catch (error) {
    console.error('❌ Error calculating weekly data:', error);
    return [];
  }
};

const getStudentStatus = (studentId) => {
  const todayString = new Date().toISOString().split('T')[0];
  const studentLogs = logs.filter(log => {
    if (!log.timestamp || log.studentId !== studentId) return false;
    const logDate = parseLogTimestamp(log.timestamp);
    return logDate && logDate.toISOString().split('T')[0] === todayString;
  });

  if (studentLogs.length === 0) return 'no-logs';
  const lastLog = studentLogs[studentLogs.length - 1];
  return lastLog.status === 'IN' ? 'present' : 'absent';
};

  const exportToCSV = (logsToExport = logs) => {
    const headers = ['Timestamp', 'Student ID', 'Name', 'Class', 'Status'];
    const csvContent = [
      headers.join(','),
      ...logsToExport.map(log => 
        [log.timestamp, log.studentId, `"${log.name}"`, log.class, log.status].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [students, searchQuery]);

  useEffect(() => {
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
    if (authenticated) {
      fetchData();
    }
  }, [authenticated]);

  if (!mounted) return null;

  if (!authenticated) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex items-center justify-center p-4 transition-all duration-500 overflow-x-hidden`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-1/2 -left-1/2 w-full h-full rounded-full ${darkMode ? 'bg-blue-500/5' : 'bg-blue-400/20'} blur-3xl animate-pulse`}></div>
          <div className={`absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full ${darkMode ? 'bg-purple-500/5' : 'bg-purple-400/20'} blur-3xl animate-pulse`}></div>
        </div>

        <div className={`relative backdrop-blur-xl ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full border transform hover:scale-105 transition-all duration-300 mx-4`}>
          <button
            onClick={toggleTheme}
            className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white/50 text-gray-700'} hover:scale-110 transition-transform`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="flex justify-center mb-6">
            <div className={`${darkMode ? 'bg-blue-500/20' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} p-4 rounded-2xl animate-bounce`}>
              <Lock size={40} className={darkMode ? 'text-blue-400' : 'text-white'} />
            </div>
          </div>
          
          <h1 className={`text-3xl md:text-4xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Welcome Back
          </h1>
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 text-sm md:text-base`}>
            RFID Attendance Portal
          </p>

          <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm`}
                placeholder="Enter username"
                required
                disabled={loggingIn}
              />
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm pr-12`}
                  placeholder="Enter password"
                  required
                  disabled={loggingIn}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                  disabled={loggingIn}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border-2 border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm animate-shake">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} />
                  {loginError}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {loggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={20} className="animate-spin" />
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Shield size={20} />
                  Secure Sign In
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              🔒 Protected by session-based authentication
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50/90 to-purple-50/90'} transition-all duration-500 overflow-x-hidden`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-1/2 -left-1/2 w-full h-full rounded-full ${darkMode ? 'bg-blue-500/5' : 'bg-blue-400/20'} blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full ${darkMode ? 'bg-purple-500/5' : 'bg-purple-400/20'} blur-3xl animate-pulse`}></div>
      </div>

      {/* Header - Fixed and properly contained */}
      <div className={`relative backdrop-blur-xl ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/95 border-blue-100 shadow-lg'} border-b shadow-xl w-full overflow-hidden`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          {isMobile && (
            <div className="flex items-center justify-between py-4 w-full">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-100 text-blue-600'}`}
              >
                {mobileMenuOpen ? <XIcon size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-blue-100 text-blue-600'}`}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-xl"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Mobile menu */}
          {isMobile && mobileMenuOpen && (
            <div className={`py-4 border-t ${darkMode ? 'border-gray-700' : 'border-blue-100'} animate-slide-down w-full`}>
              <div className="space-y-3">
                {userType === 'teacher' && (
                  <div className="space-y-2">
                    {[
                      { name: 'Dashboard', icon: BarChart3 },
                      { name: 'Classroom', icon: Users },
                      { name: 'Logs', icon: Calendar }
                    ].map((tab, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveTab(idx);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                          activeTab === idx
                            ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'}`
                            : `${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-white/80 text-gray-700'}`
                        }`}
                      >
                        <tab.icon size={20} />
                        <span className="truncate">{tab.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="pt-3 border-t border-gray-700/50">
                  <div className="px-4 py-2">
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} truncate`}>
                      {getGreeting()}, <span className="font-semibold">{userInfo?.fullName?.split(' ')[0] || username}</span>
                    </p>
                    {userType === 'parent' && childInfo && (
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                        Child: {childInfo.name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-blue-50 hover:bg-blue-100'} transition-colors`}
                  >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    <span className="truncate">Refresh Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Desktop header - FIXED */}
          {!isMobile && (
            <div className="flex justify-between items-center py-6 w-full">
              {/* Left Side - Made more compact */}
              <div className="flex items-center gap-3 max-w-[50%]">
                <div className={`relative ${darkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-indigo-500'} p-2 rounded-xl shadow-lg flex-shrink-0`}>
                  {userType === 'teacher' ? 
                    <Users size={24} className="text-white" /> : 
                    <User size={24} className="text-white" />
                  }
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
                      {userType === 'teacher' ? 'Teacher Portal' : 'Parent Portal'}
                    </h1>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`p-1 rounded ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50/70'}`}>
                      <Clock size={12} className={darkMode ? 'text-gray-400' : 'text-blue-500'} />
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} truncate`}>
                      {getGreeting()}, <span className="font-semibold text-blue-500 truncate">{userInfo?.fullName?.split(' ')[0] || username}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right Side Controls - More compact */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'} transition-all transform hover:scale-110 shadow-md`}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50/80 hover:bg-blue-100 border border-blue-200'} transition-all transform hover:scale-110 shadow-md ${loading ? 'opacity-70' : ''}`}
                >
                  <RefreshCw size={18} className={`${darkMode ? 'text-gray-300' : 'text-blue-600'} ${loading ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-xl transition-all transform hover:scale-105 shadow-md text-sm"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Tabs for Teachers - Desktop - FIXED */}
          {!isMobile && userType === 'teacher' && (
            <div className="hidden md:flex gap-2 pb-4 w-full overflow-x-auto scrollbar-hide">
              {[
                { name: 'Dashboard', icon: BarChart3 },
                { name: 'Classroom', icon: Users },
                { name: 'Logs', icon: Calendar }
              ].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 whitespace-nowrap flex-shrink-0 ${
                    activeTab === idx
                      ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'}`
                      : `${darkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' : 'bg-white/80 text-gray-700 hover:bg-white border border-blue-100'}`
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`
        relative max-w-full mx-auto 
        px-4 sm:px-6 lg:px-8 
        pb-24 md:pb-8    // ← increased bottom padding on mobile
        pt-4 md:pt-8
        overflow-x-hidden
      `}>
        {userType === 'teacher' ? (
          <>
            {activeTab === 0 && (
              <DashboardTab 
                darkMode={darkMode}
                stats={stats}
                weeklyData={weeklyData}
                students={students}
                logs={logs}
                classes={classes}
              />
            )}
            {activeTab === 1 && (
              <ClassroomMonitorTab 
                darkMode={darkMode}
                students={students}
                classes={classes}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                getStudentStatus={getStudentStatus}
              />
            )}
            {activeTab === 2 && (
              <LogsTab 
                darkMode={darkMode}
                loading={loading}
                logs={logs}
                exportToCSV={exportToCSV}
                students={students}
                classes={classes}
              />
            )}
          </>
        ) : (
          <div className="overflow-x-hidden">
            <ParentLogsTab 
              darkMode={darkMode}
              loading={loading}
              logs={logs}
              userInfo={userInfo}
              students={students}
              exportToCSV={exportToCSV}
              childInfo={childInfo}
              childStats={childStats}
              parentChildId={parentChildId}
            />
          </div>
        )}
      </div>

      {/* Mobile bottom navigation for teachers */}
      {isMobile && userType === 'teacher' && !mobileMenuOpen && (
        <div className="content-with-bottom-nav">
          <div className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-blue-100'} 
            border-t backdrop-blur-xl z-50`}>
            <div className="flex justify-around items-center h-16 w-full px-2">
              {[
                { name: 'Dashboard', icon: BarChart3 },
                { name: 'Classroom', icon: Users },
                { name: 'Logs', icon: Calendar }
              ].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 ${activeTab === idx ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  <tab.icon size={22} />
                  <span className="text-xs mt-1 truncate w-full text-center">{tab.name}</span>
                  {activeTab === idx && (
                    <div className="w-6 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-1"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slide-down {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
            max-height: 0;
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
            max-height: 500px;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-fade-in { 
          animation: fade-in 0.5s ease-out; 
        }
        
        .animate-fade-in-up { 
          animation: fade-in-up 0.4s ease-out forwards; 
          opacity: 0;
        }
        
        .animate-slide-down { 
          animation: slide-down 0.3s ease-out forwards; 
        }
        
        .animate-shake { 
          animation: shake 0.5s ease-in-out; 
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        html.dark { 
          color-scheme: dark; 
        }
        
        /* Prevent horizontal scrolling */
        body, html {
          overflow-x: hidden;
          max-width: 100vw;
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .text-balance {
            text-wrap: balance;
          }
          
          input, select, button {
            font-size: 16px !important;
          }
          
          /* Force full width on mobile */
          .max-w-full {
            max-width: 100% !important;
          }
          
          /* Prevent any element from overflowing */
          * {
            max-width: 100%;
            box-sizing: border-box;
          }
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Better touch targets on mobile */
        @media (max-width: 768px) {
          button, 
          [role="button"],
          input[type="submit"],
          input[type="button"] {
            min-height: 44px;
            min-width: 44px;
          }
          
          input, select, textarea {
            font-size: 16px;
          }
        }

        @media (max-width: 767px) {
        .content-with-bottom-nav {
          padding-bottom: 80px !important;   /* ≈ nav height + safe zone */
        }

        /* inside <style jsx global> */

        @media (max-width: 767px) {
          /* Better touch targets */
          button, a[role="button"], [tabindex="0"] {
            min-height: 44px;
            min-width: 44px;
          }
        
          /* Prevent text shrinking too much */
          .grid-cols-2 > * {
            min-width: 0;
          }
        
          /* Fix chart label overflow */
          .recharts-cartesian-axis-tick text {
            font-size: 10px !important;
          }

          .recharts-wrapper {
            min-height: 220px !important;
          }
        
          /* Make sure nothing causes horizontal scroll */
          * {
            max-width: 100vw;
            box-sizing: border-box;
          }
        
          /* More breathing room */
          .space-y-4 > * + * {
            margin-top: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
                    }
