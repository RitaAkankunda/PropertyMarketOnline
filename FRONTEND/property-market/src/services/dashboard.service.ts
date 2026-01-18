import api from './api';

export interface DashboardActivity {
  id: string;
  type: 'inquiry' | 'view' | 'verification' | 'message';
  message: string;
  time: string;
  read: boolean;
}

export interface DashboardAppointment {
  id: string;
  title: string;
  property: string;
  client: string;
  date: string;
  time: string;
}

export interface DashboardAnalytics {
  totalProperties: number;
  totalViews: number;
  totalMessages: number;
  revenue: number;
  propertyChange: string;
  viewsChange: string;
  messagesChange: string;
  revenueChange: string;
  chartData?: {
    last7Days: {
      date: string;
      views: number;
      bookings: number;
      revenue: number;
    }[];
    propertyPerformance: {
      id: string;
      title: string;
      views: number;
      type: string;
    }[];
    bookingsByType: {
      inquiries: number;
      viewings: number;
      bookings: number;
    };
    bookingsByStatus: {
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
  };
}

export const dashboardService = {
  // Get dashboard activities
  async getActivities(): Promise<DashboardActivity[]> {
    const response = await api.get<DashboardActivity[]>('/users/dashboard/activities');
    return response.data;
  },

  // Get dashboard appointments
  async getAppointments(): Promise<DashboardAppointment[]> {
    const response = await api.get<DashboardAppointment[]>('/users/dashboard/appointments');
    return response.data;
  },

  // Get dashboard analytics
  async getAnalytics(): Promise<DashboardAnalytics> {
    const response = await api.get<DashboardAnalytics>('/users/dashboard/analytics');
    return response.data;
  },
};

