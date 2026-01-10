"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { providerService, notificationsService } from "@/services";
import { useNotificationAlerts } from "@/hooks/use-notifications";
import { useWebSocketNotifications } from "@/hooks/use-websocket-notifications";
import { NotificationPermissionBanner } from "@/components/notifications/notification-permission-banner";
import { NotificationPermissionSuccess } from "@/components/notifications/notification-permission-success";
import type { Job as ApiJob } from "@/types";
import type { Notification as ApiNotification } from "@/services/notifications.service";
import {
  Home,
  Briefcase,
  MessageCircle,
  Bell,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  Phone,
  Calendar,
  ChevronRight,
  Plus,
  Search,
  Send,
  X,
  AlertCircle,
  DollarSign,
} from "lucide-react";

// =============================================
// TYPES
// =============================================
type RequestStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
type TabType = "requests" | "messages" | "notifications";

interface ServiceRequest {
  id: string;
  providerName: string;
  providerPhone: string;
  serviceType: string;
  description: string;
  location: string;
  scheduledDate: string;
  scheduledTime: string;
  status: RequestStatus;
  amount: number;
  createdAt: string;
  providerRating?: number;
}

// Notification interface matches API response
type Notification = ApiNotification;

// Helper function to format Job from API to ServiceRequest display format
function formatJobToServiceRequest(job: ApiJob): ServiceRequest {
  const providerName = job.provider?.businessName || job.provider?.user?.firstName 
    ? `${job.provider.user?.firstName || ''} ${job.provider.user?.lastName || ''}`.trim() 
    : 'Unknown Provider';
  const providerPhone = job.provider?.user?.phone || "N/A";
  const locationStr = job.location.address || `${job.location.city}${job.location.latitude ? ` (${job.location.latitude}, ${job.location.longitude})` : ""}`;

  return {
    id: job.id,
    providerName,
    providerPhone,
    serviceType: job.serviceType,
    description: job.description,
    location: locationStr,
    scheduledDate: job.scheduledDate,
    scheduledTime: job.scheduledTime,
    status: job.status as RequestStatus,
    amount: job.price || 0,
    createdAt: job.createdAt,
    providerRating: job.provider?.rating,
  };
}

// Helper function to map API notification type to display type
function mapNotificationType(type: string): "info" | "success" | "warning" {
  if (type.includes('accepted') || type.includes('completed')) {
    return 'success';
  }
  if (type.includes('rejected') || type.includes('cancelled')) {
    return 'warning';
  }
  return 'info';
}

const DUMMY_CONVERSATIONS = [
  { id: "C1", providerName: "ElectroPro Services", lastMessage: "I'll arrive around 9 AM tomorrow", timestamp: "30 min ago", unread: true, requestId: "REQ001" },
  { id: "C2", providerName: "Quick Movers Uganda", lastMessage: "Can you confirm the pickup address?", timestamp: "2 hours ago", unread: true, requestId: "REQ002" },
  { id: "C3", providerName: "Master Plumbers Ltd", lastMessage: "Working on it now, almost done", timestamp: "4 hours ago", unread: false, requestId: "REQ003" },
];

