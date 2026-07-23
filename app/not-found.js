'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, WifiOff, Moon, Sun, Menu, X } from 'lucide-react';

export default function NotFound() {
  const [darkMode, setDarkMode] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [timestamp, setTimestamp] = useState('');
  const [errorCode, setErrorCode] = useState('404');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDark = () => {
    const n = !darkMode;
    setDarkMode(n);
    document.documentElement.classList.toggle('dark', n);
    localStorage.setItem('theme', n ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDarkMode(true);
  }, []);

  // Periodic glitch effect on the 404
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Live clock
  useEffect(() => {
    const tick = () => setTimestamp(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const homeHref = '/';

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-[#080c14] text-white' : 'bg-slate-50 text-gray-900'
      }`}
    >
      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 backdrop-blur-2xl ${darkMode ? 'bg-[#050810]/88 border-b border-white/6' : 'bg-white/88 border-b border-black/6'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5">
              <span className={`font-black text-sm tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>RFID Attendance Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={toggleDark} className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-12 ${darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}>
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => setDrawerOpen(true)} className={`md:hidden p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/6 text-gray-300' : 'hover:bg-black/6 text-gray-600'}`}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className={`relative ml-auto w-[280px] sm:w-80 h-full flex flex-col animate-slide-left ${darkMode ? 'bg-[#080d1a]' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-white/6' : 'border-gray-100'}`}>
              <span className={`font-black text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>RFID Attendance Portal</span>
              <button onClick={() => setDrawerOpen(false)} className={`p-2 rounded-xl transition-all hover:rotate-90 ${darkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={18} /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <Link href="/" onClick={() => setDrawerOpen(false)} className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${darkMode ? 'text-gray-300 hover:bg-white/6 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>
                Home
              </Link>
            </nav>
            <div className={`p-4 border-t ${darkMode ? 'border-white/6' : 'border-gray-100'}`}>
              <button onClick={toggleDark} className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:bg-white/6' : 'text-gray-700 hover:bg-gray-50'}`}>
                {darkMode ? <><Sun size={15} /> Light Mode</> : <><Moon size={15} /> Dark Mode</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content - asymmetrical layout */}
      <div className="relative z-10 container mx-auto px-6 py-12 lg:py-20 pt-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left column - Main 404 content */}
          <div className="space-y-8 lg:space-y-12">
            {/* 404 number with glitch */}
            <div className="relative select-none">
              <span
                className={`text-[10rem] sm:text-[12rem] font-black leading-none tracking-tighter block transition-all duration-75 animate-float ${
                  darkMode ? 'text-white' : 'text-gray-900'
                } ${glitch ? 'glitch-active' : ''}`}
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: glitch
                    ? darkMode
                      ? '3px 0 #0ea5e9, -3px 0 #f43f5e'
                      : '3px 0 #0ea5e9, -3px 0 #f43f5e'
                    : 'none',
                  transform: glitch ? 'skewX(-2deg)' : 'none',
                }}
              >
                {errorCode}
              </span>
            </div>

            {/* Message */}
            <div className="space-y-4 max-w-xl">
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight animate-slide-up ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Access Denied or Page Not Found
              </h1>
              <p className={`text-sm sm:text-base leading-relaxed animate-slide-up-delay ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                This page doesn't exist, or you don't have permission to view it. 
                The signal couldn't reach the requested endpoint.
              </p>
              <p className={`text-xs animate-slide-up-delay2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Error Code: 0x404 • Timestamp: {timestamp || '—'}
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href={homeHref}
                className="group relative flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-fade-in-up"
                style={{ background: '#0ea5e9' }}
              >
                <Home size={15} className="transition-transform duration-300 group-hover:rotate-12" />
                Go to Home
              </Link>
              <button
                onClick={() => window.history.back()}
                className={`group flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition-all duration-300 hover:scale-105 active:scale-95 animate-fade-in-up ${
                  darkMode
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-200 text-gray-700 hover:bg-white'
                }`}
                style={{ animationDelay: '0.1s' }}
              >
                <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
                Go Back
              </button>
            </div>
          </div>

          {/* Right column - Status cards */}
          <div className="space-y-4 lg:space-y-6">
            {/* Signal / Access Denied card */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] animate-slide-up ${
              darkMode
                ? 'bg-gray-900/40 border-gray-800'
                : 'bg-white/40 border-gray-200'
            }`}>
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    darkMode
                      ? 'bg-rose-500/10'
                      : 'bg-rose-50'
                  }`}
                >
                  <WifiOff
                    size={32}
                    className={`${darkMode ? 'text-rose-400' : 'text-rose-500'} animate-pulse`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Connection Lost
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Unable to establish connection with the requested page. The signal is weak.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className={`grid grid-cols-2 gap-3 animate-slide-up-delay2`}>
              <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.05] ${
                darkMode
                  ? 'bg-gray-900/40 border-gray-800'
                  : 'bg-white/40 border-gray-200'
              }`}>
                <div className="text-2xl font-bold text-sky-500">{errorCode}</div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Error Code</div>
              </div>
              <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.05] ${
                darkMode
                  ? 'bg-gray-900/40 border-gray-800'
                  : 'bg-white/40 border-gray-200'
              }`}>
                <div className="text-2xl font-bold text-purple-500">0%</div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Connection</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className={`relative border-t py-10 sm:py-12 ${darkMode ? 'border-white/6 bg-black/25' : 'border-gray-100 bg-white'}`} style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              © 2026 RFID Attendance Portal. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className={`text-sm font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                Home
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(60px, 40px) scale(1.1); }
        }
        @keyframes drift-reverse {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(-40px, -30px) scale(0.95); }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -20px); }
          50% { transform: translate(40px, 0); }
          75% { transform: translate(20px, 20px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        
        .animate-drift {
          animation: drift 15s ease-in-out infinite alternate;
        }
        .animate-drift-reverse {
          animation: drift-reverse 18s ease-in-out infinite alternate;
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-particle {
          animation: float-particle 15s linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: slide-up 0.6s ease-out forwards;
        }
        .animate-slide-up {
          opacity: 0;
          animation: slide-up 0.5s ease-out 0.2s forwards;
        }
        .animate-slide-up-delay {
          opacity: 0;
          animation: slide-up 0.5s ease-out 0.3s forwards;
        }
        .animate-slide-up-delay2 {
          opacity: 0;
          animation: slide-up 0.5s ease-out 0.4s forwards;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}