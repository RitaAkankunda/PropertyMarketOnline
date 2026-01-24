'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { API_BASE_URL } from '@/lib/constants';

interface EmailVerificationPendingProps {
  email: string;
  userId: string;
  onVerified?: () => void;
}

export function EmailVerificationPending({
  email,
  userId,
  onVerified,
}: EmailVerificationPendingProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error resending verification:', error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 mb-1">Email Verification Required</h3>
          <p className="text-sm text-yellow-800 mb-4">
            Please verify your email address to activate your account and access all features.
          </p>

          <div className="bg-white rounded p-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>{email}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-yellow-800">
              We've sent a verification email to your inbox. Click the link in the email to verify.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="flex-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : "Didn't receive it? Send again"}
              </button>

              {resendSuccess && (
                <span className="text-xs text-green-600 font-medium">✓ Sent</span>
              )}
            </div>

            <Link
              href={`/auth/resend-verification?email=${encodeURIComponent(email)}`}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 mt-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-medium rounded transition-colors text-sm"
            >
              Verify Email
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs text-gray-600 mt-4">
            Having issues?{' '}
            <a href="/contact" className="text-blue-600 hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
