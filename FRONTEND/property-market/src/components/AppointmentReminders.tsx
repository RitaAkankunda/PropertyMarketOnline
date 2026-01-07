"use client";

import { useState, useEffect } from "react";
import { Bell, X, Calendar, Clock, CheckCircle, AlertCircle, Info } from "lucide-react";

export interface AppointmentReminder {
  id: string;
  jobId: string;
  title: string;
  serviceType: string;
  providerName: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  reminderType: "24h" | "1h" | "now";
  read: boolean;
}

interface Props {
  reminders: AppointmentReminder[];
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const reminderConfig = {
  "24h": {
    icon: Info,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    message: "Reminder: Appointment tomorrow",
  },
  "1h": {
    icon: AlertCircle,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    message: "Reminder: Appointment in 1 hour",
  },
  now: {
    icon: Bell,
    color: "text-red-600 bg-red-50 border-red-200",
    message: "Reminder: Appointment scheduled now",
  },
};

export default function AppointmentReminders({ reminders, onMarkAsRead, onDismiss }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = reminders.filter((r) => !r.read).length;

  // Show notification toast for new reminders
  useEffect(() => {
    if (unreadCount > 0 && !isOpen) {
      // Auto-open panel when new reminders arrive
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Reminders Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-4 top-20 w-96 max-h-[80vh] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in slide-in-from-right-5 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-lg">Appointment Reminders</h3>
                  <p className="text-xs text-blue-100">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reminders List */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {reminders.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No upcoming reminders</p>
                  <p className="text-sm text-gray-400 mt-1">
                    We'll notify you before your appointments
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {reminders.map((reminder) => {
                    const Icon = reminderConfig[reminder.reminderType].icon;
                    const colorClass = reminderConfig[reminder.reminderType].color;
                    const message = reminderConfig[reminder.reminderType].message;

                    return (
                      <div
                        key={reminder.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !reminder.read ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-gray-900 text-sm">{message}</p>
                              {!reminder.read && (
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                              )}
                            </div>

                            <p className="text-sm text-gray-700 font-medium mb-2">
                              {reminder.serviceType.charAt(0).toUpperCase() + reminder.serviceType.slice(1)} Service
                            </p>

                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  {new Date(reminder.scheduledDate).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="capitalize">{reminder.scheduledTime}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {!reminder.read && (
                                <button
                                  onClick={() => onMarkAsRead(reminder.id)}
                                  className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                                >
                                  Mark as Read
                                </button>
                              )}
                              <button
                                onClick={() => onDismiss(reminder.id)}
                                className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {reminders.length > 0 && unreadCount > 0 && (
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <button
                  onClick={() => reminders.forEach((r) => !r.read && onMarkAsRead(r.id))}
                  className="w-full text-sm py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

