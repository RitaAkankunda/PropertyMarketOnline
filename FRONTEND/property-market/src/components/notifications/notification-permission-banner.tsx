"use client";

import { useState, useEffect } from "react";
import { Bell, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationPermissionBannerProps {
  onPermissionGranted?: () => void;
}

export function NotificationPermissionBanner({ onPermissionGranted }: NotificationPermissionBannerProps) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check if user has dismissed the banner (stored in localStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('notification-banner-dismissed');
      if (dismissed === 'true' && permission === 'default') {
        setIsDismissed(true);
      }
    }
  }, [permission]);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      return;
    }

    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        onPermissionGranted?.();
        // Dispatch event for success banner
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification-permission-granted'));
        }
        // Hide banner after successful permission
        setIsDismissed(true);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-banner-dismissed', 'true');
    }
  };

  // Don't show if:
  // - Permission is already granted or denied
  // - User dismissed it
  // - Browser doesn't support notifications
  if (
    permission !== 'default' ||
    isDismissed ||
    typeof window === 'undefined' ||
    !('Notification' in window)
  ) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Stay Updated with Notifications
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get instant alerts when you receive new service requests, job updates, or important messages. 
            Never miss an important update!
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleEnableNotifications}
              disabled={isRequesting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Enable Notifications
                </>
              )}
            </Button>
            
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
              aria-label="Dismiss"
            >
              Maybe later
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
