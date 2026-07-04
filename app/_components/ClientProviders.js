'use client';
import { useState, useEffect } from 'react';
import { ToastProvider } from './ui';
import { detectTimezone } from '../_lib/data';
import TopLoader from './TopLoader';
import { AppProvider } from '../_lib/AppContext';

const RIDAP_ASCII = `
%c██████╗ ██╗██████╗  █████╗ ██████╗ 
██╔══██╗██║██╔══██╗██╔══██╗██╔══██╗
██████╔╝██║██║  ██║███████║██████╔╝
██╔══██╗██║██║  ██║██╔══██║██╔═══╝ 
██║  ██║██║██████╔╝██║  ██║██║     
╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝     %c

        %cmade by Lejel%c
`;

export default function ClientProviders({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Detect timezone from IP on mount
    detectTimezone().catch(console.error);

    // Easter egg 🥚
    console.log(
      RIDAP_ASCII,
      'color:#0ea5e9; font-family:monospace; font-weight:bold; line-height:1.4;',
      '',
      'color:#7c3aed; font-family:monospace; font-style:italic; font-size:13px;',
      ''
    );
    console.log(
      '%cRFID Attendance Portal · built with ❤️ · https://ridap.qzz.io',
      'color:#10b981; font-family:monospace; font-size:11px;'
    );

    // Read from localStorage and watch for changes
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return (
    <AppProvider>
      <ToastProvider darkMode={darkMode}>
        <TopLoader />
        {children}
      </ToastProvider>
    </AppProvider>
  );
}
