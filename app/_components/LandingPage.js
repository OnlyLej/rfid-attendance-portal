'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Eye, EyeOff, BarChart3, AlertCircle, Sun, Moon,
  ChevronRight, Shield, Bell, X, LogIn, Sparkles, Zap, ArrowRight,
  Cpu, CheckCircle, RadioTower, Database, Cloud, ShieldCheck, CloudCog, Globe,
  Monitor, Wifi, ChevronDown, Menu,
  Loader2, Signal, Play
} from 'lucide-react';
import { useApp } from '../_lib/AppContext';

const Odometer = dynamic(() => import('react-odometerjs'), { ssr: false });

function useIsBot() {
  const [isBot, setIsBot] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsBot(/Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot|Applebot|AhrefsBot|SemrushBot|MJ12bot|DotBot|crawler|spider|bot/i.test(ua));
  }, []);
  return isBot;
}

const StaticNum = ({ value, prefix, suffix }) => <span>{prefix}{value}{suffix}</span>;

const AppLogo = ({ size = 'md', className = '' }) => {
  const [err, setErr] = useState(false);
  const sz = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const ic = size === 'sm' ? 14 : size === 'lg' ? 22 : 17;
  if (!err) return (
    <div className={`${sz} rounded-xl overflow-hidden flex-shrink-0 ${className}`}>
      <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" onError={() => setErr(true)} />
    </div>
  );
  return (
    <div className={`${sz} rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0 ${className}`}>
      <RadioTower size={ic} className="text-white" />
    </div>
  );
};

