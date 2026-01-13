"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "./toast";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { Button } from "./button";

interface ToastContextType {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

interface EventToast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, removeToast, success, error, info, warning } = useToast();
  const [eventToasts, setEventToasts] = useState<EventToast[]>([]);

  // Listen for show-toast events (for action buttons)
  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { type, message, action, duration = 5000 } = event.detail;
      const id = Math.random().toString(36).substring(7);
      
      const newToast: EventToast = {
        id,
        type,
        message,
        action,
        duration,
      };

      setEventToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          setEventToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    };

    window.addEventListener('show-toast', handleShowToast as EventListener);
    return () => {
      window.removeEventListener('show-toast', handleShowToast as EventListener);
    };
  }, []);

  const removeEventToast = (id: string) => {
    setEventToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Event-based toasts with action support */}
      {eventToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] space-y-2">
          {eventToasts.map((toast) => (
            <EventToastNotification
              key={toast.id}
              toast={toast}
              onClose={() => removeEventToast(toast.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

function EventToastNotification({
  toast,
  onClose,
}: {
  toast: EventToast;
  onClose: () => void;
}) {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
    },
    info: {
      icon: AlertCircle,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[toast.type];

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md animate-in slide-in-from-right`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{toast.message}</p>
          {toast.action && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                toast.action?.onClick();
                onClose();
              }}
              className={`${textColor} p-0 h-auto mt-2 font-semibold hover:underline`}
            >
              {toast.action.label} →
            </Button>
          )}
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}

