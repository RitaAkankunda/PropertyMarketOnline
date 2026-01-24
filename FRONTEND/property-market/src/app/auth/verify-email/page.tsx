'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Check, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui';
import { API_BASE_URL } from '@/lib/constants';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const emailParam = searchParams.get('email');

      if (!token || !emailParam) {
        setStatus('error');
        setMessage('Invalid verification link. Missing token or email.');
        return;
      }

      setEmail(emailParam);

      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/verify-email?token=${token}&email=${emailParam}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          const error = await response.json();
          setStatus('error');
          setMessage(error.message || 'Failed to verify email. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again later.');
        console.error('Email verification error:', error);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="flex justify-center">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 rounded-full p-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 rounded-full p-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/register')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Return to Registration
                </Button>
                
                {email && (
                  <Button
                    onClick={() => {
                      // Redirect to resend email page
                      router.push(`/auth/resend-verification?email=${email}`);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Request New Verification Email
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Having trouble? <a href="/contact" className="text-blue-600 hover:underline">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
}
