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
  const { refreshProfile } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const provider = searchParams.get("provider");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
      return;
    }

    if (token) {
      // Store the token
      localStorage.setItem("token", token);
      
      // Update auth state
      useAuthStore.setState({
        token,
        isAuthenticated: true,
      });

      // Fetch user profile
      authService.getProfile()
        .then((user) => {
          useAuthStore.setState({ user });
          router.push("/dashboard");
        })
        .catch((err) => {
          setError("Failed to load user profile");
          console.error(err);
        });
    } else {
      setError("No authentication token received");
    }
  }, [searchParams, router, refreshProfile]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold mb-2">Signing you in...</h2>
          <p className="text-muted-foreground">
            Please wait while we complete your authentication with {APP_NAME}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
