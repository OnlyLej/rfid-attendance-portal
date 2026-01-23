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

    const sessionToken = sessionStorage.getItem('sessionToken');
    const loginTime = sessionStorage.getItem('loginTime');
    
    if (sessionToken && loginTime) {
      const timeSinceLogin = Date.now() - parseInt(loginTime);
      if (timeSinceLogin > SESSION_TIMEOUT) {
        sessionStorage.clear();
      } else {
        setAuthenticated(true);
        setUserType(sessionStorage.getItem('userType'));
        const info = sessionStorage.getItem('userInfo');
        setUserInfo(info ? JSON.parse(info) : null);
      }
    }
  }, []);

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

  useEffect(() => {
    if (!authenticated) return;
    const updateActivity = () => setLastActivity(Date.now());
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, updateActivity));
    return () => events.forEach(event => document.removeEventListener(event, updateActivity));
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
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      const dashboardData = await secureApiCall('getDashboardStats', { startDate, endDate });

      if (dashboardData.success) {
        setStudents(dashboardData.students || []);
        setLogs(dashboardData.logs || []);
        setStats(dashboardData.stats || { totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
        calculateWeeklyData(dashboardData.logs || []);
      }

      const classesData = await secureApiCall('getClasses');
      if (classesData.success) setClasses(classesData.classes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      else weekData[dayIndex].absent++;
    });
    setWeeklyData(weekData);
  };

  const getStudentStatus = (studentId) => {
    const today = new Date().toISOString().split('T')[0];
    const studentLogs = logs.filter(log => log.studentId === studentId && log.timestamp.startsWith(today));
    if (studentLogs.length === 0) return 'no-logs';
    const lastLog = studentLogs[studentLogs.length - 1];
    return lastLog.status === 'IN' ? 'present' : 'absent';
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Student ID', 'Name', 'Class', 'Status'];
    const csvContent = [headers.join(','), ...logs.map(log => [log.timestamp, log.studentId, `"${log.name}"`, log.class, log.status].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated]);

  if (!mounted) return null;

  if (!authenticated) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex items-center justify-center p-4 transition-all duration-500`}>
        <div className="relative backdrop-blur-xl ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'} rounded-3xl shadow-2xl p-8 max-w-md w-full border transform hover:scale-105 transition-all duration-300">
          <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-full">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500 p-4 rounded-2xl animate-bounce"><Lock size={40} className="text-white" /></div>
          </div>
          <h1 className="text-4xl font-bold text-center mb-2">Welcome Back</h1>
          <form onSubmit={handleLogin} className="space-y-5">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2" placeholder="Username" required />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2" placeholder="Password" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
            {loginError && <div className="text-red-500 text-sm">{loginError}</div>}
            <button type="submit" disabled={loggingIn} className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all">
              {loggingIn ? 'Signing In...' : 'Secure Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Sub-components for Tabs ---
  const DashboardTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-blue-600' },
          { title: 'Present Today', value: stats.presentToday, icon: UserCheck, color: 'from-green-500 to-green-600' },
          { title: 'Absent Today', value: stats.absentToday, icon: UserX, color: 'from-red-500 to-red-600' },
          { title: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
        ].map((stat, idx) => (
          <div key={idx} className={`${darkMode ? 'bg-gray-800/40 border-gray-700 text-white' : 'bg-white border-gray-200'} p-6 rounded-2xl border shadow-xl`}>
            <div className={`bg-gradient-to-br ${stat.color} w-12 h-12 flex items-center justify-center rounded-xl mb-4`}><stat.icon className="text-white" size={24}/></div>
            <p className="text-sm opacity-70">{stat.title}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800/40' : 'bg-white'} p-6 rounded-2xl border shadow-xl`}>
          <h3 className="font-bold mb-4">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="present" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={`${darkMode ? 'bg-gray-800/40' : 'bg-white'} p-6 rounded-2xl border shadow-xl`}>
            <h3 className="font-bold mb-4">Daily Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const ClassroomMonitorTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search students..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2" 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((className, idx) => {
          const classStudents = students.filter(s => s.class === className);
          const presentCount = classStudents.filter(s => getStudentStatus(s.studentId) === 'present').length;
          const isExpanded = selectedClass === className;
          return (
            <div key={idx} className={`${darkMode ? 'bg-gray-800/40' : 'bg-white'} rounded-2xl border shadow-xl overflow-hidden`}>
              <div className="p-6 cursor-pointer" onClick={() => setSelectedClass(isExpanded ? null : className)}>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{className}</h3>
                  <ChevronRight className={isExpanded ? 'rotate-90' : ''} />
                </div>
                <p className="mt-2 text-sm opacity-70">{presentCount} / {classStudents.length} Students Present</p>
              </div>
              {isExpanded && (
                <div className="p-4 border-t space-y-2">
                  {classStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((student, sIdx) => {
                    const status = getStudentStatus(student.studentId);
                    return (
                      <div key={sIdx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span>{student.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full text-white ${status === 'present' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {status.toUpperCase()}
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

  const LogsTab = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <button onClick={exportToCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl"><Download size={18}/> Export CSV</button>
        </div>
        <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-left">
                <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                    <tr>
                        <th className="p-4">Time</th>
                        <th className="p-4">Student</th>
                        <th className="p-4">Class</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log, i) => (
                        <tr key={i} className="border-t">
                            <td className="p-4">{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td className="p-4">{log.name}</td>
                            <td className="p-4">{log.class}</td>
                            <td className="p-4">
                                <span className={log.status === 'IN' ? 'text-green-500' : 'text-red-500'}>{log.status}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-all`}>
      <header className="p-6 border-b backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">RFID Attendance</h1>
          <p className="text-sm opacity-70">{getGreeting()}, {userInfo?.username}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg"><LogOut size={18}/> Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex gap-4 mb-8">
            {['Dashboard', 'Classroom', 'Logs'].map((tab, i) => (
                <button 
                    key={i} 
                    onClick={() => setActiveTab(i)} 
                    className={`px-6 py-2 rounded-full transition-all ${activeTab === i ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {activeTab === 0 && <DashboardTab />}
        {activeTab === 1 && <ClassroomMonitorTab />}
        {activeTab === 2 && <LogsTab />}
      </main>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}
