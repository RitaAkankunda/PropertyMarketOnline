import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

class NotificationsService {
  /**
   * Get user notifications
   */
  async getNotifications(options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.unreadOnly) params.append('unreadOnly', 'true');

    console.log('[NOTIFICATIONS SERVICE] Fetching notifications with params:', params.toString());
    const response = await api.get<NotificationsResponse>(
      `/notifications?${params.toString()}`,
    );
    console.log('[NOTIFICATIONS SERVICE] Received response:', {
      notificationsCount: response.data.notifications.length,
      total: response.data.total,
      notifications: response.data.notifications,
    });
    return response.data;
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.count;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch<Notification>(
      `/notifications/${notificationId}/read`,
    );
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/mark-all-read');
  }
}

export const notificationsService = new NotificationsService();
