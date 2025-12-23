"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { APP_NAME } from "@/lib/constants";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setIsLoading(true);
        const token = searchParams.get("token");
        const provider = searchParams.get("provider");
        const errorParam = searchParams.get("error");

        console.log('[AUTH CALLBACK] Processing callback:', {
          hasToken: !!token,
          provider,
          errorParam,
        });

        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          setIsLoading(false);
          return;
        }

        if (!token) {
          setError("No authentication token received");
          setIsLoading(false);
          return;
        }

        // Store the token
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          console.log('[AUTH CALLBACK] Token stored in localStorage');
        }
        
        // Update auth state immediately
        useAuthStore.setState({
          token,
          isAuthenticated: true,
        });
        console.log('[AUTH CALLBACK] Auth state updated with token');

        // Fetch user profile
        try {
          console.log('[AUTH CALLBACK] Fetching user profile...');
          const user = await authService.getProfile();
          console.log('[AUTH CALLBACK] User profile fetched:', user);
          
          // Update auth state with user
          useAuthStore.setState({ 
            user,
            token,
            isAuthenticated: true,
          });
          console.log('[AUTH CALLBACK] Auth state updated with user, redirecting to dashboard...');
          
          // Redirect immediately - no delay needed
          router.push("/dashboard");
        } catch (profileError) {
          console.error('[AUTH CALLBACK] Failed to fetch profile:', profileError);
          setError("Failed to load user profile. Please try logging in again.");
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[AUTH CALLBACK] Unexpected error:', err);
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
    };

    processCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <a
              href="/auth/login"
              className="text-primary hover:underline"
            >
              Return to login
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show minimal loading state or nothing - redirect happens quickly
  if (isLoading) {
    return null; // No loading screen, just process in background
  }

  return null;
}
