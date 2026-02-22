'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './_lib/AuthContext';
import LandingPage from './_components/LandingPage';

export default function Home() {
  const { authenticated, userType, mounted } = useAuth();
  const router = useRouter();

  // Redirect already-logged-in users to their home
  useEffect(() => {
    if (!mounted || !authenticated) return;
    if (userType === 'teacher') router.replace('/dashboard');
    else if (userType === 'parent') router.replace('/parent');
  }, [mounted, authenticated, userType, router]);

  if (!mounted) return null;
  if (authenticated) return null; // will redirect

  return <LandingPage />;
}