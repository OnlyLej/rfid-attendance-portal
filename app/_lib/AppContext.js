'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─── Constants ────────────────────────────────────────────────────────────────
const SESSION_TIMEOUT = 30 * 60 * 1000;
const PH_TZ = 'Asia/Manila';

// ─── Helpers (duplicated here so context has no import cycle with data.js) ────
// These are PH timezone functions for business logic (comparisons, late calculations)
const parsePhTimestamp = (str) => {
  if (!str) return null;
  if (typeof str !== 'string') { const d = new Date(str); return isNaN(d.getTime()) ? null : d; }
  const iso = str.replace(' ', 'T') + '+08:00';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};
const getPhTodayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: PH_TZ });
const toPhDateStr = (d) => d ? d.toLocaleDateString('en-CA', { timeZone: PH_TZ }) : '';
const getPhLocalDate = (str) => { const d = parsePhTimestamp(str); return d ? toPhDateStr(d) : ''; };
const normalizeId = (id) => (id ?? '').toString().trim().toLowerCase();

// Local timezone display functions (for showing times in user's timezone)
const formatLocalDateTime = (str) => {
  const d = parsePhTimestamp(str);
  if (!d) return '—';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

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

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [userType, setUserType]           = useState(null);
  const [userInfo, setUserInfo]           = useState(null);
  const [mounted, setMounted]             = useState(false);
  const [lastActivity, setLastActivity]   = useState(Date.now());

  // Shared attendance data — fetched ONCE, shared across all tabs
  const [logs, setLogs]           = useState([]);
  const [students, setStudents]   = useState([]);
  const [classes, setClasses]     = useState([]);
  const [stats, setStats]         = useState({ totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // true once first fetch completes

  const router    = useRouter();
  const logoutRef = useRef(null); // avoid stale closure in timeout check

  // ── Hydrate from sessionStorage on mount ──────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const token       = sessionStorage.getItem('sessionToken');
    const savedType   = sessionStorage.getItem('userType');
    const savedInfo   = sessionStorage.getItem('userInfo');
    if (token && savedType) {
      setAuthenticated(true);
      setUserType(savedType);
      setUserInfo(savedInfo ? JSON.parse(savedInfo) : null);
    }
  }, []);

  // ── Session timeout watcher ───────────────────────────────────────────────
  useEffect(() => {
    if (!authenticated) return;
    const check = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        alert('Session expired due to inactivity.');
        logoutRef.current?.();
      }
    }, 60_000);
    return () => clearInterval(check);
  }, [authenticated, lastActivity]);

  // ── Activity tracker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!authenticated) return;
    const update = () => setLastActivity(Date.now());
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, update));
    return () => events.forEach(e => document.removeEventListener(e, update));
  }, [authenticated]);

  // ── Fetch once whenever we become authenticated ───────────────────────────
  useEffect(() => {
    if (authenticated && !dataLoaded) {
      fetchData();
    }
  }, [authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Secure API helper ─────────────────────────────────────────────────────
  const secureApiCall = useCallback(async (action, params = {}) => {
    const token = sessionStorage.getItem('sessionToken');
    if (!token) throw new Error('Not authenticated');
    const qs  = new URLSearchParams({ action, sessionToken: token, ...params }).toString();
    const res = await fetch(`/api/proxy?${qs}`, { headers: { 'X-Session-Token': token } });
    if (!res.ok) {
      if (res.status === 401) { logoutRef.current?.(); throw new Error('Session expired'); }
      throw new Error('API error');
    }
    return res.json();
  }, []);

  // ── Main data fetch — callable from any page for manual refresh ───────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 180);
      const startStr = startDate.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const endStr   = getPhTodayStr();

      const data = await secureApiCall('getDashboardStats', { startDate: startStr, endDate: endStr });
      if (!data.success) return;

      const currentUserType = sessionStorage.getItem('userType');

      const sortedLogs = (data.logs || []).sort((a, b) => {
        const da = parsePhTimestamp(a.timestamp);
        const db = parsePhTimestamp(b.timestamp);
        return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
      });

      setStudents(data.students || []);
      setLogs(sortedLogs);
      setStats(data.stats || { totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
      setWeeklyData(calculateWeeklyData(sortedLogs, data.students || []));

      if (currentUserType === 'teacher') {
        try {
          const cd = await secureApiCall('getClasses');
          if (cd.success) setClasses(cd.classes || []);
          else throw new Error('no classes');
        } catch {
          setClasses([...new Set((data.students || []).map(s => s.class))].filter(Boolean));
        }
      } else {
        setClasses([...new Set((data.students || []).map(s => s.class))].filter(Boolean));
      }

      setDataLoaded(true);
    } catch (err) {
      console.error('fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [secureApiCall]);

  // ── Clear all data (used on logout) ──────────────────────────────────────
  const clearData = useCallback(() => {
    setLogs([]);
    setStudents([]);
    setClasses([]);
    setStats({ totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
    setWeeklyData([]);
    setDataLoaded(false);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async (username, password, setError) => {
    try {
      const res  = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('sessionToken', data.sessionToken);
        sessionStorage.setItem('userType',     data.userType);
        sessionStorage.setItem('userInfo',     JSON.stringify(data));
        sessionStorage.setItem('loginTime',    Date.now().toString());
        setAuthenticated(true);
        setUserType(data.userType);
        setUserInfo(data);
        setLastActivity(Date.now());
        // fetchData will be triggered by the `authenticated` effect above
        router.push(data.userType === 'teacher' ? '/dashboard' : data.userType === 'parent' ? '/parent' : '/');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Login failed. Please try again.');
    }
  }, [router]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    const token = sessionStorage.getItem('sessionToken');
    sessionStorage.clear();
    setAuthenticated(false);
    setUserType(null);
    setUserInfo(null);
    clearData();
    if (token) {
      fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout', sessionToken: token }) }).catch(() => {});
    }
    router.push('/');
  }, [router, clearData]);

  // Keep logoutRef in sync so the timeout watcher always has the latest fn
  logoutRef.current = handleLogout;

  return (
    <AppContext.Provider value={{
      // auth
      authenticated, userType, userInfo, mounted,
      handleLogin, handleLogout,
      // data
      logs, students, classes, stats, weeklyData,
      loading, dataLoaded,
      fetchData,   // call this from the refresh button
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Convenience alias so old `useAuth()` calls still work if any remain
export { useApp as useAuth };
