'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const SESSION_TIMEOUT = 30 * 60 * 1000;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
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
    if (!authenticated) return;
    const check = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        alert('Session expired due to inactivity.');
        handleLogout();
      }
    }, 60000);
    return () => clearInterval(check);
  }, [authenticated, lastActivity]);

  useEffect(() => {
    if (!authenticated) return;
    const update = () => setLastActivity(Date.now());
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(e => document.addEventListener(e, update));
    return () => ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(e => document.removeEventListener(e, update));
  }, [authenticated]);

  const handleLogin = async (username, password, setError) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('sessionToken', data.sessionToken);
        sessionStorage.setItem('userType', data.userType);
        sessionStorage.setItem('userInfo', JSON.stringify(data));
        sessionStorage.setItem('loginTime', Date.now().toString());
        setAuthenticated(true);
        setUserType(data.userType);
        setUserInfo(data);
        setLastActivity(Date.now());
        // Redirect based on role
        if (data.userType === 'teacher') {
          router.push('/dashboard');
        } else if (data.userType === 'parent') {
          router.push('/parent');
        } else {
          router.push('/');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Login failed. Please try again.');
    }
  };

  const handleLogout = useCallback(async () => {
    const token = sessionStorage.getItem('sessionToken');
    sessionStorage.clear();
    setAuthenticated(false);
    setUserType(null);
    setUserInfo(null);
    if (token) {
      fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', sessionToken: token }),
      }).catch(() => {});
    }
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ authenticated, userType, userInfo, mounted, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}