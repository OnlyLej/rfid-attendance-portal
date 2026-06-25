'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe, Check } from 'lucide-react';
import { locales } from '../_lib/locales';

export default function LanguageSwitcher({ darkMode }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const switchLocale = (newLocale) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = locales.find(l => l.code === locale) ?? locales[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105
          ${darkMode ? 'hover:bg-white/8 text-gray-400 hover:text-gray-200' : 'hover:bg-black/6 text-gray-500 hover:text-gray-700'}`}
        title="Switch Language"
      >
        <Globe size={14} />
        <span className="uppercase tracking-wide">{current.code}</span>
      </button>

      <div className={`absolute right-0 top-full mt-1.5 w-44 rounded-xl border shadow-lg overflow-hidden
        transition-all duration-150 z-[70]
        ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}
      >
        <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border-b
          ${darkMode ? 'text-gray-500 border-white/6' : 'text-gray-400 border-gray-100'}`}>
          Language
        </div>

        <div className="max-h-48 overflow-y-auto">
          {locales.map(lang => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors
                ${locale === lang.code
                  ? darkMode ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'
                  : darkMode ? 'text-gray-300 hover:bg-white/6' : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-semibold leading-tight">{lang.label}</span>
                {lang.native !== lang.label && (
                  <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {lang.native}
                  </span>
                )}
              </div>
              {locale === lang.code && <Check size={13} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
