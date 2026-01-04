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
    try {
      console.log("Attempting login with:", { email: credentials.email });
      const response = await api.post<AuthResponse>("/auth/login", credentials);
      console.log("Login response received:", { 
        hasUser: !!response.data.user, 
        hasToken: !!response.data.accessToken,
        userEmail: response.data.user?.email 
      });
      
      if (!response.data.accessToken) {
        console.error("Login response missing accessToken:", response.data);
        throw new Error("Invalid response from server: missing access token");
      }
      
      if (!response.data.user) {
        console.error("Login response missing user:", response.data);
        throw new Error("Invalid response from server: missing user data");
      }
      
      return {
        user: response.data.user,
        token: response.data.accessToken,
      };
    } catch (error: any) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        throw new Error("Invalid email or password. Please check your credentials and try again.");
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Invalid request. Please check your input.";
        throw new Error(message);
      } else if (error.response?.status >= 500) {
        throw new Error("Server error. Please try again later.");
      } else if (error.message?.includes("Backend server not responding")) {
        throw new Error("Cannot connect to the server. Please ensure the backend is running on port 3002.");
      } else if (error.message?.includes("Network Error") || error.code === "ECONNREFUSED") {
        throw new Error("Cannot connect to the server. Please check your internet connection and ensure the backend is running.");
      }
      
      throw error;
    }
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
    try {
      console.log('[AUTH SERVICE] Fetching user profile...');
      const response = await api.get<User>("/users/profile");
      console.log('[AUTH SERVICE] Profile response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[AUTH SERVICE] Failed to get profile:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<User>("/users/profile", data);
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
