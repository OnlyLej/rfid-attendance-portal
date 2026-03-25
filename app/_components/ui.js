/**
 * ui.jsx — Shared design-system primitives
 * Import from this file in every tab/component.
 *
 * Exports:
 *   ToastProvider, useToast
 *   Skeleton, SkeletonCard, ChartSkeleton
 *   Card
 *   Tooltip
 *   Pagination
 *   RateRing
 *   AnimatedNumber
 *   FilterChip
 *   StatusBadge
 *   EmptyState
 */

'use client';

import {
  createContext, useContext, useState, useEffect, useRef, useCallback, useId,
} from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   TOAST SYSTEM
   Usage:
     wrap app in <ToastProvider darkMode={...} />
     const { toast } = useToast();
     toast.success('Saved!');
     toast.error('Something went wrong');
     toast.info('Refreshing…');
     toast.warn('Low attendance today');
═══════════════════════════════════════════════════════════ */

const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}

function ToastItem({ id, type, title, body, darkMode, onDismiss, duration = 4000 }) {
  const [visible, setVisible]   = useState(false);
  const [leaving, setLeaving]   = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef  = useRef(null);
  const rafRef    = useRef(null);
  const pausedRef = useRef(false);
  const elapsed   = useRef(0);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(id), 320);
  }, [id, onDismiss]);

  // Mount entrance
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // Auto-dismiss with pausable progress bar
  useEffect(() => {
    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      if (!pausedRef.current) elapsed.current += ts - (startRef.current);
      startRef.current = ts;
      const pct = Math.max(0, 100 - (elapsed.current / duration) * 100);
      setProgress(pct);
      if (pct <= 0) { dismiss(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, dismiss]);

  const iconMap = {
    success: { Icon: CheckCircle, color: '#10b981', bg: 'bg-emerald-500/12 border-emerald-500/20', bar: '#10b981' },
    error:   { Icon: XCircle,     color: '#f43f5e', bg: 'bg-rose-500/12 border-rose-500/20',       bar: '#f43f5e' },
    warn:    { Icon: AlertTriangle,color: '#f59e0b', bg: 'bg-amber-500/12 border-amber-500/20',    bar: '#f59e0b' },
    info:    { Icon: Info,         color: '#0ea5e9', bg: 'bg-sky-500/12 border-sky-500/20',         bar: '#0ea5e9' },
  };
  const cfg = iconMap[type] || iconMap.info;

  return (
    <div
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; startRef.current = null; }}
      className={`relative w-full max-w-sm overflow-hidden rounded-2xl border backdrop-blur-xl
        transition-all duration-300 ease-out cursor-default select-none
        ${cfg.bg}
        ${darkMode ? 'shadow-[0_8px_32px_rgba(0,0,0,0.45)]' : 'shadow-[0_8px_32px_rgba(0,0,0,0.18)]'}
        ${visible && !leaving ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'}`}
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-0.5 rounded-full transition-none"
        style={{ width: `${progress}%`, background: cfg.bar, boxShadow: `0 0 6px ${cfg.bar}88` }}
      />

      <div className="flex items-start gap-3 p-4">
        <cfg.Icon size={17} className="flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-black leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
          {body && <p className={`text-xs mt-0.5 leading-snug ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{body}</p>}
        </div>
        <button
          onClick={dismiss}
          className={`p-1 rounded-lg flex-shrink-0 transition-all hover:scale-110 active:scale-90 mt-0.5
            ${darkMode ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300' : 'hover:bg-black/8 text-gray-400 hover:text-gray-600'}`}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children, darkMode }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type, title, body, duration) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, body, duration }]);
    return id;
  }, []);

  const toast = {
    success: (title, body, dur) => add('success', title, body, dur),
    error:   (title, body, dur) => add('error',   title, body, dur),
    warn:    (title, body, dur) => add('warn',     title, body, dur),
    info:    (title, body, dur) => add('info',     title, body, dur),
  };

  return (
    <ToastCtx.Provider value={{ toast }}>
      <UIStyles />
      {children}
      {/* Toast stack — bottom-right on desktop, bottom-center on mobile */}
      <div
        className="fixed z-[999] flex flex-col gap-2.5 pointer-events-none"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)',
          right: '1.25rem',
          left: 'auto',
          width: '360px',
          maxWidth: 'calc(100vw - 2.5rem)',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} darkMode={darkMode} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════
   SKELETON SHIMMER
═══════════════════════════════════════════════════════════ */

export function Skeleton({ darkMode, className = '', style = {} }) {
  // The shimmer gradient is the visual. Height comes from className (Tailwind) or style prop.
  // We do NOT set minHeight here — Tailwind h-* classes must win.
  const base  = darkMode ? 'rgba(255,255,255,0.06)' : '#eaeef4';
  const shine = darkMode ? 'rgba(255,255,255,0.13)' : '#d8dfe9';
  return (
    <div
      className={`rounded-xl block ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg,${base} 0%,${shine} 40%,${base} 100%)`,
        backgroundSize: '300% 100%',
        animation: 'sk-shimmer 1.8s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ darkMode, rows = 3, showHeader = true }) {
  return (
    <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
      {showHeader && (
        <div className="flex items-center gap-3 mb-5">
          <Skeleton darkMode={darkMode} style={{ width: 32, height: 32, borderRadius: 12 }} />
          <Skeleton darkMode={darkMode} style={{ height: 16, width: 144, borderRadius: 8 }} />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} darkMode={darkMode} style={{ height: 16, width: `${85 - i * 12}%`, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ darkMode, height = 240 }) {
  const bars = [0.45, 0.72, 0.55, 0.88, 0.63, 0.82, 0.50, 0.70];
  const usableH = height - 24; // subtract label row
  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
        {bars.map((ratio, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <Skeleton
              darkMode={darkMode}
              style={{
                height: `${Math.round(ratio * usableH)}px`,
                borderRadius: '6px 6px 0 0',
                width: '100%',
                animationDelay: `${i * 80}ms`,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {bars.map((_, i) => (
          <Skeleton key={i} darkMode={darkMode} style={{ flex: 1, height: '10px', borderRadius: '999px', animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton({ darkMode }) {
  return (
    <div className={`border rounded-2xl p-5 ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-sm'}`}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton darkMode={darkMode} style={{ width: 40, height: 40, borderRadius: 12 }} />
        <Skeleton darkMode={darkMode} style={{ width: 48, height: 20, borderRadius: 999 }} />
      </div>
      <Skeleton darkMode={darkMode} style={{ height: 12, width: 80, borderRadius: 6, marginBottom: 8 }} />
      <Skeleton darkMode={darkMode} style={{ height: 32, width: 64, borderRadius: 8 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CARD
═══════════════════════════════════════════════════════════ */

export function Card({ children, className = '', darkMode, hover = false, delay = 0 }) {
  const [visible, setVisible] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`border rounded-2xl backdrop-blur-sm transition-all duration-500 ease-out
        ${darkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white border-gray-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)]'}
        ${hover ? darkMode
          ? 'hover:bg-white/[0.07] hover:border-white/16 hover:shadow-xl hover:-translate-y-0.5'
          : 'hover:border-gray-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5'
          : ''}
        ${delay > 0 ? (visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4') : ''}
        ${className}`}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOOLTIP
═══════════════════════════════════════════════════════════ */

export function Tooltip({ label, children, darkMode, side = 'bottom' }) {
  const [show, setShow] = useState(false);
  const posClass = side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <div
        className={`absolute ${posClass} left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg
          text-xs font-bold whitespace-nowrap pointer-events-none z-[70]
          transition-all duration-150 ease-out
          ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
        style={{ background: '#111827', color: '#f9fafb', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
      >
        {label}
        {side === 'bottom' && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: '#111827' }} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════════════════════ */

export function Pagination({ currentPage, totalPages, onPageChange, darkMode }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i);
    }
  }
  const withEllipsis = [];
  let prev = null;
  for (const p of pages) {
    if (prev && p - prev > 1) withEllipsis.push('...');
    withEllipsis.push(p);
    prev = p;
  }

  const base  = 'inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95';
  const act   = darkMode ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/30' : 'bg-sky-500 text-white shadow-sm shadow-sky-500/25';
  const inact = darkMode ? 'text-gray-400 hover:bg-white/8' : 'text-gray-600 hover:bg-gray-100';
  const navB  = darkMode ? 'text-gray-500 hover:bg-white/8 disabled:opacity-25' : 'text-gray-400 hover:bg-gray-100 disabled:opacity-25';

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`${base} ${navB}`}>
        <ChevronLeft size={15} />
      </button>
      {withEllipsis.map((p, i) =>
        p === '...'
          ? <span key={i} className={`${base} cursor-default ${inact}`}>…</span>
          : <button key={i} onClick={() => onPageChange(p)} className={`${base} ${currentPage === p ? act : inact}`}>{p}</button>
      )}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`${base} ${navB}`}>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RATE RING  (SVG circular progress)
═══════════════════════════════════════════════════════════ */

export function RateRing({ rate, size = 44, darkMode, strokeWidth = 3.5 }) {
  const r    = (size / 2) - strokeWidth - 1;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.max(0, Math.min(1, rate / 100)) * circ;
  const color  = rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={strokeWidth}
        stroke={darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={strokeWidth}
        stroke={color} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.85s cubic-bezier(0.34,1.1,0.64,1), stroke 0.4s' }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED NUMBER
═══════════════════════════════════════════════════════════ */

export function AnimatedNumber({ value, duration = 600, className = '' }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef  = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const from = prevRef.current;
    prevRef.current = value;
    if (from === value) { setDisplay(value); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * ease));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else setDisplay(value);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}

/* ═══════════════════════════════════════════════════════════
   FILTER CHIP
═══════════════════════════════════════════════════════════ */

export function FilterChip({ label, onRemove, darkMode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full
        text-xs font-bold border transition-all duration-200 hover:scale-105
        ${darkMode
          ? 'bg-sky-500/12 border-sky-500/25 text-sky-400'
          : 'bg-sky-50 border-sky-200/80 text-sky-600'
        }`}
    >
      {label}
      <button
        onClick={onRemove}
        className={`p-0.5 rounded-full transition-all hover:scale-110 active:scale-90
          ${darkMode ? 'hover:bg-sky-500/20' : 'hover:bg-sky-100'}`}
      >
        <X size={10} />
      </button>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATUS BADGE
═══════════════════════════════════════════════════════════ */

export function StatusBadge({ status }) {
  const isIn = status === 'IN';
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 text-xs px-2.5 py-1
        rounded-full font-bold border
        ${isIn
          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
        }`}
    >
      <span className={`relative w-1.5 h-1.5 rounded-full ${isIn ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════ */

export function EmptyState({ icon: Icon, title, body, action, actionLabel, darkMode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
        <Icon size={26} className={darkMode ? 'text-gray-700' : 'text-gray-300'} />
      </div>
      <p className={`text-sm font-black ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{title}</p>
      {body && <p className={`text-xs mt-1.5 max-w-xs leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{body}</p>}
      {action && (
        <button
          onClick={action}
          className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/25"
          style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ── Global keyframes — rendered as a real <style> tag ── */
export function UIStyles() {
  // React 18 + Next.js App Router: plain <style> with dangerouslySetInnerHTML
  // is the safest cross-environment way to inject global keyframes.
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes sk-shimmer {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes sk-fade-in {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: none; }
          }
        `,
      }}
    />
  );
}
