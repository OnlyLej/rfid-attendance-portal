'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../_lib/AppContext';
import LandingPage from '../_components/LandingPage';
import { useLocale } from 'next-intl';

export default function Home() {
  const { authenticated, userType, mounted } = useApp();
  const router = useRouter();
  const locale = useLocale();
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);

  // Check for demo mode and show confirmation if needed
  useEffect(() => {
    if (!mounted) return;
    
    const isDemoMode = sessionStorage.getItem('isDemoMode') === 'true';
    const hasDemoToken = sessionStorage.getItem('sessionToken') === 'demo-token';
    
    if (isDemoMode && hasDemoToken) {
      setShowDemoConfirm(true);
    }
  }, [mounted]);

  // Redirect already-logged-in users to their home
  useEffect(() => {
    if (!mounted || !authenticated) return;
    
    // Check if in demo mode - don't redirect if so
    const isDemoMode = sessionStorage.getItem('isDemoMode') === 'true';
    const hasDemoToken = sessionStorage.getItem('sessionToken') === 'demo-token';
    if (isDemoMode && hasDemoToken) return;
    
    if (userType === 'teacher') router.replace(`/${locale}/dashboard`);
    else if (userType === 'parent') router.replace(`/${locale}/parent`);
  }, [mounted, authenticated, userType, router, locale]);

  const handleExitDemo = () => {
    sessionStorage.removeItem('isDemoMode');
    sessionStorage.removeItem('demoData');
    sessionStorage.removeItem('sessionToken');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('loginTime');
    setShowDemoConfirm(false);
    window.location.reload();
  };

  const handleReturnToDemo = () => {
    router.replace(`/${locale}/demo`);
  };

  if (!mounted) return null;
  if (authenticated && !showDemoConfirm) return null; // will redirect

  return (
    <>
      <LandingPage />
      
      {showDemoConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
          <div className={`relative w-full max-w-sm rounded-2xl border overflow-hidden bg-white border-gray-200`} style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
            <div className="p-7 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-black mb-2 text-gray-900">Demo Mode Active</h3>
              <p className="text-sm mb-6 text-gray-500">You're currently in demo mode. Would you like to return to the demo or exit?</p>
              <div className="flex gap-2.5">
                <button onClick={handleExitDemo} className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95 border-gray-200 text-gray-600 hover:bg-gray-50">Exit Demo</button>
                <button onClick={handleReturnToDemo} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95" style={{ background: '#7c3aed' }}>Return to Demo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
