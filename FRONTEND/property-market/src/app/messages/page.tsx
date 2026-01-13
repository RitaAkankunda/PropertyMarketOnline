'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Redirect to the real messages page in the dashboard
export default function MessagesRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve any query parameters when redirecting
    const conversationId = searchParams.get('conversation');
    const providerId = searchParams.get('provider');
    
    let redirectUrl = '/dashboard/messages';
    const params = new URLSearchParams();
    
    if (conversationId) params.set('conversation', conversationId);
    if (providerId) params.set('provider', providerId);
    
    if (params.toString()) {
      redirectUrl += '?' + params.toString();
    }
    
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Redirecting to messages...</span>
    </div>
  );
}
