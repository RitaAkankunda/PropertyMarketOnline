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
};

