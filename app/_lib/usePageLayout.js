'use client';
import { useState, useEffect, useCallback } from 'react';

export function useIsMobile() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const c = () => setV(window.innerWidth < 768);
    c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c);
  }, []);
  return v;
}

export function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') { setDark(true); document.documentElement.classList.add('dark'); }
  }, []);
  const toggle = () => setDark(p => {
    const n = !p;
    document.documentElement.classList.toggle('dark', n);
    localStorage.setItem('theme', n ? 'dark' : 'light');
    return n;
  });
  return [dark, toggle];
}

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { if (localStorage.getItem('sidebarCollapsed') === 'true') setCollapsed(true); }, []);
  const toggle = useCallback(() => setCollapsed(p => {
    const n = !p;
    localStorage.setItem('sidebarCollapsed', n ? 'true' : 'false');
    return n;
  }), []);
  return [collapsed, toggle];
}

export const SIDEBAR_W_EXPANDED  = 260;
export const SIDEBAR_W_COLLAPSED = 64;