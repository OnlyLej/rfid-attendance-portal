'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../_lib/AppContext';
import LandingPage from '../_components/LandingPage';
import { useLocale } from 'next-intl';

export default function Home() {
  const { authenticated, userType, mounted } = useApp();
  const router = useRouter();
  const locale = useLocale();

  // Redirect already-logged-in users to their home
  useEffect(() => {
    if (!mounted || !authenticated) return;
    if (userType === 'teacher') router.replace(`/${locale}/dashboard`);
    else if (userType === 'parent') router.replace(`/${locale}/parent`);
  }, [mounted, authenticated, userType, router, locale]);

  if (!mounted) return null;
  if (authenticated) return null; // will redirect

  return <LandingPage />;
}
