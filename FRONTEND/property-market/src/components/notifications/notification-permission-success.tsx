"use client";

import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

export function NotificationPermissionSuccess() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show success message when permission is granted
    const handlePermissionGranted = () => {
      setShow(true);
      setTimeout(() => {
        setShow(false);
      }, 5000); // Auto-hide after 5 seconds
    };

    window.addEventListener('notification-permission-granted', handlePermissionGranted);
    return () => {
      window.removeEventListener('notification-permission-granted', handlePermissionGranted);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 shadow-sm animate-in slide-in-from-top">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">
            Notifications enabled! You'll receive alerts for new updates.
          </p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="flex-shrink-0 text-green-600 hover:text-green-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
