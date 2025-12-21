import api from "./api";
import type { User } from "@/types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "buyer" | "renter" | "lister" | "property_manager";
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return {
      user: response.data.user,
      token: response.data.accessToken,
    };
  },

  // Register new user
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post<AuthResponse>("/auth/signup", data);
    return {
      user: response.data.user,
      token: response.data.accessToken,
    };
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await api.get<User>("/auth/profile");
    return response.data;
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<User>("/auth/profile", data);
    return response.data;
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email });
  },

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post("/auth/reset-password", { token, newPassword });
  },

  // Logout
  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  },

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    await api.post("/auth/verify-email", { token });
  },

  // Resend verification email
  async resendVerificationEmail(): Promise<void> {
    await api.post("/auth/resend-verification");
  },

  // Upload ID for verification
  async uploadIdVerification(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("idDocument", file);
    await api.post("/auth/verify-id", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
