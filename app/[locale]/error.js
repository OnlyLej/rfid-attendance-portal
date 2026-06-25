'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function LocaleError({ error, reset }) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try { setDarkMode(localStorage.getItem('theme') === 'dark'); } catch {}
  }, []);

  const dk = darkMode;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: dk ? '#0f1117' : '#f8fafc' }}
    >
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: dk ? '#0d1220' : '#ffffff',
          border: dk ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: dk ? '0 32px 80px rgba(0,0,0,0.5)' : '0 16px 60px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={24} color="#f43f5e" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: dk ? '#f1f5f9' : '#0f172a' }}>
                Something went wrong
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: dk ? '#64748b' : '#94a3b8' }}>
                {error?.message?.slice(0, 120) || 'An unexpected error occurred.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={reset}
              style={{
                flex: 1, padding: '12px 20px', borderRadius: 14, border: 'none',
                cursor: 'pointer', background: '#0ea5e9', color: 'white',
                fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              <RefreshCw size={14} /> Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                flex: 1, padding: '12px 20px', borderRadius: 14, cursor: 'pointer',
                fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, background: 'transparent',
                border: dk ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                color: dk ? '#cbd5e1' : '#475569',
              }}
            >
              <Home size={14} /> Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}