// =============================================
// STATUS BADGE
// =============================================
function StatusBadge({ status }: { status: RequestStatus }) {
  const config = {
    pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending", icon: Clock },
    accepted: { color: "bg-blue-100 text-blue-700", label: "Accepted", icon: CheckCircle },
    in_progress: { color: "bg-purple-100 text-purple-700", label: "In Progress", icon: AlertCircle },
    completed: { color: "bg-green-100 text-green-700", label: "Completed", icon: CheckCircle },
    cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled", icon: XCircle },
  };
  const Icon = config[status].icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config[status].color}`}>
      <Icon className="w-3 h-3" />
      {config[status].label}
    </span>
  );
}

// =============================================
// REQUEST DETAIL MODAL
// =============================================
function RequestDetailModal({ 
  request, 
  onClose,
  onCancel,
  onRate
}: { 
  request: ServiceRequest; 
  onClose: () => void;
  onCancel: (id: string) => void;
  onRate: (id: string, rating: number) => void;
}) {
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-100">Request #{request.id}</p>
            <h2 className="font-bold text-lg">{request.serviceType}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status</span>
            <StatusBadge status={request.status} />
          </div>

          {/* Provider Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Service Provider</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{request.providerName}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {request.providerRating}
                </div>
              </div>
              <a href={`tel:${request.providerPhone}`} className="p-2 bg-green-500 text-white rounded-lg">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{new Date(request.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{request.scheduledTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{request.location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600">{request.description}</p>
          </div>

          {/* Amount */}
          <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
            <span className="text-gray-700">Amount</span>
            <span className="text-xl font-bold text-blue-600">UGX {request.amount.toLocaleString()}</span>
          </div>

          {/* Rating for completed jobs */}
          {request.status === "completed" && !showRating && (
            <button
              onClick={() => setShowRating(true)}
              className="w-full py-3 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              <Star className="w-5 h-5 inline mr-2" />
              Rate this service
            </button>
          )}

          {showRating && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 text-center">Rate your experience</h3>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)}>
                    <Star className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
              <button
                onClick={() => { onRate(request.id, rating); onClose(); }}
                disabled={rating === 0}
                className="w-full py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                Submit Rating
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 space-y-2">
          {request.status === "pending" && (
            <button
              onClick={() => { onCancel(request.id); onClose(); }}
              className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Cancel Request
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// CHAT MODAL
// =============================================
function ChatModal({ 
  conversation, 
  onClose 
}: { 
  conversation: typeof DUMMY_CONVERSATIONS[0]; 
  onClose: () => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: "provider", text: "Hello! I received your service request.", time: "10:00 AM" },
    { id: 2, sender: "user", text: "Great! When can you come?", time: "10:05 AM" },
    { id: 3, sender: "provider", text: conversation.lastMessage, time: "10:10 AM" },
  ]);

  const handleSend = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: "user",
        text: newMessage,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
      setNewMessage("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">{conversation.providerName}</p>
              <p className="text-xs text-gray-500">Request #{conversation.requestId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.sender === "user" 
                  ? "bg-blue-500 text-white rounded-br-md" 
                  : "bg-gray-100 text-gray-900 rounded-bl-md"
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-blue-100" : "text-gray-400"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN USER DASHBOARD
// =============================================
export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [selectedChat, setSelectedChat] = useState<typeof DUMMY_CONVERSATIONS[0] | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Fetch user's jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const status = statusFilter === "all" ? undefined : statusFilter;
        const response = await providerService.getMyJobs(status, 1, 100);
        
        // Format jobs to service requests
        const formattedRequests = response.data.map(formatJobToServiceRequest);
        setRequests(formattedRequests);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err instanceof Error ? err.message : "Failed to load service requests");
        setRequests([]);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [statusFilter]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      console.log('[NOTIFICATIONS] Fetching notifications...');
      console.log('[NOTIFICATIONS] notificationsService:', notificationsService);
      console.log('[NOTIFICATIONS] Calling getNotifications...');
      
      const response = await notificationsService.getNotifications({
        limit: 50,
        offset: 0,
      });
      
      console.log('[NOTIFICATIONS] Fetched notifications response:', response);
      console.log('[NOTIFICATIONS] Notifications array:', response.notifications);
      console.log('[NOTIFICATIONS] Setting notifications state with', response.notifications.length, 'notifications');
      
      setNotifications(response.notifications || []);
      console.log('[NOTIFICATIONS] State updated successfully');
    } catch (err) {
      console.error('[NOTIFICATIONS] Error fetching notifications:', err);
      console.error('[NOTIFICATIONS] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        response: (err as any)?.response,
      });
      // Don't set error state for notifications, just log it
      setNotifications([]);
    }
  };

  // Initial fetch and fallback polling (only if WebSocket fails)
  const [usePolling, setUsePolling] = useState(false);
  
  useEffect(() => {
    fetchNotifications();
    
    // Only poll if WebSocket is not connected (fallback)
    if (usePolling) {
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [usePolling]);

  // WebSocket for real-time notifications
  const { isConnected: wsConnected, connectionError: wsError } = useWebSocketNotifications({
    enabled: true,
    onNotification: (notification) => {
      console.log('[NOTIFICATIONS] 📬 New notification via WebSocket:', notification);
      // Add new notification to the list (prepend)
      setNotifications(prev => {
        // Check if notification already exists
        if (prev.find(n => n.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev];
      });
    },
    onUnreadCount: (count) => {
      console.log('[NOTIFICATIONS] 📊 Unread count update:', count);
    },
  });

  // Fallback to polling if WebSocket fails
  useEffect(() => {
    if (wsError && !wsConnected) {
      console.warn('[NOTIFICATIONS] WebSocket failed, falling back to polling');
      setUsePolling(true);
    } else if (wsConnected) {
      console.log('[NOTIFICATIONS] WebSocket connected, using real-time updates');
      setUsePolling(false);
    }
  }, [wsConnected, wsError]);
  
  // Also refresh notifications when page becomes visible (user switches tabs back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Browser push notifications and sound alerts
  useNotificationAlerts(notifications, true);

  // Handle notification click from browser push notification
  useEffect(() => {
    const handleNotificationClick = (event: CustomEvent) => {
      const { jobId } = event.detail;
      if (jobId) {
        const relatedRequest = requests.find(r => r.id === jobId);
        if (relatedRequest) {
          setSelectedRequest(relatedRequest);
          setActiveTab("requests");
          setShowNotificationDropdown(false);
        }
      }
    };

    window.addEventListener('notification-clicked', handleNotificationClick as EventListener);
    return () => window.removeEventListener('notification-clicked', handleNotificationClick as EventListener);
  }, [requests]);

  const filteredRequests = statusFilter === "all" 
    ? requests 
    : requests.filter(r => r.status === statusFilter);

  const handleCancelRequest = async (id: string) => {
    try {
      await providerService.cancelJob(id, "Cancelled by user");
      setRequests(requests.map(r => r.id === id ? { ...r, status: "cancelled" as RequestStatus } : r));
    } catch (err) {
      console.error("Error cancelling request:", err);
      alert(err instanceof Error ? err.message : "Failed to cancel request");
    }
  };

  const handleRateService = (id: string, rating: number) => {
    console.log(`Rated request ${id} with ${rating} stars`);
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const unreadMessages = DUMMY_CONVERSATIONS.filter(c => c.unread).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {selectedRequest && (
        <RequestDetailModal 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)}
          onCancel={handleCancelRequest}
          onRate={handleRateService}
        />
      )}
      {selectedChat && (
        <ChatModal conversation={selectedChat} onClose={() => setSelectedChat(null)} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Dashboard</h1>
              <p className="text-blue-100">Track your service requests</p>
            </div>
            <div className="flex items-center gap-3 relative">
              <button 
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[BELL CLICK] Bell icon clicked, current dropdown state:', showNotificationDropdown);
                  try {
                    const newState = !showNotificationDropdown;
                    console.log('[BELL CLICK] Setting dropdown state to:', newState);
                    setShowNotificationDropdown(newState);
                    // Refresh notifications when opening dropdown
                    if (newState) {
                      console.log('[BELL CLICK] Opening dropdown, fetching notifications...');
                      await fetchNotifications();
                    } else {
                      console.log('[BELL CLICK] Closing dropdown');
                    }
                  } catch (error) {
                    console.error('[BELL CLICK] Error in click handler:', error);
                  }
                }}
                className="p-2 bg-white/20 rounded-lg relative hover:bg-white/30 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <>
                  {/* Backdrop to close on outside click */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotificationDropdown(false)}
                  />
                  {/* Dropdown Panel */}
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl">
                      <div>
                        <h3 className="font-bold text-lg">Notifications</h3>
                        {unreadNotifications > 0 && (
                          <p className="text-sm text-blue-100">{unreadNotifications} unread</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadNotifications > 0 && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await notificationsService.markAllAsRead();
                                const response = await notificationsService.getNotifications({ limit: 50 });
                                setNotifications(response.notifications);
                              } catch (err) {
                                console.error("Error marking all as read:", err);
                              }
                            }}
                            className="text-xs text-blue-100 hover:text-white underline"
                          >
                            Mark all read
                          </button>
                        )}
                        <button 
                          onClick={() => setShowNotificationDropdown(false)}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                      {notifications.length > 0 ? (
                        <div className="divide-y">
                          {notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!notif.isRead) {
                                  try {
                                    await notificationsService.markAsRead(notif.id);
                                    setNotifications(notifications.map(n => 
                                      n.id === notif.id ? { ...n, isRead: true } : n
                                    ));
                                  } catch (err) {
                                    console.error("Error marking notification as read:", err);
                                  }
                                }
                              }}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notif.isRead ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  mapNotificationType(notif.type) === "success" ? "bg-green-100" :
                                  mapNotificationType(notif.type) === "warning" ? "bg-yellow-100" : "bg-blue-100"
                                }`}>
                                  {mapNotificationType(notif.type) === "success" ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : mapNotificationType(notif.type) === "warning" ? (
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                  ) : (
                                    <Bell className="w-5 h-5 text-blue-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className={`font-semibold text-sm ${!notif.isRead ? "text-gray-900" : "text-gray-600"}`}>
                                        {notif.title}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {notif.message}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-2">
                                        {new Date(notif.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                    {!notif.isRead && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No notifications</p>
                          <p className="text-gray-400 text-xs mt-1">You&apos;re all caught up!</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-3 border-t bg-gray-50 rounded-b-xl">
                        <button
                          onClick={() => {
                            setShowNotificationDropdown(false);
                            setActiveTab("notifications");
                          }}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Permission Banner */}
      <div className="container mx-auto px-4 pt-6">
        <NotificationPermissionBanner />
        <NotificationPermissionSuccess />
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="font-bold text-gray-900">{requests.filter(r => r.status === "pending").length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">In Progress</p>
                <p className="font-bold text-gray-900">{requests.filter(r => r.status === "in_progress").length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="font-bold text-gray-900">{requests.filter(r => r.status === "completed").length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="font-bold text-gray-900">UGX 1.2M</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: "requests", label: "My Requests", icon: Briefcase },
            { id: "messages", label: "Messages", icon: MessageCircle, badge: unreadMessages },
            { id: "notifications", label: "Notifications", icon: Bell, badge: unreadNotifications },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? "bg-blue-500 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                  activeTab === tab.id ? "bg-white text-blue-500" : "bg-red-500 text-white"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {/* REQUESTS TAB */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {/* New Request Button */}
            <Link href="/providers">
              <button className="w-full py-4 bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 shadow-lg">
                <Plus className="w-5 h-5" />
                Request New Service
              </button>
            </Link>

            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "accepted", label: "Accepted" },
                { id: "in_progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id as RequestStatus | "all")}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    statusFilter === filter.id 
                      ? "bg-blue-500 text-white" 
                      : "bg-white text-gray-600 border"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Request Cards */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 bg-red-50 rounded-xl">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                <div 
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">#{request.id}</span>
                        <StatusBadge status={request.status} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{request.serviceType}</h3>
                      <p className="text-sm text-gray-500 mt-1">{request.providerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">UGX {request.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{new Date(request.scheduledDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {request.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {request.scheduledTime}
                    </span>
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                  <p className="text-gray-500 mb-4">You haven&apos;t made any service requests yet</p>
                  <Link href="/providers">
                    <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      Find Service Providers
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === "messages" && (
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {DUMMY_CONVERSATIONS.map((conv) => (
              <div 
                key={conv.id}
                onClick={() => setSelectedChat(conv)}
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  {conv.unread && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${conv.unread ? "text-gray-900" : "text-gray-600"}`}>
                      {conv.providerName}
                    </p>
                    <span className="text-xs text-gray-400">{conv.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className="space-y-3">
            {notifications.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {unreadNotifications > 0 && `${unreadNotifications} unread`}
                  </h3>
                  {unreadNotifications > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          await notificationsService.markAllAsRead();
                          // Refresh notifications
                          const response = await notificationsService.getNotifications({ limit: 50 });
                          setNotifications(response.notifications);
                        } catch (err) {
                          console.error("Error marking all as read:", err);
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={async () => {
                      // Mark as read
                      if (!notif.isRead) {
                        try {
                          await notificationsService.markAsRead(notif.id);
                          // Update local state
                          setNotifications(notifications.map(n => 
                            n.id === notif.id ? { ...n, isRead: true } : n
                          ));
                        } catch (err) {
                          console.error("Error marking notification as read:", err);
                        }
                      }
                      
                      // Navigate to related job if available
                      if (notif.data?.jobId) {
                        setShowNotificationDropdown(false);
                        const jobId = notif.data.jobId;
                        // Find and select the related request
                        const relatedRequest = requests.find(r => r.id === jobId);
                        if (relatedRequest) {
                          setSelectedRequest(relatedRequest);
                          setActiveTab("requests");
                        }
                      }
                    }}
                    className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.isRead ? "border-l-4 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        mapNotificationType(notif.type) === "success" ? "bg-green-100" :
                        mapNotificationType(notif.type) === "warning" ? "bg-yellow-100" : "bg-blue-100"
                      }`}>
                        {mapNotificationType(notif.type) === "success" ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                         mapNotificationType(notif.type) === "warning" ? <AlertCircle className="w-5 h-5 text-yellow-600" /> :
                         <Bell className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`font-medium ${!notif.isRead ? "text-gray-900" : "text-gray-600"}`}>
                              {notif.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">You&apos;re all caught up!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex">
          <Link href="/" className="flex-1 flex flex-col items-center py-3 text-gray-500">
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/providers" className="flex-1 flex flex-col items-center py-3 text-gray-500">
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1">Services</span>
          </Link>
          <Link href="/dashboard/user" className="flex-1 flex flex-col items-center py-3 text-blue-500">
            <Briefcase className="w-5 h-5" />
            <span className="text-xs mt-1">Requests</span>
          </Link>
          <Link href="/dashboard/user" className="flex-1 flex flex-col items-center py-3 text-gray-500">
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

