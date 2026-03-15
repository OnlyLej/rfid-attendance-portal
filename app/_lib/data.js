'use client';

import { useState, useCallback } from 'react';

const PH_TZ = 'Asia/Manila';

/* ── Late threshold: students not checked in BY this hour are marked late ── */
export const LATE_HOUR = 7; // 7:00 AM — edit this value to change the cutoff

export const normalizeId = (id) => (id ?? '').toString().trim().toLowerCase();

export const parsePhTimestamp = (str) => {
  if (!str) return null;
  if (typeof str !== 'string') {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // Try standard YYYY-MM-DD HH:MM:SS (from Google Sheets ISO-like export)
  const iso = str.replace(' ', 'T') + '+08:00';
  const d1 = new Date(iso);
  if (!isNaN(d1.getTime())) return d1;
  // Fallback: M/D/YYYY H:MM:SS format (Google Sheets locale default)
  // Treat as PH time by appending a fake UTC offset after reformatting
  const mdyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(.*))?$/);
  if (mdyMatch) {
    const [, mo, dy, yr, time = '00:00:00'] = mdyMatch;
    const isoStr = `${yr}-${mo.padStart(2,'0')}-${dy.padStart(2,'0')}T${time.trim().replace(' AM','').replace(' PM','')}+08:00`;
    const d2 = new Date(isoStr);
    if (!isNaN(d2.getTime())) return d2;
  }
  // Last resort: native parse (may be wrong timezone but better than null)
  const d3 = new Date(str);
  return isNaN(d3.getTime()) ? null : d3;
};

export const getPhTodayStr = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: PH_TZ });

export const toPhDateStr = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-CA', { timeZone: PH_TZ });
};

export const getPhLocalDate = (str) => {
  const d = parsePhTimestamp(str);
  return d ? toPhDateStr(d) : '';
};

export function useAttendanceData(userType) {
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
  const [weeklyData, setWeeklyData] = useState([]);

  const secureApiCall = async (action, params = {}) => {
    const sessionToken = sessionStorage.getItem('sessionToken');
    if (!sessionToken) throw new Error('Not authenticated');
    const qs = new URLSearchParams({ action, sessionToken, ...params }).toString();
    const res = await fetch(`/api/proxy?${qs}`, { headers: { 'X-Session-Token': sessionToken } });
    if (!res.ok) throw new Error('API error');
    return res.json();
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
      return {
        name: dayName,
        present,
        absent: Math.max(0, studentsList.length - present),
        attendanceRate: studentsList.length > 0 ? Math.round((present / studentsList.length) * 100) : 0,
      };
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 180);
      const startStr = startDate.toLocaleDateString('en-CA', { timeZone: PH_TZ });
      const endStr = getPhTodayStr();
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
          try {
            const cd = await secureApiCall('getClasses');
            if (cd.success) setClasses(cd.classes || []);
          } catch {
            setClasses([...new Set((data.students || []).map(s => s.class))].filter(Boolean));
          }
        } else {
          setClasses([...new Set((data.students || []).map(s => s.class))].filter(Boolean));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userType]);

  return { logs, students, classes, loading, stats, weeklyData, fetchData };
}