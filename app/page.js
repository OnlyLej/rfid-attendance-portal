'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Clock, TrendingUp, Download, Lock, Eye, EyeOff, LogOut,
  BarChart3, Activity, UserCheck, UserX, AlertCircle, Sun, Moon,
  ChevronRight, Search, RefreshCw, Award, Target, Shield, Bell
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_ENDPOINT = '/api/proxy';
const AUTH_ENDPOINT = '/api/auth';
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Dashboard Tab Component
const DashboardTab = ({ darkMode, stats, weeklyData, students, logs, classes }) => (
  <div className="space-y-6 animate-fade-in">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-blue-600', bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50' },
        { title: 'Present Today', value: stats.presentToday, icon: UserCheck, color: 'from-green-500 to-green-600', bg: darkMode ? 'bg-green-500/10' : 'bg-green-50' },
        { title: 'Absent Today', value: stats.absentToday, icon: UserX, color: 'from-red-500 to-red-600', bg: darkMode ? 'bg-red-500/10' : 'bg-red-50' },
        { title: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: TrendingUp, color: 'from-purple-500 to-purple-600', bg: darkMode ? 'bg-purple-500/10' : 'bg-purple-50' },
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

    {/* Charts Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Attendance Trend */}
      <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
          <Activity className="text-blue-500" size={20} />
          Weekly Attendance Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip contentStyle={{ 
              backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
            }} />
            <Legend />
            <Area type="monotone" dataKey="present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" name="Present" />
            <Area type="monotone" dataKey="absent" stroke="#ef4444" fillOpacity={1} fill="url(#colorAbsent)" name="Absent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Rate Line */}
      <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
          <TrendingUp className="text-purple-500" size={20} />
          Attendance Rate Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip contentStyle={{ 
              backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
              border: 'none', 
              borderRadius: '12px' 
            }} />
            <Line type="monotone" dataKey="present" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }} name="Present Students" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Comparison Bar Chart */}
      <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
          <BarChart3 className="text-orange-500" size={20} />
          Daily Present vs Absent
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip contentStyle={{ 
              backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
              border: 'none', 
              borderRadius: '12px' 
            }} />
            <Legend />
            <Bar dataKey="present" fill="#10b981" radius={[8, 8, 0, 0]} name="Present" />
            <Bar dataKey="absent" fill="#ef4444" radius={[8, 8, 0, 0]} name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Class Performance */}
      <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
          <Target className="text-indigo-500" size={20} />
          Class-wise Attendance
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classes.map(cls => {
            const classStudents = students.filter(s => s.class === cls);
            const today = new Date().toISOString().split('T')[0];
            const todayLogs = logs.filter(log => log.class === cls && log.timestamp.startsWith(today) && log.status === 'IN');
            const present = new Set(todayLogs.map(log => log.studentId)).size;
            const rate = classStudents.length > 0 ? Math.round((present / classStudents.length) * 100) : 0;
            return { name: cls, rate, present, total: classStudents.length };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip contentStyle={{ 
              backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
              border: 'none', 
              borderRadius: '12px' 
            }} />
            <Bar dataKey="rate" fill="#6366f1" radius={[8, 8, 0, 0]} name="Attendance %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

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

// Logs Tab Component
const LogsTab = ({ darkMode, loading, logs, exportToCSV, students }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Attendance Logs
      </h2>
      <button
        onClick={exportToCSV}
        disabled={logs.length === 0}
        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={18} />
        Export CSV
      </button>
    </div>

    <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden`}>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw size={48} className={`mx-auto mb-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No attendance records found</p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {students.length === 0 ? 'No students in your assigned classes' : 'Students haven\'t checked in yet'}
            </p>
          </div>
        ) : (
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
              {logs.map((log, idx) => (
                <tr key={idx} className={`${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{log.timestamp}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{log.studentId}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.name}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{log.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      log.status === 'IN' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
);

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

    const queryParams = new URLSearchParams({ action, ...params }).toString();
    const response = await fetch(`${API_ENDPOINT}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken, // Session token, NOT API key
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
        // Store ONLY session token (NOT API key)
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
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      console.log('Fetching dashboard data...', { startDate, endDate });

      // Use getDashboardStats to get everything in one call
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

        setStudents(fetchedStudents);
        setLogs(fetchedLogs);
        setStats(fetchedStats);
        calculateWeeklyData(fetchedLogs);
      } else {
        console.error('Dashboard fetch failed:', dashboardData.message);
        // Set empty data instead of failing completely
        setStudents([]);
        setLogs([]);
        setStats({
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          attendanceRate: 0
        });
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
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyData = (logData) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekData = days.map(day => ({ name: day, present: 0, absent: 0 }));
    
    logData.forEach(log => {
      const date = new Date(log.timestamp);
      const dayIndex = (date.getDay() + 6) % 7;
      if (log.status === 'IN') weekData[dayIndex].present++;
    });

    setWeeklyData(weekData);
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

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Student ID', 'Name', 'Class', 'Status'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => 
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
                {userType === 'teacher' ? <Users size={32} className="text-blue-500" /> : <Calendar size={32} className="text-indigo-500" />}
                {userType === 'teacher' ? 'Teacher Portal' : 'Parent Portal'}
              </h1>
              {userType === 'teacher' && (
                <p className={`mt-1 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getGreeting()}, {userInfo?.fullName || username}! 👋
                </p>
              )}
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
                className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white/50 hover:bg-white/80'} transition-all transform hover:scale-110 shadow-lg ${loading ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={20} className={darkMode ? 'text-gray-300' : 'text-gray-700'} />
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
              />
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} backdrop-blur-xl p-6 rounded-2xl border shadow-xl`}>
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Parent Dashboard
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Welcome to the parent portal. Here you can view your child's attendance information.
              </p>
            </div>
          </div>
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
