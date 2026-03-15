'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from './_lib/AppContext';
import { RadioTower, ArrowLeft, Home, Shield, WifiOff, Zap, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const { authenticated, userType, mounted } = useApp();
  const [darkMode, setDarkMode] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [pulseAnim, setPulseAnim] = useState(false);
  const [clientMounted, setClientMounted] = useState(false);
  const [particles, setParticles] = useState([]);
  const [timestamp, setTimestamp] = useState('');

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

  // Pulse animation for icon
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseAnim(true);
      setTimeout(() => setPulseAnim(false), 400);
    }, 2000);
    return () => clearInterval(pulseInterval);
  }, []);

  useEffect(() => {
    setClientMounted(true);
    // Generate stable random particles client-side only
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    })));
    // Live clock
    const tick = () => setTimestamp(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const homeHref = !mounted || !authenticated
    ? '/'
    : userType === 'teacher'
    ? '/dashboard'
    : userType === 'parent'
    ? '/parent'
    : '/';

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-[#080c14] text-white' : 'bg-slate-50 text-gray-900'
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large drifting orbs */}
        <div
          className={`absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 -top-32 -left-32 animate-drift ${
            darkMode ? 'bg-sky-600' : 'bg-sky-300'
          }`}
        />
        <div
          className={`absolute w-[500px] h-[500px] rounded-full blur-[130px] opacity-15 bottom-0 right-0 animate-drift-reverse ${
            darkMode ? 'bg-violet-700' : 'bg-violet-300'
          }`}
        />
        <div
          className={`absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 top-1/2 left-1/3 animate-pulse-slow ${
            darkMode ? 'bg-amber-600' : 'bg-amber-300'
          }`}
        />

        {/* Grid pattern - multiple layers */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: darkMode
              ? 'linear-gradient(rgba(14,165,233,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.3) 1px, transparent 1px)'
              : 'linear-gradient(rgba(14,165,233,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.2) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: darkMode
              ? 'linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)'
              : 'linear-gradient(rgba(124,58,237,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.2) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            transform: 'rotate(15deg) scale(1.5)',
          }}
        />

        {/* Diagonal lines */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0px, currentColor 2px, transparent 2px, transparent 20px)',
          }}
        />

        {/* Circuit board style lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M20 20 L80 20 M20 50 L50 50 M70 50 L90 50 M20 80 L40 80 M60 80 L90 80" stroke="currentColor" strokeWidth="1" fill="none" />
              <circle cx="20" cy="20" r="3" fill="currentColor" />
              <circle cx="80" cy="20" r="3" fill="currentColor" />
              <circle cx="50" cy="50" r="3" fill="currentColor" />
              <circle cx="70" cy="50" r="3" fill="currentColor" />
              <circle cx="90" cy="50" r="3" fill="currentColor" />
              <circle cx="40" cy="80" r="3" fill="currentColor" />
              <circle cx="60" cy="80" r="3" fill="currentColor" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit)" />
        </svg>

        {/* Scan line effect */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none animate-scan"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)',
          }}
        />

        {/* Floating particles — client-only to avoid hydration mismatch */}
        {clientMounted && particles.map((p) => (
          <div
            key={p.id}
            className={`absolute w-1 h-1 rounded-full animate-float-particle ${
              darkMode ? 'bg-sky-400/20' : 'bg-sky-500/20'
            }`}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Main content - asymmetrical layout */}
      <div className="relative z-10 container mx-auto px-6 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left column - Main 404 content */}
          <div className="space-y-8 lg:space-y-12">
            {/* Status indicator - moved here from top */}
            <div className="flex items-center gap-3 animate-fade-in">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/30 transition-all duration-300 ${pulseAnim ? 'scale-110 shadow-sky-500/50' : ''}`}>
                <RadioTower size={20} className="text-white" />
              </div>
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  SYSTEM STATUS
                </div>
                <div className={`text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  PAGE_NOT_FOUND
                </div>
              </div>
            </div>

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
                404
              </span>
              {/* Gradient overlay on number */}
              <div
                className="absolute inset-0 pointer-events-none animate-gradient"
                style={{
                  backgroundImage: darkMode
                    ? 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(124,58,237,0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(124,58,237,0.06) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              />
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
                className="group relative flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-sky-500/30 animate-fade-in-up"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
              >
                <Home size={15} className="transition-transform duration-300 group-hover:rotate-12" />
                {authenticated ? 'Back to Dashboard' : 'Go to Login'}
              </Link>
              <button
                onClick={() => window.history.back()}
                className={`group flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg animate-fade-in-up ${
                  darkMode
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-200 text-gray-700 hover:bg-white shadow-sm'
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
            <div className={`relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] animate-slide-up ${
              darkMode
                ? 'bg-gray-900/40 border-gray-800'
                : 'bg-white/40 border-gray-200'
            }`}>
              <div className="flex items-start gap-4">
                <div className="relative">
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
                  {/* Ping rings */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-rose-500/20 animate-ping" />
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

            {/* Reason pills in a card */}
            <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] animate-slide-up-delay ${
              darkMode
                ? 'bg-gray-900/40 border-gray-800'
                : 'bg-white/40 border-gray-200'
            }`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <AlertCircle size={16} className="text-sky-500" />
                Possible Reasons
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Shield, label: 'Insufficient role access', desc: 'Your account lacks permission' },
                  { icon: WifiOff, label: 'Route does not exist', desc: 'The path may have been moved' },
                  { icon: Zap, label: 'Connection timeout', desc: 'Request exceeded time limit' },
                ].map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-xl text-sm transition-all duration-300 hover:translate-x-1 ${
                      darkMode
                        ? 'bg-gray-800/40 hover:bg-gray-800/60'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  >
                    <r.icon size={16} className="text-sky-500 mt-0.5" />
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{r.label}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className={`grid grid-cols-2 gap-3 animate-slide-up-delay2`}>
              <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.05] ${
                darkMode
                  ? 'bg-gray-900/40 border-gray-800'
                  : 'bg-white/40 border-gray-200'
              }`}>
                <div className="text-2xl font-bold text-sky-500">404</div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Error Code</div>
              </div>
              <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.05] ${
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
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}