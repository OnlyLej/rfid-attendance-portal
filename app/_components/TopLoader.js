'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function startPageLoad() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('page-loading-start'));
}

function TopLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const firstRun = useRef(true);

  const start = () => {
    clearInterval(timerRef.current);
    setVisible(true);
    setProgress(12);
    timerRef.current = setInterval(() => {
      setProgress(p => (p < 88 ? p + (88 - p) * 0.12 : p));
    }, 180);
  };

  const finish = () => {
    clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => { setVisible(false); setProgress(0); }, 260);
  };

  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || a.target === '_blank') return;
      if (href !== window.location.pathname) start();
    };
    document.addEventListener('click', onClick);
    window.addEventListener('page-loading-start', start);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('page-loading-start', start);
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    finish();
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[3px] pointer-events-none">
      <div
        className="h-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  );
}