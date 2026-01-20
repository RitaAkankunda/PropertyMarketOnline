"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { useAuth } from "@/hooks";
import { APP_NAME, API_BASE_URL } from "@/lib/constants";

// Simplified schema for service request users
const simplifiedRegisterSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Full schema for regular registration
const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    role: z.enum(["buyer", "renter", "lister", "property_manager"]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
type SimplifiedRegisterFormData = z.infer<typeof simplifiedRegisterSchema>;

const roleOptions = [
  { value: "buyer", label: "Buyer - I want to buy property" },
  { value: "renter", label: "Renter - I want to rent property" },
  { value: "lister", label: "Lister - I want to list property for sale/rent" },
  { value: "property_manager", label: "Property Manager - I manage properties" },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if this is simplified registration (from service request)
  const isSimplified = searchParams.get("simple") === "true";
  const returnUrl = searchParams.get("return") || null;

  // Get query parameters for pre-filling
  const prefillFirstName = searchParams.get("firstName") || "";
  const prefillEmail = searchParams.get("email") || "";
  const prefillPhone = searchParams.get("phone") || "";

  // Use appropriate schema based on mode
  const schema = isSimplified ? simplifiedRegisterSchema : registerSchema;
  type FormData = typeof isSimplified extends true ? SimplifiedRegisterFormData : RegisterFormData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      acceptTerms: false,
      role: isSimplified ? "buyer" : undefined,
      firstName: prefillFirstName,
      email: prefillEmail,
      phone: prefillPhone,
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "",
        password: data.password,
        role: isSimplified ? "buyer" : (data as RegisterFormData).role,
      });
      
      // Redirect based on return URL or default
      if (returnUrl) {
        router.push(returnUrl);
      } else if (isSimplified) {
        // For simplified registration, go back to providers page
        router.push("/providers");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      // Check for 409 Conflict (email already exists)
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 409) {
        setError("An account with this email already exists. Please login instead.");
      } else if (err instanceof Error) {
        setError(err.message || "Registration failed. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = returnUrl 
      ? `/auth/callback?return=${encodeURIComponent(returnUrl)}`
      : isSimplified 
        ? "/auth/callback?return=/providers"
        : "/auth/callback";
    
    // Store return URL in localStorage for callback
    if (returnUrl) {
      localStorage.setItem("returnUrl", returnUrl);
    } else if (isSimplified) {
      localStorage.setItem("returnUrl", "/providers");
    }
    
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
          alt="Luxury property"
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
            <CardTitle className="text-2xl">
              {isSimplified ? "Quick Sign Up" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {isSimplified 
                ? "Create an account to submit your service request"
                : "Join thousands of property seekers and listers"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                  {error.includes("already exists") && (
                    <Link href="/auth/login" className="block mt-2 text-blue-600 hover:underline font-medium">
                      → Click here to login
                    </Link>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  label="First Name"
                  placeholder="John"
                  icon={<User className="h-4 w-4" />}
                  error={errors.firstName?.message}
                  {...register("firstName")}
                />
                <Input
                  type="text"
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.lastName?.message}
                  {...register("lastName")}
                />
              </div>

              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                type="tel"
                label={isSimplified ? "Phone Number" : "Phone Number (Optional)"}
                placeholder="+256 700 000 000"
                icon={<Phone className="h-4 w-4" />}
                error={errors.phone?.message}
                {...register("phone")}
              />

              {!isSimplified && (
                <Select
                  label="I am a..."
                  placeholder="Select your role"
                  options={roleOptions}
                  value={selectedRole}
                  onChange={(value) =>
                    setValue("role", value as RegisterFormData["role"])
                  }
                  error={errors.role?.message}
                />
              )}

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="Create a strong password"
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

              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  className="rounded border-input mt-1"
                  {...register("acceptTerms")}
                />
                <label
                  htmlFor="acceptTerms"
                  className="text-sm text-muted-foreground"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-destructive">
                  {errors.acceptTerms.message}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                Create Account
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
                  onClick={handleGoogleLogin}
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
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
