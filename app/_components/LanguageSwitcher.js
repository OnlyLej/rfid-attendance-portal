'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ darkMode }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale) => {
    // Remove the current locale from pathname and add the new one
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <div className="relative group">
      <button
        className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${darkMode ? 'hover:bg-white/6 text-gray-400' : 'hover:bg-black/6 text-gray-500'}`}
        title="Switch Language"
      >
        <Globe size={17} />
      </button>
      <div className={`absolute right-0 top-full mt-2 w-32 rounded-xl border overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70] ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`}>
        <button
          onClick={() => switchLocale('en')}
          className={`w-full px-3 py-2 text-left text-sm font-semibold transition-colors ${locale === 'en' ? 'bg-sky-500/10 text-sky-500' : darkMode ? 'text-gray-300 hover:bg-white/6' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          English
        </button>
        <button
          onClick={() => switchLocale('fil')}
          className={`w-full px-3 py-2 text-left text-sm font-semibold transition-colors ${locale === 'fil' ? 'bg-sky-500/10 text-sky-500' : darkMode ? 'text-gray-300 hover:bg-white/6' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          Filipino
        </button>
      </div>
    </div>
  );
}
