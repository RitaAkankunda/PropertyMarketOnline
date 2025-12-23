import { NextRequest, NextResponse } from 'next/server';

/**
 * This route handles Google OAuth callbacks when Google redirects to the frontend.
 * It proxies the request to the backend which processes the OAuth flow.
 * 
 * IMPORTANT: In Google Cloud Console, set the callback URL to:
 * - Development: http://localhost:3000/api/auth/google/callback
 * - Production: https://yourdomain.com/api/auth/google/callback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Get the backend API URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  if (error) {
    // If there's an error from Google, redirect to frontend callback with error
    const frontendUrl = new URL('/auth/callback', request.url);
    frontendUrl.searchParams.set('error', error);
    return NextResponse.redirect(frontendUrl);
  }

  if (code) {
    try {
      // Forward the OAuth code to the backend callback endpoint
      // The backend will exchange it for tokens and redirect to /auth/callback
      const backendCallbackUrl = `${backendUrl}/auth/google/callback?code=${encodeURIComponent(code)}`;
      
      // Use fetch to forward the request to backend
      const response = await fetch(backendCallbackUrl, {
        method: 'GET',
        redirect: 'manual', // Don't follow redirects automatically
      });

      // If backend redirects (status 302/301), extract the Location header
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          return NextResponse.redirect(location);
        }
      }

      // If backend returns an error, redirect to frontend callback with error
      if (!response.ok) {
        const frontendUrl = new URL('/auth/callback', request.url);
        frontendUrl.searchParams.set('error', 'backend_error');
        return NextResponse.redirect(frontendUrl);
      }

      // Fallback: redirect directly to backend (browser will follow)
      return NextResponse.redirect(backendCallbackUrl);
    } catch (err) {
      console.error('[GOOGLE OAUTH] Error forwarding callback:', err);
      const frontendUrl = new URL('/auth/callback', request.url);
      frontendUrl.searchParams.set('error', 'callback_failed');
      return NextResponse.redirect(frontendUrl);
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url));
}

