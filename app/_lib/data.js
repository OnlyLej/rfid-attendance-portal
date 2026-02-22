'use client';

import { useState, useCallback } from 'react';

const PH_TZ = 'Asia/Manila';

export const normalizeId = (id) => (id ?? '').toString().trim().toLowerCase();

export const parsePhTimestamp = (str) => {
  if (!str) return null;
  if (typeof str !== 'string') {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  const iso = str.replace(' ', 'T') + '+08:00';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
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