function ParticleCanvas({ darkMode }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const pts = useRef([]);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const mobile = () => window.innerWidth < 768;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const n = mobile() ? 28 : 55;
    pts.current = Array.from({ length: n }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 1.4 + 0.4,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.45 + 0.1,
      col: ['#0ea5e9', '#7c3aed', '#10b981'][Math.floor(Math.random() * 3)],
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      const ld = mobile() ? 70 : 110;
      pts.current.forEach(p => {
        p.x = (p.x + p.vx + c.width) % c.width;
        p.y = (p.y + p.vy + c.height) % c.height;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col + Math.floor(p.a * 255).toString(16).padStart(2, '0'); ctx.fill();
      });
      pts.current.forEach((p, i) => {
        for (let j = i + 1; j < pts.current.length; j++) {
          const q = pts.current[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < ld) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = darkMode ? `rgba(148,163,184,${(1 - d / ld) * 0.055})` : `rgba(100,116,139,${(1 - d / ld) * 0.045})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [darkMode]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.55 }} />;
}

function useReveal(t = 0.08) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: t });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [t]);
  return [ref, vis];
}

const TYPED_WORDS = [
  'Built for Philippine schools.',
  'No more clipboards.',
  'Instant & accurate.',
  'Parents see it live.',
  'Real-time RFID scanning.',
  'Works on ESP8266 & ESP32.',
  'Auto-logs every arrival.',
  'Export to Excel anytime.',
  'Zero manual entry.',
  'Attendance in under 200ms.',
];

function TypedText({ words: _words, className }) {
  // Use a stable ref so inline array props don't break the loop
  const wordsRef = React.useRef(_words || TYPED_WORDS);
  const words = wordsRef.current;

  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [del, setDel] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => setPaused(false), 1200);
      return () => clearTimeout(t);
    }
    const w = words[idx % words.length];
    const t = setTimeout(() => {
      if (!del) {
        const next = w.slice(0, text.length + 1);
        setText(next);
        if (next.length === w.length) { setPaused(true); setDel(true); }
      } else {
        const next = w.slice(0, text.length - 1);
        setText(next);
        if (next.length === 0) { setDel(false); setIdx(i => (i + 1) % words.length); }
      }
    }, del ? 32 : 68);
    return () => clearTimeout(t);
  }, [text, del, idx, paused]);

  return <span className={className}>{text}<span className="opacity-60 animate-pulse">|</span></span>;
}

function CountUp({ to, suffix = '', prefix = '', duration = 1400 }) {
  const [val, setVal] = useState(0);
  const [ref, vis] = useReveal(0.25);
  useEffect(() => {
    if (!vis) return;
    let s = null;
    const tick = (ts) => { if (!s) s = ts; const p = Math.min((ts - s) / duration, 1); setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [vis, to, duration]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

function MobileDrawer({ open, onClose, darkMode, onSignIn }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  if (!open) return null;
  const go = (id) => { onClose(); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 220); };
  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ml-auto w-[280px] sm:w-80 h-full flex flex-col animate-slide-left ${darkMode ? 'bg-[#080d1a]' : 'bg-white'}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-white/6' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2.5"><AppLogo size="sm" /><span className={`font-black text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>RFID Attendance</span></div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-all hover:rotate-90 ${darkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={18} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[['features', 'Features'], ['how-it-works', 'How It Works'], ['faq', 'FAQ']].map(([id, lbl]) => (
            <button key={id} onClick={() => go(id)}
              className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${darkMode ? 'text-gray-300 hover:bg-white/6 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>
              {lbl}<ChevronRight size={15} className="opacity-35 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
          <div className={`mx-1 my-3 h-px ${darkMode ? 'bg-white/6' : 'bg-gray-100'}`} />
          {/* Theme toggle in drawer */}
          <button onClick={() => { /* handled by parent */ }} className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:bg-white/6' : 'text-gray-700 hover:bg-gray-50'}`}>
            {darkMode ? <><Sun size={15} /> Light mode</> : <><Moon size={15} /> Dark mode</>}
          </button>
        </nav>
        <div className={`p-4 border-t ${darkMode ? 'border-white/6' : 'border-gray-100'}`}>
          <button onClick={() => { onClose(); onSignIn(); }}
            className="w-full py-3.5 text-white font-bold rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden group text-sm"
            style={{ background: '#0ea5e9' }}>
            <LogIn size={15} /> Sign In to Portal
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { handleLogin } = useApp();
  const [dark, setDark] = useState(false);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navHide, setNavHide] = useState(false);
  const [featIdx, setFeatIdx] = useState(0);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.3 });
  const [openFaq, setOpenFaq] = useState(null);
  const [mounted, setMounted] = useState(false);
  const lastY = useRef(0);
  const isBot = useIsBot();

  const [stats, setStats] = useState({ students: 50, present: 30, absent: 20, rate: 67, checkins: 251, uptime: 99.99, responseTime: 100 });
  const timerRef = useRef(null);
  const qRef = useRef([]);

  const [heroRef, heroVis] = useReveal(0.04);
  const [featRef, featVis] = useReveal(0.08);
  const [howRef, howVis] = useReveal(0.08);
  const [secRef, secVis] = useReveal(0.08);
  const [faqRef, faqVis] = useReveal(0.08);
  const [ctaRef, ctaVis] = useReveal(0.08);
  const [metRef, metVis] = useReveal(0.08);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try { if (localStorage.getItem('theme') === 'dark') { setDark(true); document.documentElement.classList.add('dark'); } } catch { }
  }, []);

  const toggleDark = () => setDark(p => {
    const n = !p;
    document.documentElement.classList.toggle('dark', n);
    try { localStorage.setItem('theme', n ? 'dark' : 'light'); } catch { }
    return n;
  });

  useEffect(() => {
    if (isBot) return;
    const tick = setInterval(() => {
      const ns = {
        students: Math.max(40, stats.students + Math.round((Math.random() - 0.5) * 4)),
        present: Math.min(stats.students, Math.max(0, stats.present + Math.round((Math.random() - 0.5) * 5))),
        checkins: Math.max(0, stats.checkins + Math.round((Math.random() - 0.5) * 6)),
        uptime: stats.uptime, responseTime: stats.responseTime,
      };
      ns.absent = ns.students - ns.present;
      ns.rate = Math.round((ns.present / ns.students) * 100);
      qRef.current.push(ns);
      if (!timerRef.current) drain();
    }, 2200);
    return () => clearInterval(tick);
  }, [isBot, stats]);

  const drain = () => {
    if (!qRef.current.length) { timerRef.current = null; return; }
    setStats(qRef.current.shift());
    timerRef.current = setTimeout(() => { timerRef.current = null; drain(); }, 2800);
  };

  useEffect(() => {
    const h = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      setNavHide(y > lastY.current + 6 && y > 130);
      lastY.current = y;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const h = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', h, { passive: true });
    return () => window.removeEventListener('mousemove', h);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setFeatIdx(p => (p + 1) % 4), 3800);
    return () => clearInterval(t);
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    await handleLogin(user, pass, setErr);
    setLoading(false);
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const inp = `w-full px-4 py-3.5 rounded-2xl text-sm border outline-none transition-all duration-200 ${dark ? 'bg-white/6 border-white/12 text-white placeholder-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20'}`;
  const odo = { duration: 100, theme: 'default', auto: false };

  const features = [
    { icon: Cpu, label: 'Hardware Layer', bgClass: 'bg-sky-500', glow: '#0ea5e9', title: 'ESP8266/ESP32 RFID Readers', desc: 'Physical RFID scanners at every entry point. Students tap their card and attendance is logged in under 200ms — no manual input, no errors.', bullets: ['Dual-band WiFi transmission', 'OLED status display', 'Audio & visual feedback', 'Tamper-resistant casing'] },
    { icon: Database, label: 'Secure Backend', bgClass: 'bg-blue-500', glow: '#3b82f6', title: 'Google Apps Script API', desc: 'Role-based API endpoints process every scan instantly. Data is encrypted at rest and in transit, with full audit trails.', bullets: ['Session token auth', 'Role-based access control', 'Real-time processing', 'GDPR compliant logging'] },
    { icon: BarChart3, label: 'Analytics', bgClass: 'bg-sky-600', glow: '#0284c7', title: 'Live Dashboard Analytics', desc: 'Beautiful charts, daily/weekly/monthly trends, and class comparisons. Export any view to Excel in one click.', bullets: ['7-day & monthly trends', 'Class performance ranking', 'Export to Excel/CSV', 'Mobile-responsive'] },
    { icon: Bell, label: 'Parent Portal', bgClass: 'bg-blue-600', glow: '#2563eb', title: 'Real-Time Parent Visibility', desc: 'Parents see their child\'s check-in and check-out in real time. Supports multiple children per account.', bullets: ['Multi-child support', 'Per-child attendance log', 'Historical records', 'Exportable history'] },
  ];

  const steps = [
    { n: '01', icon: Wifi, title: 'Student taps RFID card', desc: 'The ESP8266/ESP32 reader detects the card and reads the unique UID in under 50ms.', bgClass: 'bg-sky-500', accent: '#0ea5e9' },
    { n: '02', icon: CloudCog, title: 'WiFi transmission to API', desc: 'The reader sends the UID, timestamp, and reader ID to the Google Apps Script endpoint over HTTPS.', bgClass: 'bg-blue-500', accent: '#3b82f6' },
    { n: '03', icon: Database, title: 'Data stored & classified', desc: 'The log is written to Google Sheets in real time — student name, class, IN/OUT status, PH-timezone timestamp.', bgClass: 'bg-sky-600', accent: '#0284c7' },
    { n: '04', icon: Monitor, title: 'Dashboard updates live', desc: 'Teachers see the attendance count update in real time. Charts, comparisons, and parent portals all reflect the new data.', bgClass: 'bg-blue-600', accent: '#2563eb' },
  ];

  const faqs = [
    { q: 'What RFID hardware is required?', a: 'Any standard 125kHz or 13.56MHz RFID card/fob works. Reader units run on ESP8266/ESP32 microcontrollers connected to your school WiFi. Setup takes under 30 minutes per unit.' },
    { q: 'How is student data protected?', a: 'All data is encrypted in transit (TLS 1.3) and at rest. Session tokens expire after 30 minutes of inactivity. No personally identifiable data is stored on the hardware itself.' },
    { q: 'Can parents access admin features?', a: "No. The parent portal is strictly read-only, scoped to their own children's records. Teachers and administrators have separate credential tiers." },
    { q: 'Can one parent account track multiple children?', a: 'Yes. A parent account can be linked to multiple students. The portal shows a child-selector to switch between individual views or see all records combined.' },
    { q: 'What happens if the WiFi goes down?', a: 'The ESP8266/ESP32 reader queues scans locally and syncs automatically when connectivity is restored. No attendance data is lost during outages.' },
    { q: 'How do I export attendance records?', a: 'Click Export on any filtered view in the Logs tab. Records download as a formatted Excel (.xlsx) file with color-coded statuses and auto-filters pre-applied.' },
  ];

  return (
    <div className={`min-h-screen overflow-x-hidden ${dark ? 'bg-[#050810] text-white' : 'bg-[#edf1f9] text-gray-900'}`}>

      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} darkMode={dark} onSignIn={() => setModal(true)} />

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${navHide ? '-translate-y-full' : 'translate-y-0'} backdrop-blur-2xl ${dark ? 'bg-[#050810]/88 border-b border-white/6' : 'bg-white/88 border-b border-black/6'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative">
              <AppLogo size="sm" />
            </div>
            <span className={`font-black text-sm tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>RFID Attendance</span>
          </div>
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {[['features', 'Features'], ['how-it-works', 'How It Works'], ['faq', 'FAQ']].map(([id, lbl]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`relative px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={toggleDark} className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-12 ${dark ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={() => setModal(true)}
              className="hidden sm:flex relative px-4 py-2 text-sm font-bold text-white rounded-xl overflow-hidden items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 group"
              style={{ background: '#0ea5e9' }}>
              <LogIn size={14} /> Sign In
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={() => setDrawer(true)} className={`md:hidden p-2 rounded-xl transition-all ${dark ? 'hover:bg-white/6 text-gray-300' : 'hover:bg-black/6 text-gray-600'}`}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative max-w-6xl mx-auto px-4 sm:px-5 pt-28 pb-20 sm:pt-36 sm:pb-24 md:pt-44 md:pb-32" style={{ zIndex: 1 }}>

        <div className="text-center max-w-4xl mx-auto space-y-5">
          <h1 className={`font-black tracking-tighter leading-[0.9] transition-all duration-700 ${heroVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ fontSize: 'clamp(2.4rem,8vw,4.8rem)', transitionDelay: '80ms' }}>
            <span className={dark ? 'text-white' : 'text-gray-900'}>School attendance,</span><br />
            <span className={dark ? 'text-sky-400' : 'text-sky-600'}>
              finally automated.
            </span>
          </h1>

          <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium transition-all duration-700 ${heroVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${dark ? 'text-gray-400' : 'text-gray-500'}`} style={{ transitionDelay: '160ms' }}>
            RFID card taps replace manual roll-calls.{' '}
            <TypedText words={TYPED_WORDS} className={`font-bold ${dark ? 'text-sky-400' : 'text-sky-600'}`} />
          </p>

          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 transition-all duration-700 ${heroVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '240ms' }}>
            <button onClick={() => setModal(true)}
              className="group relative px-7 py-4 text-sm font-bold text-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-98 flex items-center justify-center gap-2"
              style={{ background: '#0ea5e9' }}>
              <LogIn size={15} /> Access Your Portal
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={() => scrollTo('how-it-works')}
              className={`group px-7 py-4 text-sm font-bold rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-98 flex items-center justify-center gap-2 ${dark ? 'border-white/12 text-gray-300 hover:bg-white/6 hover:border-white/22' : 'border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300'}`}>
              <Play size={13} className="transition-transform group-hover:scale-110" /> See how it works
            </button>
          </div>

          {/* Trust bar */}
          <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1 transition-all duration-700 ${heroVis ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '340ms' }}>
            {[{ icon: Globe, t: 'PH Timezone' }, { icon: Zap, t: '<200ms scan' }].map((x, i) => (
              <div key={i} className={`flex items-center gap-1.5 text-xs font-semibold ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                <x.icon size={12} className="text-emerald-500" />{x.t}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className={`hidden sm:flex justify-center mt-10 transition-all duration-700 ${heroVis ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '900ms' }}>
          <button onClick={() => scrollTo('features')} className={`flex flex-col items-center gap-2 transition-opacity hover:opacity-60 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
            <div className="mouse-scroll-icon" />
          </button>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" ref={featRef} className="relative max-w-6xl mx-auto px-4 sm:px-5 py-20 sm:py-28" style={{ zIndex: 1 }}>
        <div className={`text-center mb-12 transition-all duration-700 ${featVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border mb-4 ${dark ? 'bg-sky-500/10 border-sky-500/25 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'}`}>
            <Sparkles size={11} className="animate-pulse" /> Platform Features
          </div>
          <h2 className={`font-black tracking-tight leading-tight ${dark ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: 'clamp(1.9rem,5vw,3.2rem)' }}>
            Everything you need,<br /><span className={dark ? 'text-gray-500' : 'text-gray-400'}>nothing you don't.</span>
          </h2>
        </div>

        {/* Mobile accordion */}
        <div className="md:hidden space-y-2.5">
          {features.map((f, i) => (
            <div key={i}
              className={`rounded-2xl border overflow-hidden transition-all duration-400 ${featVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${featIdx === i ? dark ? 'bg-white/6 border-white/16' : 'bg-white border-gray-200' : dark ? 'border-white/6 bg-white/[0.03]' : 'border-gray-100 bg-white/80'}`}
              style={{ transitionDelay: `${i * 60}ms` }}>
              <button onClick={() => setFeatIdx(featIdx === i ? -1 : i)} className="w-full text-left p-4 flex items-center gap-3">
                <div className={`w-9 h-9 min-w-[36px] rounded-xl flex items-center justify-center transition-all ${featIdx === i ? `${f.bgClass}` : dark ? 'bg-white/6' : 'bg-gray-100'}`}>
                  <f.icon size={15} className={featIdx === i ? 'text-white' : dark ? 'text-gray-400' : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${featIdx === i ? dark ? 'text-sky-400' : 'text-sky-600' : dark ? 'text-gray-500' : 'text-gray-400'}`}>{f.label}</p>
                  <p className={`text-sm font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{f.title}</p>
                </div>
                <ChevronDown size={15} className={`flex-shrink-0 transition-transform duration-300 ${featIdx === i ? 'rotate-180' : ''} ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-400 ${featIdx === i ? 'max-h-80' : 'max-h-0'}`}>
                <div className="px-4 pb-5 pl-16">
                  <p className={`text-sm leading-relaxed mb-3 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {f.bullets.map((b, bi) => (
                      <div key={bi} className={`flex items-start gap-1.5 text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <CheckCircle size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />{b}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop two-col */}
        <div className="hidden md:grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            {features.map((f, i) => (
              <button key={i} onClick={() => setFeatIdx(i)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${featVis ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'} ${featIdx === i
                  ? dark ? 'bg-white/6 border-white/16' : 'bg-white border-gray-200'
                  : dark ? 'border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10' : 'border-transparent hover:bg-white hover:border-gray-100'}`}
                style={{ transitionDelay: `${i * 55}ms` }}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${featIdx === i ? `${f.bgClass}` : dark ? 'bg-white/6' : 'bg-gray-100'}`}>
                    <f.icon size={15} className={featIdx === i ? 'text-white' : dark ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${featIdx === i ? dark ? 'text-sky-400' : 'text-sky-600' : dark ? 'text-gray-500' : 'text-gray-400'}`}>{f.label}</p>
                    <p className={`text-sm font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{f.title}</p>
                  </div>
                  <ChevronRight size={15} className={`flex-shrink-0 transition-all duration-300 ${featIdx === i ? 'opacity-100 text-sky-500' : 'opacity-0'}`} />
                </div>
                {featIdx === i && (
                  <div className="mt-3 pl-12 animate-expand-down">
                    <p className={`text-sm leading-relaxed mb-3 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {f.bullets.map((b, bi) => (
                        <div key={bi} className={`flex items-center gap-1.5 text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />{b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className={`sticky top-24 rounded-3xl border overflow-hidden transition-all duration-700 ${featVis ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} ${dark ? 'bg-gray-900/60 border-white/8' : 'bg-white border-gray-200'}`}
            style={{ minHeight: 360, transitionDelay: '200ms' }}>
            {features.map((f, i) => (
              <div key={i} className={`transition-all duration-500 ${featIdx === i ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
                <div className="p-7">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${f.bgClass}`}>
                    <f.icon size={26} className="text-white" />
                  </div>
                  <h3 className={`text-xl font-black mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed mb-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
                  <div className="space-y-2">
                    {f.bullets.map((b, bi) => (
                      <div key={bi} className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:-translate-y-px ${dark ? 'border-white/6 bg-white/[0.03] hover:bg-white/6' : 'border-gray-100 bg-slate-50 hover:bg-white hover:border-gray-200'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${f.bgClass}`}><CheckCircle size={12} className="text-white" /></div>
                        <span className={`text-sm font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" ref={howRef} className={`relative py-20 sm:py-28 ${dark ? 'bg-white/[0.02]' : 'bg-white'}`} style={{ zIndex: 1 }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: dark ? 'linear-gradient(90deg,transparent,rgba(148,163,184,0.1),transparent)' : 'linear-gradient(90deg,transparent,rgba(100,116,139,0.13),transparent)' }} />
        <div className="max-w-3xl mx-auto px-4 sm:px-5">
          <div className={`text-center mb-12 transition-all duration-700 ${howVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border mb-4 ${dark ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              <Zap size={11} /> The Process
            </div>
            <h2 className={`font-black tracking-tight leading-tight ${dark ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: 'clamp(1.9rem,5vw,3.2rem)' }}>
              Tap to dashboard<br />
              <span style={{ background: '#10b981', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>in 200 milliseconds.</span>
            </h2>
          </div>
          <div className="relative">
            <div className={`absolute w-px transition-opacity duration-700 bg-sky-400 ${howVis ? 'opacity-100' : 'opacity-0'}`}
              style={{ left: 31, top: 32, bottom: 32 }} />
            <div className="space-y-5">
              {steps.map((s, i) => (
                <div key={i}
                  className={`relative flex gap-4 items-start group transition-all duration-700 ${howVis ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                  style={{ transitionDelay: `${i * 110}ms` }}>
                  <div className={`relative z-10 flex-shrink-0 w-[62px] h-[62px] rounded-2xl flex items-center justify-center ${s.bgClass} transition-all duration-300 group-hover:scale-105 group-hover:rotate-2`}>
                    <s.icon size={22} className="text-white" />
                    <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center border-2 ${dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} style={{ color: s.accent }}>{i + 1}</div>
                  </div>
                  <div className={`flex-1 min-w-0 p-4 sm:p-5 rounded-2xl border transition-all duration-300 group-hover:-translate-y-0.5 ${dark ? 'bg-white/[0.03] border-white/6 hover:border-white/12 hover:bg-white/5' : 'bg-slate-50/80 border-gray-100 hover:border-gray-200 hover:bg-white'}`}>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: s.accent }}>Step {s.n}</p>
                    <h3 className={`text-sm sm:text-base font-black mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{s.title}</h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS ── */}
      <section ref={metRef} className="relative py-14 sm:py-16" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: 500, suffix: '+', label: 'Students tracked', accent: '#0ea5e9' },
              { to: 99, suffix: '.9%', label: 'Scan accuracy', accent: '#10b981' },
              { to: 200, prefix: '<', suffix: 'ms', label: 'Response time', accent: '#0284c7' },
              { to: 24, suffix: '/7', label: 'System availability', accent: '#3b82f6' },
            ].map((m, i) => (
              <div key={i}
                className={`p-5 sm:p-6 rounded-2xl border text-center transition-all duration-500 hover:-translate-y-1 ${metVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${dark ? 'bg-white/[0.04] border-white/8 hover:border-white/16' : 'bg-white border-gray-100'}`}
                style={{ transitionDelay: `${i * 80}ms` }}>
                <p className="text-3xl sm:text-4xl font-black tabular-nums mb-1" style={{ color: m.accent }}>
                  <CountUp to={m.to} suffix={m.suffix} prefix={m.prefix} />
                </p>
                <p className={`text-xs font-bold ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section ref={secRef} className={`relative py-14 sm:py-20 ${dark ? 'bg-white/[0.02]' : 'bg-white'}`} style={{ zIndex: 1 }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: dark ? 'linear-gradient(90deg,transparent,rgba(148,163,184,0.1),transparent)' : 'linear-gradient(90deg,transparent,rgba(100,116,139,0.13),transparent)' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-5">
          <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 transition-all duration-700 bg-slate-900 border ${dark ? 'border-white/10' : 'border-gray-800'} ${secVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center"><Shield size={15} className="text-sky-400" /></div>
                  <span className="text-sky-400 text-xs font-black uppercase tracking-widest">Enterprise Security</span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 leading-tight">Your data stays yours.</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">Every request is authenticated with a rotating session token. Connections use TLS 1.3. No attendance data is stored on the hardware — only the school's backend holds student records.</p>
                <div className="flex flex-wrap gap-2">
                  {['Zero hardware storage', 'Role-based access', 'Encrypted at rest'].map(t => (
                    <span key={t} className="text-xs px-3 py-1.5 rounded-xl font-bold bg-white/6 text-gray-300 border border-white/10">{t}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield, label: 'TLS 1.3 Encryption', val: '256-bit', accent: '#0ea5e9' },
                  { icon: ShieldCheck, label: 'Session Timeout', val: '30 min', accent: '#10b981' },
                  { icon: Database, label: 'Data Isolation', val: 'Per-role', accent: '#0284c7' },
                  { icon: CheckCircle, label: 'Audit Logs', val: 'Full trail', accent: '#3b82f6' },
                ].map((x, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/[0.05] border border-white/8 hover:bg-white/[0.09] hover:border-white/15 transition-all duration-200 hover:-translate-y-0.5 group cursor-default">
                    <x.icon size={15} className="mb-2 transition-transform group-hover:scale-110" style={{ color: x.accent }} />
                    <p className="text-white font-black text-base sm:text-lg">{x.val}</p>
                    <p className="text-gray-500 text-xs mt-0.5 font-medium">{x.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" ref={faqRef} className="relative max-w-3xl mx-auto px-4 sm:px-5 py-20 sm:py-28" style={{ zIndex: 1 }}>
        <div className={`text-center mb-10 transition-all duration-700 ${faqVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border mb-4 ${dark ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>Common Questions</div>
          <h2 className={`font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)' }}>Got questions?</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i}
              className={`rounded-2xl border overflow-hidden transition-all duration-500 ${faqVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${openFaq === i
                ? dark ? 'bg-white/5 border-white/14' : 'bg-white border-gray-200'
                : dark ? 'border-white/[0.05] bg-white/[0.025] hover:border-white/10' : 'border-gray-100 bg-white/80 hover:bg-white hover:border-gray-200'}`}
              style={{ transitionDelay: `${i * 55}ms` }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 group">
                <span className={`font-bold text-sm leading-snug flex-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{f.q}</span>
                <div className={`w-7 h-7 min-w-[28px] rounded-xl flex items-center justify-center transition-all duration-300 ${openFaq === i ? 'bg-sky-500 rotate-180' : dark ? 'bg-white/6 group-hover:bg-white/10' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                  <ChevronDown size={14} className={openFaq === i ? 'text-white' : dark ? 'text-gray-400' : 'text-gray-500'} />
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-350 ${openFaq === i ? 'max-h-56 pb-5' : 'max-h-0'}`}>
                <p className={`px-4 sm:px-5 text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`relative border-t py-10 sm:py-12 ${dark ? 'border-white/6 bg-black/25' : 'border-gray-100 bg-white'}`} style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-5">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3"><AppLogo size="sm" /><span className={`font-black text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>RFID Attendance</span></div>
              <p className={`text-xs leading-relaxed ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Modern attendance management for Philippine schools. Built on proven hardware and cloud infrastructure.</p>
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Quick Links</p>
              <div className="space-y-2">
                {[['features', 'Features'], ['how-it-works', 'How It Works'], ['faq', 'FAQ']].map(([id, l]) => (
                  <button key={id} onClick={() => scrollTo(id)} className={`block text-xs font-semibold transition-colors ${dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className={`border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${dark ? 'border-white/6 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
            <p>© {new Date().getFullYear()} RFID Attendance Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── LOGIN MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setModal(false)} />
          <div className={`relative w-full max-w-md rounded-3xl animate-modal-up mx-4 overflow-hidden ${dark ? 'bg-[#090e1c] border border-white/12' : 'bg-white border border-gray-200/80'}`}>
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className={`w-10 h-1 rounded-full ${dark ? 'bg-white/15' : 'bg-gray-200'}`} />
            </div>
            <div className="p-5 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <AppLogo size="sm" />
                  <div>
                    <h2 className={`text-base sm:text-lg font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Welcome back</h2>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Sign in to your portal</p>
                  </div>
                </div>
                <button onClick={() => setModal(false)} className={`p-2 rounded-xl transition-all hover:scale-110 hover:rotate-90 ${dark ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={18} /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                  <input type="text" value={user} onChange={e => setUser(e.target.value)} placeholder="Enter username" className={inp} required disabled={loading} autoComplete="username" />
                </div>
                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter password" className={`${inp} pr-12`} required disabled={loading} autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(p => !p)} className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all hover:scale-110 ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {err && (
                  <div className={`flex items-center gap-2 px-3.5 py-3 rounded-xl text-sm animate-shake border ${dark ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    <AlertCircle size={15} className="flex-shrink-0" />{err}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-4 text-white font-bold rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden group transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                  style={{ background: '#0ea5e9' }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; -webkit-tap-highlight-color: transparent; }
        body, html { font-family: 'Inter', sans-serif; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        @media (max-width: 767px) { input, select, textarea { font-size: 16px !important; } }

        @keyframes modal-up   { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes slide-left { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
        @keyframes shake      { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes expand-down{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes marquee    { from{transform:translateX(0)} to{transform:translateX(-25%)} }
        @keyframes slow-pulse { 0%,100%{opacity:0.16} 50%{opacity:0.32} }
        @keyframes spin-24    { to{transform:rotate(360deg)}  }
        @keyframes spin-18r   { to{transform:rotate(-360deg)} }
        @keyframes scroll-m   { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(7px);opacity:0.3} }

        .animate-modal-up    { animation: modal-up 0.34s cubic-bezier(0.34,1.5,0.64,1) both; }
        .animate-slide-left  { animation: slide-left 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-shake       { animation: shake 0.42s ease-out; }
        .animate-expand-down { animation: expand-down 0.28s ease-out both; }
        .animate-slow-pulse  { animation: slow-pulse 3.5s ease-in-out infinite; }
        .animate-spin-24     { animation: spin-24  24s linear infinite; }
        .animate-spin-18-rev { animation: spin-18r 18s linear infinite; }

        .mouse-scroll-icon {
          width: 22px; height: 34px; border-radius: 11px;
          border: 2px solid currentColor; position: relative; opacity: 0.45;
        }
        .mouse-scroll-icon::after {
          content:''; position:absolute; top:5px; left:50%;
          transform:translateX(-50%); width:3px; height:6px;
          border-radius:2px; background:currentColor;
          animation: scroll-m 1.6s ease-in-out infinite;
        }

        .odometer, .odometer .odometer-digit { font-family:'Inter',sans-serif !important; }
        section { isolation: isolate; }

        /* Safe area support (iPhone notch/home bar) */
        nav { padding-top: env(safe-area-inset-top, 0px); }
        footer { padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); }
      `}</style>
    </div>
  );
}