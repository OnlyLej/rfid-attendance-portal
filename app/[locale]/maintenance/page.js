'use client';
import { useEffect, useState } from 'react';
import { useDarkMode } from '../../_lib/usePageLayout';
import { Settings, Clock, AlertCircle } from 'lucide-react';

export default function MaintenancePage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDarkMode(true);
  }, []);

  const toggleDark = () => {
    const n = !darkMode;
    setDarkMode(n);
    document.documentElement.classList.toggle('dark', n);
    localStorage.setItem('theme', n ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      darkMode ? 'bg-[#080c14] text-white' : 'bg-slate-50 text-gray-900'
    }`}>
      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className={`fixed top-4 right-4 p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-12 z-50 ${
          darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'
        }`}
      >
        {darkMode ? <Settings size={20} /> : <Settings size={20} />}
      </button>

      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Icon */}
        <div className={`mb-8 inline-flex items-center justify-center w-24 h-24 rounded-3xl ${
          darkMode ? 'bg-amber-500/10' : 'bg-amber-50'
        }`}>
          <Clock size={48} className={darkMode ? 'text-amber-400' : 'text-amber-500'} />
        </div>

        {/* Heading */}
        <h1 className={`text-4xl sm:text-5xl font-black mb-4 tracking-tight ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Under Maintenance
        </h1>

        {/* Subtitle */}
        <p className={`text-lg sm:text-xl mb-6 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          We're performing scheduled maintenance to improve your experience.
        </p>

        {/* Info box */}
        <div className={`p-6 rounded-2xl border mb-8 ${
          darkMode ? 'bg-white/[0.03] border-white/8' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              darkMode ? 'bg-sky-500/10' : 'bg-sky-50'
            }`}>
              <AlertCircle size={20} className={darkMode ? 'text-sky-400' : 'text-sky-500'} />
            </div>
            <div className="text-left">
              <p className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                What's happening?
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                We're upgrading our systems to bring you better performance and new features. 
                This maintenance is temporary and we'll be back shortly.
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          darkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'
        }`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          </span>
          System temporarily unavailable
        </div>

        {/* Footer */}
        <p className={`mt-12 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          © 2026 RFID Attendance Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}
