"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Google OAuth Callback Component
 * 
 * This component handles the callback from Google OAuth.
 * It immediately forwards the authorization code to the backend without showing any UI.
 */
function GoogleCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      // Redirect to login with error
      window.location.href = `/auth/login?error=${encodeURIComponent(errorParam)}`;
      return;
    }

    if (!code) {
      // Redirect to login if no code
      window.location.href = '/auth/login?error=no_code';
      return;
    }

    // Immediately forward the code to backend - no loading screen
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
    const backendCallbackUrl = `${backendUrl}/auth/google/callback?code=${encodeURIComponent(code)}`;

    // Redirect to backend callback - backend will handle OAuth and redirect to /auth/callback
    window.location.href = backendCallbackUrl;
  }, [searchParams]);

  // Return null - no UI, just immediate redirect
  return null;
}

/**
 * Google OAuth Callback Page
 * 
 * This page handles the callback from Google OAuth.
 * It immediately forwards the authorization code to the backend without showing any UI.
 * 
 * IMPORTANT: In Google Cloud Console, set the callback URL to:
 * - Development: http://localhost:3000/auth/google/callback
 * - Production: https://yourdomain.com/auth/google/callback
 */
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackContent />
    </Suspense>
  );
}

