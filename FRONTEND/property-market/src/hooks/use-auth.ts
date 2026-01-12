"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
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
  const hasRedirected = useRef(false);
  const allowedRolesStr = allowedRoles.join(',');

  useEffect(() => {
    if (!isLoading && !hasRedirected.current) {
      if (!isAuthenticated) {
        hasRedirected.current = true;
        router.push("/auth/login");
      } else if (user && !allowedRoles.includes(user.role)) {
        hasRedirected.current = true;
        router.push(redirectUrl);
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRolesStr, router, redirectUrl]);

  return {
    isAuthenticated,
    isLoading,
    hasAccess: user ? allowedRoles.includes(user.role) : false,
  };
}
