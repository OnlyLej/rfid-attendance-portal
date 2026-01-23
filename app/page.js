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
  // --- State Management ---
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

  // --- Initialization & Session Recovery ---
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
        const savedInfo = sessionStorage.getItem('userInfo');
        setUserInfo(savedInfo ? JSON.parse(savedInfo) : null);
      }
    }
  }, []);

  // --- Session Monitoring ---
  useEffect(() => {
    if (!authenticated) return;
    const checkSession = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
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

  // --- Auth Handlers ---
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
    setUserInfo(null);
  };

  // --- Data Fetching ---
  const secureApiCall = async (action, params = {}) => {
    const sessionToken = sessionStorage.getItem('sessionToken');
    const queryParams = new URLSearchParams({ action, ...params }).toString();
    const response = await fetch(`${API_ENDPOINT}?${queryParams}`, {
      headers: { 'X-Session-Token': sessionToken },
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const dashboardData = await secureApiCall('getDashboardStats');
      if (dashboardData.success) {
        setStudents(dashboardData.students || []);
        setLogs(dashboardData.logs || []);
        setStats(dashboardData.stats || stats);
        calculateWeeklyData(dashboardData.logs || []);
      }
      const classesData = await secureApiCall('getClasses');
      if (classesData.success) setClasses(classesData.classes || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyData = (logData) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekData = days.map(day => ({ name: day, present: 0, absent: 0 }));
    logData.forEach(log => {
      const dayIndex = (new Date(log.timestamp).getDay() + 6) % 7;
      if (log.status === 'IN') weekData[dayIndex].present++;
      else weekData[dayIndex].absent++;
    });
    setWeeklyData(weekData);
  };

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated]);

  // --- Utilities ---
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const getStudentStatus = (studentId) => {
    const today = new Date().toISOString().split('T')[0];
    const studentLogs = logs.filter(l => l.studentId === studentId && l.timestamp.startsWith(today));
    if (!studentLogs.length) return 'no-logs';
    return studentLogs[studentLogs.length - 1].status === 'IN' ? 'present' : 'absent';
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Student ID', 'Name', 'Class', 'Status'];
    const rows = logs.map(l => [l.timestamp, l.studentId, l.name, l.class, l.status].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!mounted) return null;

  // --- Auth View ---
  if (!authenticated) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-blue-50'} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-white'}`}>
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl text-white"><Lock size={40} /></div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-6">RFID Portal</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" placeholder="Username" required
              className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}
              value={username} onChange={e => setUsername(e.target.value)}
            />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} placeholder="Password" required
                className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <button type="button" className="absolute right-3 top-3" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
              {loggingIn ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Dashboard Views ---
  const DashboardTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', val: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
          { label: 'Present', val: stats.presentToday, icon: UserCheck, color: 'bg-green-500' },
          { label: 'Absent', val: stats.absentToday, icon: UserX, color: 'bg-red-500' },
          { label: 'Rate', val: `${stats.attendanceRate}%`, icon: TrendingUp, color: 'bg-purple-500' },
        ].map((s, i) => (
          <div key={i} className={`p-6 rounded-2xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <div className={`${s.color} w-10 h-10 rounded-lg flex items-center justify-center text-white mb-2`}>
              <s.icon size={20} />
            </div>
            <p className="text-sm opacity-60">{s.label}</p>
            <p className="text-2xl font-bold">{s.val}</p>
          </div>
        ))}
      </div>
      <div className={`p-6 rounded-2xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <h3 className="font-bold mb-4">Weekly Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="present" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const ClassroomMonitorTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text" placeholder="Search students..." 
          className={`w-full pl-10 p-3 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {classes.map((cls, i) => {
          const classStudents = students.filter(s => s.class === cls);
          const present = classStudents.filter(s => getStudentStatus(s.studentId) === 'present').length;
          return (
            <div key={i} className={`rounded-2xl shadow-lg border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className="p-6 cursor-pointer hover:bg-blue-500/5" onClick={() => setSelectedClass(selectedClass === cls ? null : cls)}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">{cls}</h3>
                  <ChevronRight size={20} className={selectedClass === cls ? 'rotate-90' : ''} />
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(present / (classStudents.length || 1)) * 100}%` }} />
                </div>
                <p className="text-xs mt-2 opacity-60">{present} / {classStudents.length} Present</p>
              </div>
              {selectedClass === cls && (
                <div className="p-4 border-t border-gray-700/20 max-h-60 overflow-y-auto">
                  {classStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((s, si) => (
                    <div key={si} className="flex justify-between items-center py-2 text-sm">
                      <span>{s.name}</span>
                      <span className={`w-2 h-2 rounded-full ${getStudentStatus(s.studentId) === 'present' ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                  ))}
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
        <h2 className="text-xl font-bold">Attendance History</h2>
        <button onClick={exportToCSV} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
          <Download size={16} /> Export
        </button>
      </div>
      <div className={`rounded-2xl shadow-lg border overflow-x-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700/20 opacity-60 text-xs uppercase">
              <th className="p-4">Time</th>
              <th className="p-4">Student</th>
              <th className="p-4">Class</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/10">
            {logs.map((log, i) => (
              <tr key={i} className="text-sm">
                <td className="p-4">{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td className="p-4 font-medium">{log.name}</td>
                <td className="p-4">{log.class}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${log.status === 'IN' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`sticky top-0 z-20 p-4 border-b backdrop-blur-md ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black tracking-tight text-blue-600">RFID.PORTAL</h1>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-500/10">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-xl text-sm font-bold">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['Dashboard', 'Classroom', 'Logs'].map((tab, idx) => (
            <button
              key={idx} onClick={() => setActiveTab(idx)}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === idx ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'opacity-50 hover:opacity-100'}`}
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
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
