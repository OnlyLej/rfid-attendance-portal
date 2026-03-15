'use client';
import { useState, useEffect } from 'react';
import { ToastProvider } from './ui';

export default function ClientProviders({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Read from localStorage and watch for changes
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return <ToastProvider darkMode={darkMode}>{children}</ToastProvider>;
}