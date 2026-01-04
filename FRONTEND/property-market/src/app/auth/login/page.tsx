"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { useAuth } from "@/hooks";
import { APP_NAME, API_BASE_URL } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Check for return URL or message from query params
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setInfoMessage(message);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Log API URL on component mount for debugging
  useEffect(() => {
    const initLog = `[LOGIN PAGE LOADED] ${new Date().toISOString()}\nAPI Base URL: ${API_BASE_URL}`;
    console.log("%c" + initLog, "background: #1a1a1a; color: #4fc3f7; padding: 5px; font-size: 12px; font-weight: bold;");
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setErrorDetails(null);
      setShowDetails(false);
      
      // Persistent logging that won't get cleared
      const logMessage = `[LOGIN ATTEMPT] ${new Date().toISOString()}\nEmail: ${data.email}\nAPI URL: ${API_BASE_URL}`;
      console.log("%c" + logMessage, "background: #222; color: #bada55; padding: 5px; font-size: 12px;");
      
      // Also store in localStorage for persistence
      if (typeof window !== "undefined") {
        const logs = JSON.parse(localStorage.getItem("login_logs") || "[]");
        logs.push({ timestamp: new Date().toISOString(), action: "attempt", email: data.email, apiUrl: API_BASE_URL });
        localStorage.setItem("login_logs", JSON.stringify(logs.slice(-10))); // Keep last 10 logs
      }
      
      const loginResponse = await login(data);
      
      const successLog = `[LOGIN SUCCESS] ${new Date().toISOString()}\nEmail: ${data.email}\nRole: ${loginResponse?.user?.role || 'unknown'}`;
      console.log("%c" + successLog, "background: #222; color: #00ff00; padding: 5px; font-size: 12px;");
      console.log("[LOGIN] User data after login:", loginResponse?.user);
      
      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        // Check for return URL in localStorage (set by protected pages)
        const returnUrl = localStorage.getItem("returnUrl");
        if (returnUrl) {
          localStorage.removeItem("returnUrl");
          router.push(returnUrl);
        } else {
          // Redirect based on user role
          if (loginResponse?.user?.role === 'admin') {
            router.push('/admin');
          } else if (loginResponse?.user?.role === 'service_provider') {
            router.push('/dashboard/provider');
          } else {
            router.push('/dashboard');
          }
        }
      }, 100);
    } catch (err: unknown) {
      // Capture full error details
      const errorInfo: any = {
        message: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
        email: data.email,
        apiUrl: API_BASE_URL,
      };
      
      if (err instanceof Error) {
        errorInfo.stack = err.stack;
        errorInfo.name = err.name;
      }
      
      // Check if it's an axios error with response
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        errorInfo.status = axiosError.response?.status;
        errorInfo.statusText = axiosError.response?.statusText;
        errorInfo.responseData = axiosError.response?.data;
        errorInfo.requestUrl = axiosError.config?.url;
        errorInfo.baseURL = axiosError.config?.baseURL;
      }
      
      // Persistent error logging
      const errorLog = `[LOGIN ERROR] ${new Date().toISOString()}\n${JSON.stringify(errorInfo, null, 2)}`;
      console.error("%c" + errorLog, "background: #222; color: #ff6b6b; padding: 5px; font-size: 12px;");
      console.error("Full error object:", err);
      
      // Store in localStorage
      if (typeof window !== "undefined") {
        const logs = JSON.parse(localStorage.getItem("login_logs") || "[]");
        logs.push({ timestamp: new Date().toISOString(), action: "error", error: errorInfo });
        localStorage.setItem("login_logs", JSON.stringify(logs.slice(-10)));
      }
      
      setErrorDetails(errorInfo);
      if (err instanceof Error) {
        setError(err.message || "Invalid email or password. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80"
          alt="Modern home"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-slate-900/70 to-secondary/60 backdrop-blur-[2px]" />
      </div>
      
      <div className="w-full max-w-md relative z-10 p-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Building2 className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-primary">{APP_NAME}</span>
          </Link>
        </div>

        <Card variant="elevated" className="border-0 shadow-xl">
          <CardHeader className="text-center pb-0">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {infoMessage && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <p className="text-orange-800 text-sm font-medium mb-2">{infoMessage}</p>
                  <p className="text-orange-700 text-xs">
                    Don't have an account yet?{" "}
                    <Link href="/auth/register" className="font-semibold underline hover:text-orange-900">
                      Sign up first
                    </Link>
                    , then come back here to login and complete your provider registration.
                  </p>
                </div>
              )}
              
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-destructive font-medium text-sm mb-1">Login Failed</p>
                      <p className="text-destructive text-sm">{error}</p>
                      {errorDetails && (
                        <button
                          type="button"
                          onClick={() => setShowDetails(!showDetails)}
                          className="mt-2 text-xs text-destructive/80 hover:text-destructive underline"
                        >
                          {showDetails ? "Hide" : "Show"} technical details
                        </button>
                      )}
                    </div>
                  </div>
                  {showDetails && errorDetails && (
                    <div className="mt-3 p-3 bg-black/50 rounded text-xs font-mono text-white/80 overflow-auto max-h-60">
                      <div className="mb-2 font-semibold text-white">Error Details:</div>
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(errorDetails, null, 2)}
                      </pre>
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <div className="text-white/60 text-xs">
                          <div>API URL: {errorDetails.apiUrl || API_BASE_URL}</div>
                          {errorDetails.status && <div>Status: {errorDetails.status} {errorDetails.statusText}</div>}
                          {errorDetails.requestUrl && <div>Request: {errorDetails.baseURL}{errorDetails.requestUrl}</div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="Enter your password"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-input"
                  />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <Button 
                  variant="outline" 
                  type="button"
                  className="w-full"
                  onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-primary font-medium hover:underline"
              >
                Sign up for free
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
