'use client';
import { useState, useEffect } from 'react';
import { ToastProvider } from './ui';


const RIDAP_ASCII = `
%c██████╗ ██╗██████╗  █████╗ ██████╗ 
██╔══██╗██║██╔══██╗██╔══██╗██╔══██╗
██████╔╝██║██║  ██║███████║██████╔╝
██╔══██╗██║██║  ██║██╔══██║██╔═══╝ 
██║  ██║██║██████╔╝██║  ██║██║     
╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝     %c

        %cmade by lejel%c
`;

export default function ClientProviders({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Easter egg 🥚
    console.log(
      RIDAP_ASCII,
      'color:#0ea5e9; font-family:monospace; font-weight:bold; line-height:1.4;',
      '',
      'color:#7c3aed; font-family:monospace; font-style:italic; font-size:13px;',
      ''
    );
    console.log(
      '%cRFID Attendance Portal · built with ❤️ · https://github.com',
      'color:#10b981; font-family:monospace; font-size:11px;'
    );

    // Read from localStorage and watch for changes
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return <ToastProvider darkMode={darkMode}>{children}</ToastProvider>;
}