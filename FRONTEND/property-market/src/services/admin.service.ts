import api from './api';

export interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  pendingVerifications: number;
  totalProperties: number;
  revenue: number;
  activeListings: number;
  totalListers: number;
  totalPropertyManagers: number;
  totalBuyers: number;
  totalRenters: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export const adminService = {
  // Get admin dashboard statistics
  async getStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>('/users/admin/stats');
    return response.data;
  },

  // Get all users (admin only)
  async getAllUsers(): Promise<AdminUser[]> {
    const response = await api.get<AdminUser[]>('/users/admin/users');
    return response.data;
  },

  // Update user role (admin only)
  async updateUserRole(userId: string, role: string): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`/users/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/users/admin/users/${userId}`);
    return response.data;
  },
};

