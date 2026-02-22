'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { notFound } from 'next/navigation';

/**
 * allowedRoles: array of roles that may access this route, e.g. ['teacher']
 * If unauthenticated → redirect to /
 * If authenticated but wrong role → trigger 404
 */
export function RouteGuard({ children, allowedRoles }) {
  const { authenticated, userType, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!mounted) return;
    if (!authenticated) {
      if (allowedRoles && allowedRoles.length > 0) {
        alert('You must be logged in to access this page');
      }
      router.replace('/');
    }
  }, [mounted, authenticated, router]);

  // Not yet hydrated — render nothing to avoid flash
  if (!mounted) return null;

  // Not authenticated — will redirect, render nothing
  if (!authenticated) return null;

  // Authenticated but wrong role — show 404
  if (allowedRoles && !allowedRoles.includes(userType)) {
    // We call the Next.js notFound() which renders not-found.js
    notFound();
  }

  return children;
}