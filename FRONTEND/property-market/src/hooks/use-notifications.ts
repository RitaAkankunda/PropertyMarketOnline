import { useEffect, useRef } from 'react';
import type { Notification } from '@/services/notifications.service';

/**
 * Hook to handle browser push notifications and sound alerts
 */
export function useNotificationAlerts(
  notifications: Notification[],
  enabled: boolean = true
) {
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());
  const notificationPermissionRef = useRef<NotificationPermission | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  // Initialize notification permission (but don't auto-request)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Check if browser supports notifications
    if ('Notification' in window) {
      notificationPermissionRef.current = Notification.permission;
      console.log('[NOTIFICATIONS] Browser notification permission:', Notification.permission);
    }
  }, [enabled]);

  // Listen for permission changes (when user grants via banner)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('Notification' in window)) return;

    const checkPermission = () => {
      const currentPermission = Notification.permission;
      if (currentPermission !== notificationPermissionRef.current) {
        notificationPermissionRef.current = currentPermission;
        if (currentPermission === 'granted') {
          // Dispatch event for success banner
          window.dispatchEvent(new CustomEvent('notification-permission-granted'));
        }
      }
    };

    // Check periodically (in case permission changes externally)
    const interval = setInterval(checkPermission, 1000);
    return () => clearInterval(interval);
  }, [enabled]);

  // Detect new notifications and show alerts
  useEffect(() => {
    if (!enabled) return;

    // On initial mount, just store current notification IDs and skip alerts
    if (isInitialMountRef.current) {
      notifications.forEach(n => previousNotificationIdsRef.current.add(n.id));
      isInitialMountRef.current = false;
      return;
    }

    // Find new notifications (not in previous set)
    const currentNotificationIds = new Set(notifications.map(n => n.id));
    const newNotifications = notifications.filter(
      n => !previousNotificationIdsRef.current.has(n.id) && !n.isRead
    );

    // If there are new unread notifications
    if (newNotifications.length > 0) {
      // Play sound alert (always, even if page is visible)
      playNotificationSound();

      // Show browser push notifications (only if page is not visible and permission granted)
      if (document.visibilityState === 'hidden' && notificationPermissionRef.current === 'granted') {
        newNotifications.forEach((notification) => {
          showBrowserNotification(notification);
        });
      }
    }

    // Update previous notification IDs
    previousNotificationIdsRef.current = currentNotificationIds;
  }, [notifications, enabled]);
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  try {
    // Try using Web Audio API for a clean beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Check if audio context is suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound (short, pleasant beep)
    oscillator.frequency.value = 800; // Higher pitch
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (error) {
    // Silently fail if audio is not supported
    console.debug('[NOTIFICATIONS] Sound not available:', error);
  }
}

/**
 * Show browser push notification
 */
function showBrowserNotification(notification: Notification) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body: notification.message,
    icon: '/favicon.ico', // You can customize this
    badge: '/favicon.ico',
    tag: notification.id, // Prevent duplicate notifications
    requireInteraction: false,
    silent: false,
    data: {
      jobId: notification.data?.jobId,
      notificationId: notification.id,
    },
  };

  const browserNotification = new Notification(notification.title, options);

  // Auto-close after 5 seconds
  setTimeout(() => {
    browserNotification.close();
  }, 5000);

  // Handle click on notification
  browserNotification.onclick = () => {
    window.focus();
    browserNotification.close();
    
    // Navigate to the related job if available
    if (notification.data?.jobId) {
      // This will be handled by the component that uses the hook
      // We can dispatch a custom event
      window.dispatchEvent(new CustomEvent('notification-clicked', {
        detail: { jobId: notification.data.jobId, notificationId: notification.id }
      }));
    }
  };
}
