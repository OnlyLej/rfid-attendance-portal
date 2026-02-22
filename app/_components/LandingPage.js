'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, Users, Clock, TrendingUp, Lock, Eye, EyeOff,
  BarChart3, Activity, AlertCircle, Sun, Moon,
  ChevronRight, RefreshCw, Award, Target, Shield, Bell,
  X, LogIn, Sparkles, Zap, ArrowRight,
  Cpu, CheckCircle, RadioTower, Database, Cloud, ShieldCheck, Brain, Network, CloudCog, Globe,
  Monitor, Wifi, Radio, ChevronDown, ChevronUp, ChevronLeft,
  Loader2, Waves, Signal, ArrowUp, ArrowDown
} from 'lucide-react';
import { useAuth } from '../_lib/AuthContext';

const AppLogo = ({ size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const sz = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const iconSz = size === 'sm' ? 13 : size === 'lg' ? 20 : 16;
  if (!imgError) {
    return (
      <div className={`${sz} rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-sky-500/20 ${className}`}>
        <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" onError={() => setImgError(true)} />
      </div>
    );
  }
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/20 ${className}`}>
      <RadioTower size={iconSz} className="text-white" />
    </div>
  );
};

export default function LandingPage() {
  const { handleLogin } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeFaq, setActiveFaq] = useState(null);

  const [liveStats, setLiveStats] = useState({ students: 124, present: 108, absent: 16, rate: 87, checkins: 251, uptime: 99.95, responseTime: 112 });
  const [statFlash, setStatFlash] = useState({});

  // Load theme
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') { setDarkMode(true); document.documentElement.classList.add('dark'); }
  }, []);

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    const tick = setInterval(() => {
      setLiveStats(prev => {
        const rand = (base, spread) => Math.max(0, base + Math.round((Math.random() - 0.5) * spread));
        const students = rand(prev.students, 4);
        const present = Math.min(students, rand(prev.present, 5));
        const absent = students - present;
        const rate = students > 0 ? Math.round((present / students) * 100) : 0;
        const checkins = rand(prev.checkins, 6);
        const uptime = Math.min(100, Math.max(99, parseFloat((prev.uptime + (Math.random() - 0.5) * 0.02).toFixed(2))));
        const responseTime = Math.max(80, Math.min(180, rand(prev.responseTime, 8)));
        const changed = {};
        if (students !== prev.students) changed.students = true;
        if (present !== prev.present) changed.present = true;
        if (absent !== prev.absent) changed.absent = true;
        if (checkins !== prev.checkins) changed.checkins = true;
        if (responseTime !== prev.responseTime) changed.responseTime = true;
        setStatFlash(changed);
        return { students, present, absent, rate, checkins, uptime, responseTime };
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (Object.keys(statFlash).length === 0) return;
    const t = setTimeout(() => setStatFlash({}), 400);
    return () => clearTimeout(t);
  }, [statFlash]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature(p => (p + 1) % 4), 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);
    await handleLogin(username, password, setError);
    setLoginLoading(false);
  };

  const inp = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200
    ${darkMode ? 'bg-gray-700/60 border-gray-600 text-white placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15'}`;

  const features = [
    { icon: Cpu, label: 'Hardware Layer', color: 'sky', gradient: 'from-sky-500 to-cyan-400', title: 'ESP8266 RFID Readers', desc: 'Physical RFID scanners at every entry point. Students tap their card and attendance is logged in under 200ms — no manual input, no errors.', bullets: ['Dual-band WiFi transmission', 'OLED status display', 'Audio & visual feedback', 'Tamper-resistant casing'] },
    { icon: Database, label: 'Secure Backend', color: 'violet', gradient: 'from-violet-500 to-purple-400', title: 'Google Apps Script API', desc: 'Role-based API endpoints process every scan instantly. Data is encrypted at rest and in transit, with full audit trails.', bullets: ['Session token auth', 'Role-based access control', 'Real-time processing', 'GDPR compliant logging'] },
    { icon: BarChart3, label: 'Analytics', color: 'emerald', gradient: 'from-emerald-500 to-teal-400', title: 'Live Dashboard Analytics', desc: 'Beautiful charts, daily/weekly/monthly trends, and class comparisons. Export any view to Excel in one click.', bullets: ['7-day & monthly trends', 'Class performance ranking', 'Export to Excel/CSV', 'Mobile-responsive'] },
    { icon: Bell, label: 'Parent Portal', color: 'amber', gradient: 'from-amber-500 to-orange-400', title: 'Real-Time Parent Visibility', desc: "Parents see their child's check-in and check-out in real time. Supports multiple children per account with per-child or combined views.", bullets: ['Multi-child support', 'Per-child attendance log', 'Historical records', 'Exportable history'] },
  ];

  const faqs = [
    { q: 'What RFID hardware is required?', a: 'Any standard 125kHz or 13.56MHz RFID card/fob works. The reader units run on ESP8266 microcontrollers connected to your school WiFi. Setup takes under 30 minutes per unit.' },
    { q: 'How is student data protected?', a: 'All data is encrypted in transit (TLS 1.3) and at rest. Session tokens expire after 30 minutes of inactivity. No personally identifiable data is stored on the hardware itself.' },
    { q: 'Can parents access admin features?', a: "No. The parent portal is strictly read-only, scoped to their own children's records. Teachers and administrators have separate credential tiers." },
    { q: 'Can one parent account track multiple children?', a: 'Yes. A parent account can be linked to multiple students. The portal shows a child-selector to switch between individual views or see all records combined.' },
    { q: 'What happens if the WiFi goes down?', a: 'The ESP8266 reader queues scans locally and syncs automatically when connectivity is restored. No attendance data is lost during outages.' },
    { q: 'How do I export attendance records?', a: 'Click Export on any filtered view in the Logs tab. Records download as a formatted Excel (.xlsx) file with color-coded statuses and auto-filters pre-applied.' },
  ];

  const steps = [
    { step: '01', icon: Wifi, title: 'Student taps RFID card', desc: 'The ESP8266 reader at the classroom door instantly detects the card and reads the unique UID in under 50ms.', gradient: 'from-sky-500 to-cyan-400', accent: '#0ea5e9' },
    { step: '02', icon: CloudCog, title: 'WiFi transmission to API', desc: 'The reader sends the UID, timestamp, and reader ID to the Google Apps Script endpoint over HTTPS.', gradient: 'from-violet-500 to-purple-400', accent: '#7c3aed' },
    { step: '03', icon: Database, title: 'Data stored & classified', desc: 'The log is written to Google Sheets in real time with the student name, class, IN/OUT status, and PH-timezone timestamp.', gradient: 'from-indigo-500 to-blue-400', accent: '#6366f1' },
    { step: '04', icon: Monitor, title: 'Dashboard updates live', desc: 'Teachers see the attendance count update in real time. Charts, class comparisons, and parent portals all reflect the new data.', gradient: 'from-emerald-500 to-teal-400', accent: '#10b981' },
  ];

  const px = mousePos.x;
  const py = mousePos.y;
  const flashCls = (key) => statFlash[key] ? 'scale-110 text-sky-400 transition-all duration-150' : 'transition-all duration-300';

  return (
    <div className={`min-h-screen overflow-x-hidden ${darkMode ? 'bg-[#080c14] text-white' : 'bg-[#f7f9fc] text-gray-900'} transition-colors duration-300`}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] transition-[left,top] duration-1000 ease-out ${darkMode ? 'bg-sky-900/25' : 'bg-sky-200/50'}`} style={{ left: `${-10 + px * 15}%`, top: `${-10 + py * 10}%` }} />
        <div className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] transition-[right,bottom] duration-[1400ms] ease-out ${darkMode ? 'bg-violet-900/20' : 'bg-violet-100/60'}`} style={{ right: `${-5 + (1 - px) * 12}%`, bottom: `${10 + py * 8}%` }} />
        <div className={`absolute w-[300px] h-[300px] rounded-full blur-[80px] ${darkMode ? 'bg-emerald-900/15' : 'bg-emerald-100/40'}`} style={{ left: '40%', top: '60%' }} />
      </div>

      {/* Nav */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-2xl transition-all duration-500 ${scrolled ? 'shadow-lg shadow-black/5' : ''} ${darkMode ? 'bg-[#080c14]/80 border-white/5' : 'bg-white/80 border-black/5'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <span className={`font-black text-sm tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>RFID Attendance</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {['Features', 'How It Works', 'FAQ'].map((item) => (
              <button key={item} onClick={() => document.getElementById(item.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' })} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'}`}>{item}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-black/5 text-gray-500'}`}>
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => setShowModal(true)} className="relative px-4 py-2 text-sm font-bold text-white rounded-xl overflow-hidden group transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/30" style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
              <span className="relative z-10 flex items-center gap-1.5"><LogIn size={14} /> Sign In</span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:pt-28 md:pb-36" style={{ zIndex: 1 }}>
        <div className="flex justify-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border backdrop-blur-sm ${darkMode ? 'bg-white/5 border-white/10 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'}`}>
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" /></span>
            Live · {liveStats.present} students present right now
          </div>
        </div>
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tighter">
            <span className={darkMode ? 'text-white' : 'text-gray-900'}>Attendance, </span>
            <br className="hidden md:block" />
            <span className="relative inline-block">
              <span style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 50%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Automated.</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
                <path d="M0 5 Q50 0 100 4 Q150 8 200 3" stroke="url(#heroUnderlineGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <defs><linearGradient id="heroUnderlineGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="50%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs>
              </svg>
            </span>
          </h1>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            RFID card taps replace manual roll-calls. Real-time dashboards, parent portals with multi-child support, and one-click Excel exports — built for Philippine schools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => setShowModal(true)} className="group relative px-7 py-3.5 text-sm font-bold text-white rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-sky-500/30 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)' }}>
              <span className="relative z-10 flex items-center gap-2">Access Portal <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" /></span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className={`px-7 py-3.5 text-sm font-bold rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
              See how it works <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Live stat cards */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { key: 'students', val: `${liveStats.students}`, label: 'Students Enrolled', icon: Users, accent: '#0ea5e9' },
            { key: 'checkins', val: `${liveStats.checkins}+`, label: "Today's Check-ins", icon: CheckCircle, accent: '#10b981' },
            { key: 'uptime', val: `${liveStats.uptime}%`, label: 'System Uptime', icon: Cloud, accent: '#7c3aed' },
            { key: 'responseTime', val: `<${liveStats.responseTime}ms`, label: 'Scan Response', icon: Zap, accent: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className={`group relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default text-center ${darkMode ? 'bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md'}`}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />
              <s.icon size={20} className="mx-auto mb-2.5" style={{ color: s.accent }} />
              <p className={`text-2xl font-black tabular-nums inline-block ${flashCls(s.key)} ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.val}</p>
              <p className={`text-xs mt-1 font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Dashboard preview */}
        <div className="mt-14 relative">
          <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-30 ${darkMode ? 'bg-gradient-to-br from-sky-800 to-violet-800' : 'bg-gradient-to-br from-sky-200 to-violet-200'}`} />
          <div className={`relative rounded-3xl border overflow-hidden ${darkMode ? 'bg-gray-900/80 border-white/8' : 'bg-white border-gray-200 shadow-xl'}`}>
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${darkMode ? 'border-white/5 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex gap-1.5">{['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}</div>
              <div className={`flex-1 mx-4 px-3 py-1 rounded-lg text-xs font-mono ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>rfid-attendance.vercel.app</div>
              <div className="flex gap-1.5 items-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Live</span></div>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total Students', val: liveStats.students, color: '#0ea5e9', flashKey: 'students', suffix: '' },
                  { label: 'Present Today', val: liveStats.present, color: '#10b981', flashKey: 'present', suffix: '' },
                  { label: 'Absent Today', val: liveStats.absent, color: '#f43f5e', flashKey: 'absent', suffix: '' },
                  { label: "Today's Rate", val: liveStats.rate, color: '#7c3aed', flashKey: 'rate', suffix: '%' },
                ].map((c, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/70 border-gray-700/50' : 'bg-slate-50 border-gray-100'}`}>
                    <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{c.label}</p>
                    <p className={`text-xl font-black tabular-nums inline-block transition-all duration-200 ${statFlash[c.flashKey] ? 'scale-110' : ''}`} style={{ color: c.color }}>{c.val}{c.suffix}</p>
                  </div>
                ))}
              </div>
              <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800/70 border-gray-700/50' : 'bg-slate-50 border-gray-100'}`}>
                <p className={`text-xs font-bold mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Weekly Attendance</p>
                <div className="flex items-end gap-2 h-16">
                  {[72, 85, 78, 90, 83, 88, liveStats.rate].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-lg transition-all duration-500" style={{ height: `${Math.max(8, h)}%`, background: i === 6 ? 'linear-gradient(to top, #0ea5e9, #7c3aed)' : darkMode ? '#1e293b' : '#e2e8f0' }} />
                      <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{['M','T','W','T','F','S','S'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-16 rounded-b-3xl ${darkMode ? 'bg-gradient-to-t from-[#080c14]' : 'bg-gradient-to-t from-[#f7f9fc]'}`} />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20" style={{ zIndex: 1 }}>
        <div className="text-center mb-12">
          <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>Platform Features</p>
          <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Everything you need,<br />nothing you don't</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            {features.map((f, i) => (
              <button key={i} onClick={() => setActiveFeature(i)} className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${activeFeature === i ? darkMode ? 'bg-white/6 border-white/15 shadow-lg' : 'bg-white border-gray-200 shadow-lg' : darkMode ? 'border-white/4 hover:bg-white/4 hover:border-white/10' : 'border-transparent hover:bg-white hover:border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${activeFeature === i ? `bg-gradient-to-br ${f.gradient}` : darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <f.icon size={15} className={activeFeature === i ? 'text-white' : darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${activeFeature === i ? darkMode ? 'text-sky-400' : 'text-sky-600' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{f.label}</p>
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.title}</p>
                  </div>
                  <ChevronRight size={16} className={`ml-auto transition-all duration-300 ${activeFeature === i ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                {activeFeature === i && (
                  <div className="mt-3 pl-11 space-y-2">
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                      {f.bullets.map((b, bi) => (
                        <div key={bi} className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />{b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className={`sticky top-24 rounded-3xl border overflow-hidden ${darkMode ? 'bg-gray-900/60 border-white/8' : 'bg-white border-gray-200 shadow-xl'}`} style={{ minHeight: '340px' }}>
            {features.map((f, i) => (
              <div key={i} className={`transition-all duration-500 ${activeFeature === i ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
                <div className={`h-2 w-full bg-gradient-to-r ${f.gradient}`} />
                <div className="p-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br ${f.gradient}`}><f.icon size={26} className="text-white" /></div>
                  <h3 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {f.bullets.map((b, bi) => (
                      <div key={bi} className={`flex items-center gap-3 p-3 rounded-xl border ${darkMode ? 'border-white/5 bg-white/3' : 'border-gray-100 bg-slate-50'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${f.gradient}`}><CheckCircle size={12} className="text-white" /></div>
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={`relative py-20 ${darkMode ? 'bg-white/2' : 'bg-white'}`} style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Process</p>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>From tap to dashboard<br />in 200 milliseconds</h2>
          </div>
          <div className="relative">
            <div className={`absolute top-8 bottom-8 w-px ${darkMode ? 'bg-gradient-to-b from-sky-500 via-violet-500 to-emerald-500' : 'bg-gradient-to-b from-sky-300 via-violet-300 to-emerald-300'}`} style={{ left: '31px' }} />
            <div className="space-y-6">
              {steps.map((item, i) => (
                <div key={i} className="relative flex gap-5 items-start group">
                  <div className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br ${item.gradient} transition-transform duration-300 group-hover:scale-105`}>
                    <item.icon size={24} className="text-white" />
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border-2 ${darkMode ? 'bg-gray-900' : 'bg-white'}`} style={{ color: item.accent, borderColor: item.accent }}>{i + 1}</div>
                  </div>
                  <div className={`flex-1 p-5 rounded-2xl border transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md ${darkMode ? 'bg-white/3 border-white/6 hover:border-white/12' : 'bg-slate-50 border-gray-100 hover:border-gray-200 hover:bg-white'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: item.accent }}>Step {item.step}</p>
                    <h3 className={`text-base font-black mb-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security section */}
      <section className={`relative py-14 overflow-hidden ${darkMode ? 'bg-white/2' : 'bg-white'}`} style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className={`p-8 md:p-10 rounded-3xl border overflow-hidden relative ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-white/8' : 'bg-gradient-to-br from-slate-900 to-gray-800 border-transparent'}`}>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 blur-3xl bg-sky-400" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10 blur-2xl bg-violet-400" />
            <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-4"><Shield size={20} className="text-sky-400" /><span className="text-sky-400 text-xs font-bold uppercase tracking-widest">Enterprise Security</span></div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">Your data stays yours.</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Every request is authenticated with a rotating session token. Connections use TLS 1.3. No attendance data is stored on the hardware itself — only the school's backend holds student records.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield, label: 'TLS 1.3 Encryption', val: '256-bit' },
                  { icon: Clock, label: 'Session Timeout', val: '30 min' },
                  { icon: Database, label: 'Data Isolation', val: 'Per-role' },
                  { icon: CheckCircle, label: 'Audit Logs', val: 'Full trail' },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/8">
                    <s.icon size={16} className="text-sky-400 mb-2" />
                    <p className="text-white font-bold text-lg">{s.val}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20" style={{ zIndex: 1 }}>
        <div className="text-center mb-12">
          <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>FAQ</p>
          <h2 className={`text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Common questions</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className={`rounded-2xl border overflow-hidden transition-all duration-300 ${activeFaq === i ? darkMode ? 'bg-white/5 border-white/12' : 'bg-white border-gray-200 shadow-md' : darkMode ? 'border-white/5 hover:border-white/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
              <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.q}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ml-3 transition-all duration-300 ${activeFaq === i ? 'bg-sky-500' : darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {activeFaq === i ? <ChevronUp size={14} className="text-white" /> : <ChevronDown size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />}
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-40 pb-5' : 'max-h-0'}`}>
                <p className={`px-5 text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center" style={{ zIndex: 1 }}>
        <div className={`relative p-10 md:p-14 rounded-3xl overflow-hidden border ${darkMode ? 'border-white/8' : 'border-transparent'}`} style={{ background: darkMode ? 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(124,58,237,0.08))' : 'linear-gradient(135deg, #eff6ff, #f5f3ff)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
          </div>
          <div className="relative z-10">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border mb-6 ${darkMode ? 'bg-white/5 border-white/10 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'}`}>
              <Sparkles size={11} className="animate-pulse" /> Ready to transform attendance?
            </div>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Start tracking smarter</h2>
            <p className={`text-base mb-8 max-w-lg mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sign in to access live dashboards, parent portals, and one-click reports — all powered by your RFID readers.</p>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-bold text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-sky-500/30 group" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)' }}>
              Access Portal <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm">
              {[{ icon: ShieldCheck, label: 'Secure by default' }, { icon: Cloud, label: '99.95% uptime' }, { icon: Globe, label: 'PH timezone native' }].map((t, i) => (
                <div key={i} className={`flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><t.icon size={15} className="text-emerald-500" /><span className="font-medium">{t.label}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative border-t py-10 ${darkMode ? 'border-white/5 bg-black/20' : 'border-gray-100 bg-white'}`} style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3"><AppLogo size="sm" /><span className={`font-black text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>RFID Attendance</span></div>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Modern attendance management for Philippine schools. Built on proven hardware and cloud infrastructure.</p>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Quick Links</p>
              <div className="space-y-2">
                {['Features', 'How It Works', 'FAQ'].map(l => (
                  <button key={l} onClick={() => document.getElementById(l.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' })} className={`block text-xs font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Stack</p>
              <div className="flex flex-wrap gap-2">
                {['ESP8266', 'RFID RC522', 'Google Apps Script', 'Next.js', 'Recharts', 'ExcelJS'].map(t => (
                  <span key={t} className={`text-xs px-2 py-1 rounded-lg font-medium ${darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className={`border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs ${darkMode ? 'border-white/5 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
            <p>© {new Date().getFullYear()} RFID Attendance Portal. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
              All systems operational
            </p>
          </div>
        </div>
      </footer>

      {/* Login modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className={`relative w-full max-w-md rounded-3xl animate-modal-in overflow-hidden ${darkMode ? 'bg-gray-900 border border-white/10 shadow-2xl' : 'bg-white border border-gray-200/80 shadow-[0_32px_80px_rgba(0,0,0,0.18)]'}`}>
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0ea5e9, #7c3aed, #10b981)' }} />
            <div className="p-8">
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                  <AppLogo size="sm" />
                  <div>
                    <h2 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome back</h2>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sign in to your portal</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" className={inp} required disabled={loginLoading} />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className={`${inp} pr-11`} required disabled={loginLoading} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className={`absolute right-3.5 top-1/2 -translate-y-1/2 hover:scale-110 transition-all ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm animate-shake border ${darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    <AlertCircle size={15} />{error}
                  </div>
                )}
                <button type="submit" disabled={loginLoading} className="w-full py-3.5 text-white font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25" style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
                  {loginLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
                </button>
              </form>
              <div className={`mt-6 pt-5 border-t flex items-center justify-center gap-4 text-xs ${darkMode ? 'border-white/5 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                {[ShieldCheck, Globe, Zap].map((Icon, i) => (
                  <div key={i} className="flex items-center gap-1"><Icon size={11} className="text-emerald-500" /><span>{['Encrypted','PH Timezone','Fast'][i]}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modal-in { from { opacity: 0; transform: scale(0.94) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .animate-fade-in-up { animation: fade-in-up 0.45s ease-out both; }
        .animate-modal-in { animation: modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-shake { animation: shake 0.4s ease-out; }
        html { scroll-behavior: smooth; }
        body, html { overflow-x: hidden; }
        * { box-sizing: border-box; }
        @media (max-width: 767px) { input, select, textarea { font-size: 16px !important; } }
      `}</style>
    </div>
  );
}