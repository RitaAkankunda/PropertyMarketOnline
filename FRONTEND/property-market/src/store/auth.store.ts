"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthState } from "@/types";
import { authService, type LoginCredentials, type RegisterData } from "@/services/auth.service";

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          console.log("[AUTH STORE] Login response:", response);
          if (typeof window !== "undefined") {
            localStorage.setItem("token", response.token);
          }
          const authState = {
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          };
          console.log("[AUTH STORE] Setting auth state:", authState);
          set(authState);
          return response; // Return response so login page can access user data
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("token", response.token);
          }
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      refreshProfile: async () => {
        try {
          const user = await authService.getProfile();
          set({ user });
        } catch (error) {
          // If profile fetch fails, logout
          get().logout();
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
