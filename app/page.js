'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Clock, TrendingUp, Download, Lock, Eye, EyeOff, LogOut,
  BarChart3, Activity, UserCheck, UserX, AlertCircle, Sun, Moon,
  ChevronRight, Search, RefreshCw, Award, Target, Shield, Bell,
  Filter, ArrowUpDown, X, User, Info
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_ENDPOINT = '/api/proxy';
const AUTH_ENDPOINT = '/api/auth';
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Dashboard Tab Component
const DashboardTab = ({ darkMode, stats, weeklyData, students, logs, classes }) => {
  // Calculate daily data for the last 7 days
  const dailyData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Get logs for this day
      const dayLogs = logs.filter(log => log.timestamp?.startsWith(dateString));
      
      // Count unique students who checked IN
      const presentStudents = new Set();
      dayLogs.forEach(log => {
        if (log.status === 'IN') {
          presentStudents.add(log.studentId);
        }
      });
      
      const present = presentStudents.size;
      const absent = students.length - present;
      
      days.push({
        name: dayName,
        fullDate: dateString,
        present,
        absent,
        attendanceRate: students.length > 0 ? Math.round((present / students.length) * 100) : 0
      });
    }
    
    return days;
  }, [logs, students]);

  // Calculate attendance by time of day
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 7; // 7 AM to 6 PM
      return {
        name: `${hour}:00`,
        count: 0
      };
    });
    
    logs.forEach(log => {
      if (log.status === 'IN' && log.timestamp) {
        const hour = new Date(log.timestamp).getHours();
        if (hour >= 7 && hour <= 18) {
          const index = hour - 7;
          if (hours[index]) {
            hours[index].count++;
          }
        }
      }
    });
    
    return hours;
  }, [logs]);

  // Calculate monthly attendance trend
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      // Get logs for this month
      const monthLogs = logs.filter(log => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp);
        return logDate.getMonth() === date.getMonth() && 
               logDate.getFullYear() === date.getFullYear();
      });
      
      // Count unique days with attendance
      const attendanceDays = new Set();
      const presentStudents = new Set();
      
      monthLogs.forEach(log => {
        if (log.status === 'IN' && log.timestamp) {
          const logDate = new Date(log.timestamp).toISOString().split('T')[0];
          attendanceDays.add(logDate);
          presentStudents.add(log.studentId);
        }
      });
      
      const avgDailyAttendance = attendanceDays.size > 0 
        ? Math.round(presentStudents.size / attendanceDays.size) 
        : 0;
      
      months.push({
        name: `${monthName} '${year.toString().slice(-2)}`,
        attendance: avgDailyAttendance,
        days: attendanceDays.size
      });
    }
    
    return months;
  }, [logs]);

  // Calculate class comparison data
  const classComparisonData = useMemo(() => {
    if (!classes || classes.length === 0 || !students || students.length === 0) return [];
    
    return classes.map(cls => {
      const classStudents = students.filter(s => s.class === cls);
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(log => 
        log.class === cls && 
        log.timestamp?.startsWith(today) && 
        log.status === 'IN'
      );
      
      // Debug logging
      console.log(`Class ${cls}:`, {
        totalStudents: classStudents.length,
        todayLogsCount: todayLogs.length,
        todayLogs: todayLogs
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
        name: cls.length > 12 ? `${cls.substring(0, 10)}...` : cls, 
        attendanceRate: rate,
        attendance: rate, // Keep both for compatibility
        present: presentCount, 
        total: totalCount 
      };
    })
    .filter(cls => cls.total > 0)
    .sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [classes, students, logs]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards - Updated for 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-blue-600', bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50' },
          { title: 'Present Today', value: stats.presentToday, icon: UserCheck, color: 'from-green-500 to-green-600', bg: darkMode ? 'bg-green-500/10' : 'bg-green-50' },
          { title: 'Absent Today', value: stats.absentToday, icon: UserX, color: 'from-red-500 to-red-600', bg: darkMode ? 'bg-red-500/10' : 'bg-red-50' },
          { title: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: TrendingUp, color: 'from-purple-500 to-purple-600', bg: darkMode ? 'bg-purple-500/10' : 'bg-purple-50' },
          {
            title: 'This Week Avg',
            value: `${weeklyData.length > 0 ? Math.round(weeklyData.reduce((sum, week) => sum + week.attendanceRate, 0) / weeklyData.length) : 0}%`,
            icon: Calendar,
            color: 'from-indigo-500 to-indigo-600',
            bg: darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'
          },
        ].map((stat, idx) => (
          <div key={idx} className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl transform hover:scale-105 transition-all duration-300 ${stat.bg}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} className="text-white" />
              </div>
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{stat.title}</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid - Enhanced with more charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Trend */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Activity className="text-blue-500" size={20} />
            Weekly Attendance Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={weeklyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
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
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="present" 
                  name="Present" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="absent" 
                  name="Absent" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Daily Attendance (Last 7 Days) */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Calendar className="text-green-500" size={20} />
            Daily Attendance (Last 7 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dailyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
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
                  formatter={(value, name) => {
                    if (name === 'present') return [`${value} students`, 'Present'];
                    if (name === 'absent') return [`${value} students`, 'Absent'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="present" 
                  name="Present" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="absent" 
                  name="Absent" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Monthly Attendance Trend */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <TrendingUp className="text-purple-500" size={20} />
            Monthly Attendance Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={monthlyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
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
                  label={{ value: 'Avg Daily', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    color: darkMode ? '#ffffff' : '#000000'
                  }}
                  formatter={(value, name) => {
                    if (name === 'attendance') return [`${value} students`, 'Avg Daily Attendance'];
                    return [value, name];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="attendance" 
                  name="Avg Daily Attendance" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{ fill: '#8b5cf6', r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Attendance by Time of Day */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Clock className="text-orange-500" size={20} />
            Check-ins by Time of Day
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={hourlyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
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
                  formatter={(value) => [`${value} check-ins`, 'Count']}
                />
                <Bar 
                  dataKey="count" 
                  name="Check-ins" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Class Performance Comparison */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Target className="text-indigo-500" size={20} />
            Class Performance (Today)
          </h3>
          <div className="h-64">
            {classComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={classComparisonData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
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
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      color: darkMode ? '#ffffff' : '#000000'
                    }}
                    formatter={(value, name, props) => {
                      if (name === 'attendance') {
                        return [`${value}% (${props.payload.present}/${props.payload.total} students)`, 'Attendance'];
                      }
                      return [value, name];
                    }}
                  />
                  <Bar 
                    dataKey="attendance" 
                    name="Attendance %" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <Target size={48} className={`mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No class data available
                </p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Classes will appear here once assigned
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Attendance Rate */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <BarChart3 className="text-red-500" size={20} />
            Weekly Attendance Rate
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={weeklyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
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
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    color: darkMode ? '#ffffff' : '#000000'
                  }}
                  formatter={(value) => [`${value}%`, 'Attendance Rate']}
                />
                <Bar 
                  dataKey="attendanceRate" 
                  name="Attendance Rate" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Summary */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Calendar className="text-blue-500" size={20} />
            Today's Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Check-ins:</span>
              <span className="font-bold">{dailyData.length > 0 ? dailyData[dailyData.length - 1].present : 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Attendance Rate:</span>
              <span className="font-bold text-green-500">{dailyData.length > 0 ? `${dailyData[dailyData.length - 1].attendanceRate}%` : '0%'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Absent:</span>
              <span className="font-bold text-red-500">{dailyData.length > 0 ? dailyData[dailyData.length - 1].absent : 0}</span>
            </div>
          </div>
        </div>

        {/* Week Summary */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <TrendingUp className="text-green-500" size={20} />
            This Week Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Avg Daily Attendance:</span>
              <span className="font-bold">
                {dailyData.length > 0 
                  ? Math.round(dailyData.reduce((sum, day) => sum + day.present, 0) / dailyData.length)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Best Day:</span>
              <span className="font-bold text-green-500">
                {dailyData.length > 0 
                  ? dailyData.reduce((max, day) => day.present > max.present ? day : max, dailyData[0]).name
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Weekly Trend:</span>
              <span className={`font-bold ${
                weeklyData.length > 1 && weeklyData[weeklyData.length - 1].attendanceRate > weeklyData[0].attendanceRate 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {weeklyData.length > 1 
                  ? weeklyData[weeklyData.length - 1].attendanceRate > weeklyData[0].attendanceRate 
                    ? '↗ Improving' 
                    : '↘ Declining'
                  : 'Stable'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Performing Class */}
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Award className="text-yellow-500" size={20} />
            Top Performing Class
          </h3>
          {classComparisonData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{classComparisonData[0].name}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {classComparisonData[0].present}/{classComparisonData[0].total} students present
                  </p>
                </div>
                <div className={`text-3xl font-bold ${
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
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Rank: 1/{classComparisonData.length}
                </span>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {classComparisonData.length > 1 
                    ? `Next: ${classComparisonData[1].name} (${classComparisonData[1].attendanceRate}%)`
                    : 'Only class'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No class data available</p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Check if classes and students are properly assigned
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Classroom Monitor Tab Component
const ClassroomMonitorTab = ({ 
  darkMode, 
  students, 
  classes, 
  searchQuery, 
  setSearchQuery, 
  selectedClass, 
  setSelectedClass,
  getStudentStatus 
}) => (
  <div className="space-y-6 animate-fade-in">
    {/* Search Bar */}
    <div className="flex gap-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
        <input
          type="text"
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800/40 border-gray-700 text-white' : 'bg-white/40 border-gray-200 text-gray-900'} border-2 backdrop-blur-xl focus:ring-2 focus:ring-blue-500`}
        />
      </div>
    </div>

    {/* Class Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((className, idx) => {
        const classStudents = students.filter(s => s.class === className);
        const presentCount = classStudents.filter(s => getStudentStatus(s.studentId) === 'present').length;
        const absentCount = classStudents.filter(s => getStudentStatus(s.studentId) === 'absent').length;
        const noLogsCount = classStudents.filter(s => getStudentStatus(s.studentId) === 'no-logs').length;
        const isExpanded = selectedClass === className;
        
        return (
          <div
            key={idx}
            className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl rounded-2xl border shadow-xl transition-all duration-300`}
          >
            {/* Class Header */}
            <div
              onClick={() => setSelectedClass(isExpanded ? null : className)}
              className="p-6 cursor-pointer hover:bg-white/5 transition-colors rounded-t-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{className}</h3>
                <ChevronRight 
                  size={24} 
                  className={`${isExpanded ? 'rotate-90' : ''} transition-transform ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} 
                />
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-500/10 rounded-lg p-3">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">Present</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{presentCount}</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3">
                  <p className="text-xs text-red-600 dark:text-red-400 mb-1">Absent</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{absentCount}</p>
                </div>
                <div className="bg-gray-500/10 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">No Logs</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{noLogsCount}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Total: {classStudents.length} students
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {classStudents.length > 0 ? Math.round((presentCount / classStudents.length) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                    style={{ width: `${classStudents.length > 0 ? (presentCount / classStudents.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Expanded Student List */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2 max-h-96 overflow-y-auto">
                {classStudents
                  .filter(s => 
                    searchQuery === '' || 
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((student, sIdx) => {
                    const status = getStudentStatus(student.studentId);
                    return (
                      <div 
                        key={sIdx} 
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          status === 'present' ? 'bg-green-500/10 hover:bg-green-500/20' :
                          status === 'absent' ? 'bg-red-500/10 hover:bg-red-500/20' :
                          'bg-gray-500/10 hover:bg-gray-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'present' ? 'bg-green-500 shadow-lg shadow-green-500/50' :
                            status === 'absent' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                            'bg-gray-400 shadow-lg shadow-gray-400/50'
                          }`}></div>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {student.name}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {student.studentId}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          status === 'present' ? 'bg-green-500 text-white' :
                          status === 'absent' ? 'bg-red-500 text-white' :
                          'bg-gray-400 text-white'
                        }`}>
                          {status === 'present' ? 'IN' : status === 'absent' ? 'OUT' : 'NO LOGS'}
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

// Enhanced Logs Tab Component with filters
const LogsTab = ({ darkMode, loading, logs: allLogs, exportToCSV, students, classes }) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'IN', 'OUT'
  const [classFilter, setClassFilter] = useState('all'); // 'all' or specific class

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Attendance Logs
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
          >
            <X size={18} />
            Reset Filters
          </button>
          <button
            onClick={() => exportToCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Enhanced Filter Controls */}
      <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Filter Logs
          </h3>
          <span className={`text-sm px-2 py-1 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
            {filteredLogs.length} of {allLogs.length} logs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                placeholder="Student ID, Name, Class..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Sort Order
            </label>
            <div className="relative">
              <ArrowUpDown className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm appearance-none focus:ring-2 focus:ring-blue-500`}
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
              className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
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
              className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map((cls, idx) => (
                <option key={idx} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Quick Date Presets */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Quick Date Range
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
                } else if (value === 'custom') {
                  // Keep current custom dates
                }
              }}
              className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Custom Range</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Date Range Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Start Date
            </label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              max={today}
              className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
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
              className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || dateFilter.startDate || dateFilter.endDate || statusFilter !== 'all' || classFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                  Search: "{searchTerm}"
                </span>
              )}
              {dateFilter.startDate && (
                <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'}`}>
                  From: {dateFilter.startDate}
                </span>
              )}
              {dateFilter.endDate && (
                <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'}`}>
                  To: {dateFilter.endDate}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                  Status: {statusFilter}
                </span>
              )}
              {classFilter !== 'all' && (
                <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-600'}`}>
                  Class: {classFilter}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw size={48} className={`mx-auto mb-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No attendance records match your filters</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Try changing your filter criteria or reset filters
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-700/50">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing {filteredLogs.length} of {allLogs.length} logs • Sorted by {sortOrder === 'newest' ? 'newest to oldest' : 'oldest to newest'}
                </p>
              </div>
              <table className="w-full">
                <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Timestamp</th>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Student ID</th>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Name</th>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Class</th>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} className={`${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{log.studentId}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.name}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{log.class}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Parent Logs Tab Component - Fixed version
const ParentLogsTab = ({ darkMode, loading, logs: allLogs, userInfo, students, exportToCSV }) => {
  // Filter states for parent view
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeChild, setActiveChild] = useState('all'); // For multiple children

  // Get parent's children from session storage
  const parentChildren = useMemo(() => {
    try {
      console.log('User Info for parent:', userInfo);
      
      // First try to get from userInfo directly
      let children = [];
      
      // Check if we have studentId in userInfo (single child)
      if (userInfo?.studentId) {
        children = [{
          studentId: userInfo.studentId,
          name: userInfo.fullName || 'My Child',
          class: userInfo.class || 'Unknown'
        }];
      }
      // Check if we have children array
      else if (userInfo?.children && Array.isArray(userInfo.children)) {
        children = userInfo.children;
      }
      // Check if we have child object
      else if (userInfo?.child) {
        children = [userInfo.child];
      }
      // If no children found in userInfo, check session storage
      else {
        const storedUserInfo = sessionStorage.getItem('userInfo');
        if (storedUserInfo) {
          const parsedInfo = JSON.parse(storedUserInfo);
          if (parsedInfo?.studentId) {
            children = [{
              studentId: parsedInfo.studentId,
              name: parsedInfo.fullName || 'My Child',
              class: parsedInfo.class || 'Unknown'
            }];
          }
        }
      }
      
      console.log('Parent children extracted:', children);
      return children;
    } catch (error) {
      console.error('Error extracting parent children:', error);
      return [];
    }
  }, [userInfo]);

  // Filter logs to show only parent's children
  const childLogs = useMemo(() => {
    if (!parentChildren || parentChildren.length === 0) {
      console.log('No children found for parent');
      return [];
    }
    
    const childIds = parentChildren.map(child => child.studentId);
    console.log('Looking for logs with child IDs:', childIds);
    
    const filteredLogs = allLogs.filter(log => {
      const matches = childIds.includes(log.studentId);
      return matches;
    });
    
    console.log('Child logs found:', filteredLogs.length, 'out of', allLogs.length);
    
    return filteredLogs;
  }, [allLogs, parentChildren]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortOrder('newest');
    setDateFilter({ startDate: '', endDate: '' });
    setStatusFilter('all');
    setActiveChild('all');
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

    // Apply child filter
    if (activeChild !== 'all') {
      filtered = filtered.filter(log => log.studentId === activeChild);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [childLogs, searchTerm, sortOrder, dateFilter, statusFilter, activeChild]);

  // Get date range for default values
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Calculate child stats
  const childStats = useMemo(() => {
    const stats = {};
    
    if (parentChildren && parentChildren.length > 0) {
      parentChildren.forEach(child => {
        const childLogs = allLogs.filter(log => log.studentId === child.studentId);
        const todayLogs = childLogs.filter(log => log.timestamp?.startsWith(today));
        const lastEntry = childLogs[0]; // Most recent log
        
        stats[child.studentId] = {
          name: child.name || 'Unknown',
          class: child.class || 'Unknown',
          totalLogs: childLogs.length,
          todayLogs: todayLogs.length,
          lastStatus: lastEntry?.status || 'NO LOGS',
          lastTime: lastEntry ? new Date(lastEntry.timestamp).toLocaleTimeString() : 'N/A',
          lastDate: lastEntry ? new Date(lastEntry.timestamp).toLocaleDateString() : 'N/A'
        };
      });
    }
    
    return stats;
  }, [allLogs, parentChildren, today]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Welcome, {userInfo?.fullName || userInfo?.username || 'Parent'}!
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
              {parentChildren && parentChildren.length > 0 
                ? `Monitor your ${parentChildren.length > 1 ? 'children' : 'child'}'s attendance records`
                : 'View attendance records'}
            </p>
          </div>
          <button
            onClick={() => exportToCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Children Summary Cards */}
      {parentChildren && parentChildren.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parentChildren.map((child, idx) => {
            const stats = childStats[child.studentId] || {};
            return (
              <div 
                key={idx} 
                className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl transform hover:scale-105 transition-all duration-300 ${
                  activeChild === child.studentId ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setActiveChild(activeChild === child.studentId ? 'all' : child.studentId)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      stats.lastStatus === 'IN' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      stats.lastStatus === 'OUT' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                      'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {child.name || child.studentId || 'My Child'}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {child.class || 'Unknown'} • {child.studentId || 'No ID'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    stats.lastStatus === 'IN' ? 'bg-green-500 text-white' :
                    stats.lastStatus === 'OUT' ? 'bg-red-500 text-white' :
                    'bg-gray-400 text-white'
                  }`}>
                    {stats.lastStatus || 'NO DATA'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Today's Logs</span>
                    <span className="font-semibold">{stats.todayLogs || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Records</span>
                    <span className="font-semibold">{stats.totalLogs || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Last Check</span>
                    <span className="font-semibold">{stats.lastTime || 'N/A'}</span>
                  </div>
                  {stats.lastDate && stats.lastDate !== 'N/A' && (
                    <div className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Date</span>
                      <span className="font-semibold">{stats.lastDate}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <div className="text-center">
            <User size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Welcome to Parent Portal
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Your attendance records are loading...
            </p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              You can view your child's attendance history here.
            </p>
          </div>
        </div>
      )}

      {/* Filter Controls for Parents */}
      {parentChildren && parentChildren.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Filter Attendance Records
            </h3>
            <span className={`text-sm px-2 py-1 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
              {filteredLogs.length} of {childLogs.length} records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Child Filter - Only show if multiple children */}
            {parentChildren.length > 1 && (
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Child
                </label>
                <select
                  value={activeChild}
                  onChange={(e) => setActiveChild(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="all">All Children</option>
                  {parentChildren.map((child, idx) => (
                    <option key={idx} value={child.studentId}>
                      {child.name || child.studentId} ({child.class || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                  placeholder="Search records..."
                  className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sort Order
              </label>
              <div className="relative">
                <ArrowUpDown className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm appearance-none focus:ring-2 focus:ring-blue-500`}
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
                className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">All Status</option>
                <option value="IN">IN Only</option>
                <option value="OUT">OUT Only</option>
              </select>
            </div>
          </div>

          {/* Date Range Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Start Date
              </label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                max={today}
                className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
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
                className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
              />
            </div>
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
                  }
                }}
                className={`w-full px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/50 border-gray-200 text-gray-900'} border-2 backdrop-blur-sm focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select Range</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
            <div>
              {(searchTerm || dateFilter.startDate || dateFilter.endDate || statusFilter !== 'all' || activeChild !== 'all') && (
                <div>
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                        Search: "{searchTerm}"
                      </span>
                    )}
                    {dateFilter.startDate && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'}`}>
                        From: {dateFilter.startDate}
                      </span>
                    )}
                    {dateFilter.endDate && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'}`}>
                        To: {dateFilter.endDate}
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                        Status: {statusFilter}
                      </span>
                    )}
                    {activeChild !== 'all' && parentChildren.find(c => c.studentId === activeChild) && (
                      <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-600'}`}>
                        Child: {parentChildren.find(c => c.studentId === activeChild)?.name || 'Unknown'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
            >
              <X size={18} />
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw size={48} className={`mx-auto mb-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading records...</p>
            </div>
          ) : parentChildren && parentChildren.length === 0 ? (
            <div className="p-12 text-center">
              <User size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No children assigned to your account</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Please contact school administration to link your children
              </p>
            </div>
          ) : childLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No attendance records found for your children</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                This could mean:
              </p>
              <ul className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'} text-left max-w-md mx-auto`}>
                <li>• Your children haven't logged any attendance yet</li>
                <li>• The student IDs in your account don't match the logs</li>
                <li>• There might be a data synchronization delay</li>
              </ul>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No records match your filters</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Try changing your filter criteria or reset filters
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-700/50">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing {filteredLogs.length} of {childLogs.length} records • 
                  {activeChild === 'all' ? ' All children' : ` ${parentChildren.find(c => c.studentId === activeChild)?.name || 'Unknown'}`}
                </p>
              </div>
              <table className="w-full">
                <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Timestamp</th>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Child Name</th>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Class</th>
                    <th className={`px-6 py-4 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} className={`${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {log.name || 'Unknown'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {log.class || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          log.status === 'IN' 
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                            : log.status === 'OUT'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                        }`}>
                          {log.status || 'UNKNOWN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component
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
      sessionToken, // Add sessionToken to query params
      ...params 
    }).toString();
    
    const response = await fetch(`${API_ENDPOINT}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Keep header too for compatibility
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
        // Store session data
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
  };

  const fetchData = async () => {
  setLoading(true);
  try {
    // Get data for the last 60 days to calculate 8 weeks of data
    const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    console.log('Fetching dashboard data...', { startDate, endDate });

    const dashboardData = await secureApiCall('getDashboardStats', {
      startDate,
      endDate
    });

    console.log('Dashboard response:', dashboardData);

    if (dashboardData.success) {
      const fetchedStudents = dashboardData.students || [];
      const fetchedLogs = dashboardData.logs || [];
      const fetchedStats = dashboardData.stats || {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0
      };

      console.log('Data received:', {
        students: fetchedStudents.length,
        logs: fetchedLogs.length,
        stats: fetchedStats
      });

      // Sort logs by newest first initially
      const sortedLogs = fetchedLogs.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      setStudents(fetchedStudents);
      setLogs(sortedLogs);
      setStats(fetchedStats);
      
      // Calculate weekly data and set it
      const calculatedWeeklyData = calculateWeeklyData(fetchedLogs, fetchedStudents);
      console.log('Setting weekly data:', calculatedWeeklyData);
      setWeeklyData(calculatedWeeklyData);
      
      // Get classes for teachers only
      if (userType === 'teacher') {
        try {
          const classesData = await secureApiCall('getClasses');
          if (classesData.success) {
            setClasses(classesData.classes || []);
          }
        } catch (classError) {
          console.error('Error fetching classes:', classError);
          setClasses([]);
        }
      }
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    // Set default empty state
    setStudents([]);
    setLogs([]);
    setClasses([]);
    setStats({
      totalStudents: 0,
      presentToday: 0,
      absentToday: 0,
      attendanceRate: 0
    });
    setWeeklyData([]); // Also reset weeklyData on error
  } finally {
    setLoading(false);
  }
};

  // Helper function to fetch dashboard data
  const fetchDashboardData = async (startDate, endDate) => {
    const dashboardData = await secureApiCall('getDashboardStats', {
      startDate,
      endDate
    });

    console.log('Dashboard response:', dashboardData);

    if (dashboardData.success) {
      const fetchedStudents = dashboardData.students || [];
      const fetchedLogs = dashboardData.logs || [];
      const fetchedStats = dashboardData.stats || {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0
      };

      console.log('Data received:', {
        students: fetchedStudents.length,
        logs: fetchedLogs.length,
        stats: fetchedStats
      });

      // Sort logs by newest first initially
      const sortedLogs = fetchedLogs.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      setStudents(fetchedStudents);
      setLogs(sortedLogs);
      setStats(fetchedStats);
      calculateWeeklyData(fetchedLogs);
    }

    // Get classes separately
    try {
      const classesData = await secureApiCall('getClasses');
      console.log('Classes response:', classesData);
      if (classesData.success) {
        setClasses(classesData.classes || []);
      }
    } catch (classError) {
      console.error('Error fetching classes:', classError);
      setClasses([]);
    }
  };

  const calculateWeeklyData = (logData, studentsList) => {
    console.log('Calculating weekly data with:', {
      totalLogs: logData.length,
      totalStudents: studentsList.length
    });
    
    // If no logs or students, return empty data
    if (!logData || logData.length === 0 || !studentsList || studentsList.length === 0) {
      console.log('No data available for weekly calculation');
      // Create placeholder for last 8 weeks
      const weeks = [];
      const today = new Date();
      for (let i = 7; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - (i * 7));
        
        weeks.push({
          name: `Week ${7-i+1}`,
          present: 0,
          absent: 0,
          attendanceRate: 0
        });
      }
      return weeks;
    }
    
    // Group logs by week
    const weeklyMap = {};
    
    // First, get unique student IDs from logs for this period
    const studentIdsInLogs = [...new Set(logData.map(log => log.studentId))];
    console.log('Unique student IDs in logs:', studentIdsInLogs.length);
    
    // For each log, determine if it represents attendance for that day
    logData.forEach(log => {
      if (!log.timestamp || !log.studentId) return;
      
      try {
        const date = new Date(log.timestamp);
        // Get the start of the week (Monday)
        const weekStart = new Date(date);
        const dayOfWeek = date.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStart.setDate(date.getDate() + diffToMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        // Format as YYYY-MM-DD for the week start
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyMap[weekKey]) {
          const weekLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          weeklyMap[weekKey] = {
            name: weekLabel,
            date: new Date(weekStart),
            dailyAttendance: {} // Track attendance by date for this week
          };
        }
        
        // Get just the date part (YYYY-MM-DD)
        const logDate = date.toISOString().split('T')[0];
        
        // Initialize daily attendance tracking if not exists
        if (!weeklyMap[weekKey].dailyAttendance[logDate]) {
          weeklyMap[weekKey].dailyAttendance[logDate] = {
            students: new Set(),
            present: new Set()
          };
        }
        
        // Add student to this date's tracking
        weeklyMap[weekKey].dailyAttendance[logDate].students.add(log.studentId);
        
        // If student checked IN on this date, mark as present
        if (log.status === 'IN') {
          weeklyMap[weekKey].dailyAttendance[logDate].present.add(log.studentId);
        }
        
      } catch (error) {
        console.error('Error processing log:', error, log);
      }
    });
    
    // Calculate weekly statistics
    const weeklyArray = Object.keys(weeklyMap).map(weekKey => {
      const week = weeklyMap[weekKey];
      const dailyAttendance = week.dailyAttendance;
      
      let totalStudentDays = 0;
      let presentStudentDays = 0;
      
      // For each day in the week, calculate attendance
      Object.values(dailyAttendance).forEach(day => {
        totalStudentDays += day.students.size;
        presentStudentDays += day.present.size;
      });
      
      // Calculate weekly attendance rate
      const attendanceRate = totalStudentDays > 0 
        ? Math.round((presentStudentDays / totalStudentDays) * 100) 
        : 0;
      
      // Estimate present/absent counts (this is approximate for charts)
      const estimatedPresent = Math.round(presentStudentDays / 5); // Approximate per week
      const estimatedAbsent = Math.round((totalStudentDays - presentStudentDays) / 5);
      
      return {
        name: week.name,
        present: estimatedPresent,
        absent: estimatedAbsent,
        attendanceRate: attendanceRate,
        date: week.date
      };
    });
    
    // Sort by date and get last 8 weeks
    const sortedWeeks = weeklyArray
      .sort((a, b) => b.date - a.date) // Most recent first
      .slice(0, 8) // Show last 8 weeks
      .reverse(); // Show oldest to newest for chart
    
    console.log('Weekly data calculated:', sortedWeeks);
    
    // If no weekly data, create placeholder
    if (sortedWeeks.length === 0) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + diffToMonday);
      weekStart.setHours(0, 0, 0, 0);
      
      sortedWeeks.push({
        name: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        present: 0,
        absent: 0,
        attendanceRate: 0,
        date: weekStart
      });
    }
    
    return sortedWeeks;
  };

  const getStudentStatus = (studentId) => {
    const today = new Date().toISOString().split('T')[0];
    const studentLogs = logs.filter(log => 
      log.studentId === studentId && log.timestamp.startsWith(today)
    );
    
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
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex items-center justify-center p-4 transition-all duration-500`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-1/2 -left-1/2 w-full h-full rounded-full ${darkMode ? 'bg-blue-500/5' : 'bg-blue-400/20'} blur-3xl animate-pulse`}></div>
          <div className={`absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full ${darkMode ? 'bg-purple-500/5' : 'bg-purple-400/20'} blur-3xl animate-pulse`}></div>
        </div>

        <div className={`relative backdrop-blur-xl ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} rounded-3xl shadow-2xl p-8 max-w-md w-full border transform hover:scale-105 transition-all duration-300`}>
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
          
          <h1 className={`text-4xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Welcome Back
          </h1>
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
            RFID Attendance Portal
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
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
              <div className="bg-red-500/10 border-2 border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} transition-all duration-500`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-1/2 -left-1/2 w-full h-full rounded-full ${darkMode ? 'bg-blue-500/5' : 'bg-blue-400/20'} blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full ${darkMode ? 'bg-purple-500/5' : 'bg-purple-400/20'} blur-3xl animate-pulse`}></div>
      </div>

      {/* Header */}
      <div className={`relative backdrop-blur-xl ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} border-b shadow-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                {userType === 'teacher' ? <Users size={32} className="text-blue-500" /> : <User size={32} className="text-indigo-500" />}
                {userType === 'teacher' ? 'Teacher Portal' : 'Parent Portal'}
              </h1>
              <p className={`mt-1 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {getGreeting()}, {userInfo?.fullName || username}! 👋
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-white/50 text-gray-700 hover:bg-white/80'} transition-all transform hover:scale-110 shadow-lg`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button
                onClick={fetchData}
                disabled={loading}
                className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white/50 hover:bg-white/80'} transition-all transform hover:scale-110 shadow-lg ${loading ? 'opacity-70' : ''}`}
              >
                <RefreshCw size={20} className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Tabs for Teachers */}
          {userType === 'teacher' && (
            <div className="flex gap-2 pb-4">
              {['Dashboard', 'Classroom', 'Logs'].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                    activeTab === idx
                      ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'} shadow-lg`
                      : `${darkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' : 'bg-white/50 text-gray-700 hover:bg-white/80'}`
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <ParentLogsTab 
            darkMode={darkMode}
            loading={loading}
            logs={logs}
            userInfo={userInfo}
            students={students}
            exportToCSV={exportToCSV}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        html.dark { color-scheme: dark; }
      `}</style>
    </div>
  );
      }
