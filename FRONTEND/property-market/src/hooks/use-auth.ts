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
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectUrl]);

  return { isAuthenticated, isLoading };
}

export function useRequireRole(
  allowedRoles: string[],
  redirectUrl: string = "/"
) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login");
      } else if (user && !allowedRoles.includes(user.role)) {
        router.push(redirectUrl);
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, router, redirectUrl]);

  return {
    isAuthenticated,
    isLoading,
    hasAccess: user ? allowedRoles.includes(user.role) : false,
  };
}
