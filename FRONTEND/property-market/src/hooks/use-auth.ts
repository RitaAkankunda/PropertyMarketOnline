"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
  } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
  };
}

export function useRequireAuth(redirectUrl: string = "/auth/login") {
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait for store to hydrate before checking auth
    if (!_hasHydrated) return;
    
    if (!isLoading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, _hasHydrated, router, redirectUrl]);

  return { isAuthenticated, isLoading: isLoading || !_hasHydrated };
}

export function useRequireRole(
  allowedRoles: string[],
  redirectUrl: string = "/"
) {
  const { user, isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait for store to hydrate before checking auth/role
    if (!_hasHydrated) return;
    
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login");
      } else if (user && !allowedRoles.includes(user.role)) {
        router.push(redirectUrl);
      }
    }
  }, [user, isAuthenticated, isLoading, _hasHydrated, allowedRoles, router, redirectUrl]);

  return {
    isAuthenticated,
    isLoading: isLoading || !_hasHydrated,
    hasAccess: user ? allowedRoles.includes(user.role) : false,
  };
}
