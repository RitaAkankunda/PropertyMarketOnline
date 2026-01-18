'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/store';
import type { Notification } from '@/services/notifications.service';

// WebSocket URL - defaults to backend URL without /api prefix
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 
  (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002');

interface UseWebSocketNotificationsOptions {
  onNotification?: (notification: Notification) => void;
  onUnreadCount?: (count: number) => void;
  enabled?: boolean;
}

export function useWebSocketNotifications(
  options: UseWebSocketNotificationsOptions = {}
) {
  const { onNotification, onUnreadCount, enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();

  const connect = useCallback(async () => {
    if (!enabled || !token || socketRef.current?.connected) {
      return;
    }

    try {
      if (typeof window === 'undefined') {
        return;
      }

      console.log('[WS] Connecting to WebSocket server...');

      const { io } = await import('socket.io-client');
      const socket = io(`${WS_BASE_URL}/notifications`, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        reconnectionDelayMax: 5000,
      });

      socket.on('connect', () => {
        console.log('[WS] ✅ Connected to WebSocket server');
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on('disconnect', (reason: string) => {
        console.log('[WS] ❌ Disconnected from WebSocket server:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          socket.connect();
        }
      });

      socket.on('connect_error', (error: Error) => {
        console.error('[WS] Connection error:', error.message);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      socket.on('notification', (notification: Notification) => {
        console.log('[WS] 📬 Received notification:', notification);
        onNotification?.(notification);
      });

      socket.on('unread-count', (data: { count: number }) => {
        console.log('[WS] 📊 Unread count update:', data.count);
        onUnreadCount?.(data.count);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('[WS] Failed to create WebSocket connection:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [enabled, token, onNotification, onUnreadCount]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[WS] Disconnecting from WebSocket server...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, token, connect, disconnect]);

  // Reconnect when token changes
  useEffect(() => {
    if (token && enabled) {
      disconnect();
      // Small delay to ensure cleanup
      const timer = setTimeout(() => {
        connect();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [token]);

  return {
    isConnected,
    connectionError,
    reconnect: connect,
    disconnect,
  };
}
