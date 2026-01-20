"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthState } from "@/types";
import { authService, type LoginCredentials, type RegisterData } from "@/services/auth.service";

interface AuthStore extends AuthState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<{ user: User; token: string }>;
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
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

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
          console.log('[AUTH STORE] Refreshing user profile...');
          const user = await authService.getProfile();
          console.log('[AUTH STORE] Profile refreshed:', {
            id: user?.id,
            email: user?.email,
            role: user?.role,
          });
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('[AUTH STORE] Failed to refresh profile:', error);
          // If profile fetch fails (401/403), clear auth state
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Initialize auth state on app load
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  const persistedState = localStorage.getItem('auth-storage');
  
  console.log('[AUTH STORE INIT] Checking stored auth:', {
    hasToken: !!token,
    hasPersistedState: !!persistedState,
  });
  
  // If we have a token, verify it's valid by fetching profile
  if (token && persistedState) {
    try {
      const state = JSON.parse(persistedState);
      if (state?.state?.isAuthenticated) {
        console.log('[AUTH STORE INIT] Found authenticated state, verifying token...');
        // Verify token is still valid
        authService.getProfile()
          .then((user) => {
            console.log('[AUTH STORE INIT] Token is valid, user:', user.email);
            useAuthStore.setState({ user, token, isAuthenticated: true });
          })
          .catch((error) => {
            console.error('[AUTH STORE INIT] Token is invalid, clearing auth state:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('auth-storage');
            useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
          });
      }
    } catch (error) {
      console.error('[AUTH STORE INIT] Error parsing persisted state:', error);
      localStorage.removeItem('auth-storage');
    }
  }
}
