'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp,
  Copy, Check, Wifi, Database, Shield, Zap, Bug,
} from 'lucide-react';

const SUGGESTIONS = [
  { icon: Wifi,     label: 'Connection issue',   tip: 'Check your internet connection and try refreshing.' },
  { icon: Database, label: 'Data load failed',    tip: 'The Google Apps Script may be temporarily unavailable.' },
  { icon: Shield,   label: 'Session expired',     tip: 'Your session may have timed out. Try signing in again.' },
  { icon: Zap,      label: 'Unexpected crash',    tip: 'A component encountered an unhandled error. Refresh to recover.' },
];

// Report error to server-side Discord logger (non-blocking, best-effort)
async function reportError(error) {
  try {
    const token = process.env.NEXT_PUBLIC_ERROR_REPORT_TOKEN;
    if (!token) return; // not configured — skip silently
    await fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-error-token': token,
      },
      body: JSON.stringify({
        message:   error?.message  || 'Unknown error',
        stack:     error?.stack    || '',
        digest:    error?.digest   || '',
        url:       window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silently fail — never let reporting crash the error page
  }
}


export default function GlobalError({ error, reset }) {
  const router = useRouter();
  const [darkMode,    setDarkMode]    = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [spinning,    setSpinning]    = useState(false);
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDarkMode(localStorage.getItem('theme') === 'dark');
    } catch {}
    // Send error report to Discord (once on mount, fire-and-forget)
    reportError(error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const errorText = error?.message || 'An unexpected error occurred.';
  const errorStack = error?.stack || '';
  const digestText = error?.digest ? `Digest: ${error.digest}` : '';

  const handleReset = () => {
    setSpinning(true);
    setTimeout(() => { setSpinning(false); reset(); }, 600);
  };

  const handleCopy = () => {
    const text = [errorText, digestText, errorStack].filter(Boolean).join('\n\n');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const dk = darkMode;

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Sora', 'Inter', sans-serif" }}>
        <div
          className={`min-h-screen flex flex-col items-center justify-center px-4 py-12 transition-colors duration-300`}
          style={{ background: dk ? '#0f1117' : '#f8fafc' }}
        >
          {/* Card */}
          <div
            className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{
              background: dk ? '#0d1220' : '#ffffff',
              border: dk ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: dk ? '0 32px 80px rgba(0,0,0,0.5)' : '0 16px 60px rgba(0,0,0,0.12)',
              animation: 'err-up 0.4s cubic-bezier(0.34,1.5,0.64,1) both',
            }}
          >

            <div style={{ padding: '2rem' }}>
              {/* Icon + title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertTriangle size={24} color="#f43f5e" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: dk ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em' }}>
                    Something went wrong
                  </h1>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: dk ? '#64748b' : '#94a3b8', lineHeight: 1.5 }}>
                    {errorText.length > 120 ? errorText.slice(0, 120) + '…' : errorText}
                  </p>
                  {digestText && (
                    <p style={{ margin: '4px 0 0', fontSize: 11, fontFamily: 'monospace', color: dk ? '#475569' : '#94a3b8' }}>
                      {digestText}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleReset}
                  style={{
                    flex: 1, minWidth: 120, padding: '12px 20px',
                    borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: '#0ea5e9',
                    color: 'white', fontWeight: 800, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'opacity 0.2s, transform 0.15s',
                    boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <RefreshCw size={14} style={{ animation: spinning ? 'spin 0.6s linear' : 'none' }} />
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/')}
                  style={{
                    flex: 1, minWidth: 120, padding: '12px 20px',
                    borderRadius: 14, cursor: 'pointer', fontWeight: 800, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'transparent',
                    border: dk ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    color: dk ? '#cbd5e1' : '#475569',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Home size={14} /> Go Home
                </button>
              </div>

              {/* Possible causes */}
              <div style={{
                borderRadius: 16, padding: '1rem',
                background: dk ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: dk ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                marginBottom: '1rem',
              }}>
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: dk ? '#475569' : '#94a3b8' }}>
                  Possible causes
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {SUGGESTIONS.map(({ icon: Icon, label, tip }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
                        <Icon size={13} color={dk ? '#64748b' : '#94a3b8'} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: dk ? '#cbd5e1' : '#374151' }}>{label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: dk ? '#475569' : '#94a3b8', lineHeight: 1.4 }}>{tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible error details */}
              {errorStack && (
                <div>
                  <button
                    onClick={() => setShowDetails(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
                      fontSize: 12, fontWeight: 700, color: dk ? '#475569' : '#94a3b8',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bug size={13} /> Technical details
                    </span>
                    {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {showDetails && (
                    <div style={{ position: 'relative', marginTop: 8 }}>
                      <pre style={{
                        margin: 0, padding: '12px 14px',
                        borderRadius: 12, fontSize: 10, lineHeight: 1.6,
                        overflowX: 'auto', maxHeight: 180,
                        background: dk ? 'rgba(0,0,0,0.4)' : '#f8fafc',
                        border: dk ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
                        color: dk ? '#94a3b8' : '#64748b',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}>
                        {errorStack}
                      </pre>
                      <button
                        onClick={handleCopy}
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          background: dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          border: 'none', borderRadius: 8, padding: '4px 8px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 10, fontWeight: 700, color: dk ? '#94a3b8' : '#64748b',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 24px',
              borderTop: dk ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: dk ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.01)',
            }}>
              <span style={{ fontSize: 11, color: dk ? '#334155' : '#cbd5e1', fontWeight: 600 }}>
                RFID Attendance Portal
              </span>
            </div>
          </div>

          {/* Hint */}
          <p style={{ marginTop: 16, fontSize: 12, color: dk ? '#1e293b' : '#cbd5e1', textAlign: 'center' }}>
            If this keeps happening, check the browser console for more details.
          </p>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
          *, *::before, *::after { box-sizing: border-box; }
          body { font-family: 'Sora', sans-serif; }
          @keyframes err-up { from { opacity:0; transform: translateY(20px) scale(0.97); } to { opacity:1; transform: none; } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </body>
    </html>
  );
}
