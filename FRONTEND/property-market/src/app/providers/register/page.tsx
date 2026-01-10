"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Shield,
  TrendingUp,
  User,
  Mail,
  Lock,
  Phone,
} from "lucide-react";
import { providerService } from "@/services";
import { APP_NAME, SERVICE_PROVIDER_CATEGORIES } from "@/lib/constants";
import type { ServiceType } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth.store";

// Schema for account creation (when not logged in)
const accountSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
});

// Schema for provider registration
const providerSchema = z.object({
  businessName: z.string().min(3, "Business name must be at least 3 characters"),
  serviceTypes: z.array(z.string()).min(1, "Select at least one service type"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  pricingType: z.enum(["hourly", "fixed", "custom"]),
  hourlyRate: z.preprocess(
    (val) => {
      // Convert empty string, null, or NaN to undefined
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.union([
      z.number().min(1, "Hourly rate must be greater than 0"),
      z.undefined(),
    ]).optional()
  ),
  minimumCharge: z.preprocess(
    (val) => {
      // Convert empty string, null, or NaN to undefined
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.union([
      z.number().min(1, "Minimum charge must be greater than 0"),
      z.undefined(),
    ]).optional()
  ),
  city: z.string().min(2, "City is required"),
  district: z.string().optional(),
  serviceRadius: z.number().min(1, "Service radius is required"),
  availableDays: z.array(z.string()).min(1, "Select at least one available day"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
}).superRefine((data, ctx) => {
  // If pricing type is hourly, hourlyRate is required
  if (data.pricingType === "hourly") {
    if (data.hourlyRate === undefined || data.hourlyRate === null || isNaN(data.hourlyRate) || data.hourlyRate <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hourly rate is required when pricing type is hourly",
        path: ["hourlyRate"],
      });
    }
  }
  // If pricing type is fixed, minimumCharge is required
  if (data.pricingType === "fixed") {
    if (data.minimumCharge === undefined || data.minimumCharge === null || isNaN(data.minimumCharge) || data.minimumCharge <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimum charge is required when pricing type is fixed",
        path: ["minimumCharge"],
      });
    }
  }
});

// Combined schema for complete registration
const completeProviderSchema = accountSchema.merge(providerSchema);

type ProviderFormData = z.infer<typeof providerSchema>;
type CompleteProviderFormData = z.infer<typeof completeProviderSchema>;

const daysOfWeek = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

const pricingOptions = [
  { value: "hourly", label: "Hourly Rate" },
  { value: "fixed", label: "Fixed Price" },
  { value: "custom", label: "Custom Quote" },
];

// Steps when user is not logged in (includes account creation)
const stepsWithAccount = [
  { num: 0, title: "Account Info", icon: User },
  { num: 1, title: "Business Info", icon: Briefcase },
  { num: 2, title: "Services & Pricing", icon: DollarSign },
  { num: 3, title: "Location & Hours", icon: MapPin },
  { num: 4, title: "Review", icon: FileText },
];

// Steps when user is already logged in
const stepsWithoutAccount = [
  { num: 1, title: "Business Info", icon: Briefcase },
  { num: 2, title: "Services & Pricing", icon: DollarSign },
  { num: 3, title: "Location & Hours", icon: MapPin },
  { num: 4, title: "Review", icon: FileText },
];

export default function ProviderRegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshProfile, token, user, login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 if not logged in, 1 if logged in
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Determine which steps to use and starting step
  // Wait for auth to load before determining if account is needed
  // This ensures we correctly detect logged-in users
  const needsAccount = authLoading ? true : !isAuthenticated;
  const steps = needsAccount ? stepsWithAccount : stepsWithoutAccount;

  // Use appropriate schema based on auth status
  // Update schema when auth state changes
  const formSchema = needsAccount ? completeProviderSchema : providerSchema;
  // Use union type for form data to handle both logged-in and not logged-in cases
  type FormData = ProviderFormData | CompleteProviderFormData;

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const {
    register: registerField,
    handleSubmit,
    watch: watchAny,
    setValue,
    formState: { errors: errorsAny, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      pricingType: "hourly",
      serviceRadius: 10,
      startTime: "08:00",
      endTime: "17:00",
    } as any,
  });

  // Cast watch, errors, and register to any to allow accessing fields that may not exist in all form variants
  const watch = watchAny as (name: string) => any;
  const errors = errorsAny as Record<string, any>;
  const register = registerField as any;

  // Update form schema when auth state changes
  useEffect(() => {
    if (!authLoading) {
      console.log("[PROVIDER REGISTRATION] Auth state determined:", {
        isAuthenticated,
        needsAccount,
        userEmail: user?.email,
        userRole: user?.role,
      });
    }
  }, [authLoading, isAuthenticated, needsAccount, user]);

  // Pre-fill user data when logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !needsAccount) {
      // Pre-fill user information if available (for display purposes, not for submission)
      // The form will use the authenticated user's data from the backend
      console.log("[PROVIDER REGISTRATION] User is logged in:", {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      });
    }
  }, [authLoading, isAuthenticated, user, needsAccount]);

  // Initialize step based on auth status (only on mount, not when auth changes)
  useEffect(() => {
    if (!authLoading && !isSuccess) {
      const startingStep = needsAccount ? 0 : 1;
      setCurrentStep(startingStep);
      console.log("[PROVIDER REGISTRATION] Initialized with step:", startingStep, {
        needsAccount,
        isAuthenticated,
        userRole: user?.role,
      });
    }
  }, [authLoading]); // Only depend on authLoading to prevent reset on auth state change

  // Show loading state while checking auth (AFTER all hooks)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const pricingType = watch("pricingType");
  // Calculate progress: if not logged in, step 0 is account creation, so adjust calculation
  const progress = needsAccount 
    ? ((currentStep + 1) / steps.length) * 100 
    : (currentStep / (steps.length - 1)) * 100;

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(newDays);
    setValue("availableDays", newDays);
  };

  const toggleService = (service: string) => {
    const newServices = selectedServices.includes(service)
      ? selectedServices.filter((s) => s !== service)
      : [...selectedServices, service];
    setSelectedServices(newServices);
    setValue("serviceTypes", newServices);
  };

  const onSubmit = async (data: FormData) => {
    console.log('[PROVIDER REGISTRATION] Form submitted!', {
      currentStep,
      needsAccount,
      isAuthenticated,
      authLoading,
      dataKeys: Object.keys(data),
      formData: data,
    });
    
    setIsFormSubmitting(true);
    setError(null);

    // Double-check auth state before submitting
    if (authLoading) {
      setError("Please wait while we verify your authentication...");
      setIsFormSubmitting(false);
      return;
    }

    // If user is authenticated but form thinks they need account, use regular registration
    const shouldUseCompleteRegistration = !isAuthenticated && needsAccount;
    
    console.log('[PROVIDER REGISTRATION] Registration type:', {
      shouldUseCompleteRegistration,
      isAuthenticated,
      needsAccount,
    });

    try {
      if (shouldUseCompleteRegistration) {
        // User is not logged in - use complete registration endpoint
        const completeData = data as CompleteProviderFormData;
        console.log("[PROVIDER REGISTRATION] Creating account and provider profile...");
        
        // Validate required fields before sending
        if (!completeData.email || !completeData.password || !completeData.firstName || !completeData.lastName) {
          throw new Error("Please fill in all required account information");
        }
        
        if (!completeData.businessName || !completeData.serviceTypes || completeData.serviceTypes.length === 0) {
          throw new Error("Please provide business name and select at least one service type");
        }
        
        if (!completeData.description || completeData.description.length < 50) {
          throw new Error("Description must be at least 50 characters long");
        }
        
        if (!completeData.availableDays || completeData.availableDays.length === 0) {
          throw new Error("Please select at least one available day");
        }
        
        if (!completeData.city) {
          throw new Error("Please provide a city");
        }
        
        if (!completeData.serviceRadius || completeData.serviceRadius < 1) {
          throw new Error("Service radius must be at least 1 km");
        }
        
        // Validate pricing based on type
        if (completeData.pricingType === "hourly" && (!completeData.hourlyRate || completeData.hourlyRate <= 0)) {
          throw new Error("Please provide an hourly rate when pricing type is hourly");
        }
        
        if (completeData.pricingType === "fixed" && (!completeData.minimumCharge || completeData.minimumCharge <= 0)) {
          throw new Error("Please provide a minimum charge when pricing type is fixed");
        }
        
        console.log('[PROVIDER REGISTRATION] Sending registration data:', {
          email: completeData.email,
          businessName: completeData.businessName,
          serviceTypes: completeData.serviceTypes,
          descriptionLength: completeData.description?.length,
          pricingType: completeData.pricingType,
          hasHourlyRate: !!completeData.hourlyRate,
          hasMinimumCharge: !!completeData.minimumCharge,
          availableDays: completeData.availableDays,
          city: completeData.city,
          serviceRadius: completeData.serviceRadius,
        });
        
        const result = await providerService.registerComplete({
          email: completeData.email,
          password: completeData.password,
          firstName: completeData.firstName,
          lastName: completeData.lastName,
          phone: completeData.phone,
          businessName: completeData.businessName,
          serviceTypes: completeData.serviceTypes as ServiceType[],
          description: completeData.description,
          pricing: {
            type: completeData.pricingType,
            hourlyRate: completeData.hourlyRate,
            minimumCharge: completeData.minimumCharge,
            currency: "UGX",
          },
          availability: {
            days: completeData.availableDays,
            startTime: completeData.startTime,
            endTime: completeData.endTime,
          },
          location: {
            city: completeData.city,
            district: completeData.district,
            serviceRadius: completeData.serviceRadius,
          },
        });

        console.log("[PROVIDER REGISTRATION] Account and provider created!", result);

        // Store token and update auth state directly (don't call login again)
        if (typeof window !== "undefined") {
          localStorage.setItem("token", result.accessToken);
        }
        
        // Update auth state directly with the result from registration
        // This prevents unnecessary redirects and keeps user on success screen
        useAuthStore.setState({
          user: result.user,
          token: result.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // User is already logged in - use regular registration endpoint
        const providerData = data as ProviderFormData;
        console.log("[PROVIDER REGISTRATION] Submitting provider registration...", {
          isAuthenticated,
          hasToken: !!token,
          userRole: user?.role,
        });
        
        const result = await providerService.register({
          businessName: providerData.businessName,
          serviceTypes: providerData.serviceTypes as ServiceType[],
          description: providerData.description,
          pricing: {
            type: providerData.pricingType,
            hourlyRate: providerData.hourlyRate,
            minimumCharge: providerData.minimumCharge,
            currency: "UGX",
          },
          availability: {
            days: providerData.availableDays,
            startTime: providerData.startTime,
            endTime: providerData.endTime,
          },
          location: {
            city: providerData.city,
            district: providerData.district,
            serviceRadius: providerData.serviceRadius,
          },
        });

        console.log("[PROVIDER REGISTRATION] Success!", result);

        // Refresh user profile to get updated role
        if (refreshProfile) {
          await refreshProfile();
        }
      }

      // Show success screen
      setIsSuccess(true);
      setIsFormSubmitting(false);
    } catch (err: unknown) {
      setIsFormSubmitting(false);
      console.error("[PROVIDER REGISTRATION] Error:", err);
      
      // Check if it's an authentication error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        console.error("[PROVIDER REGISTRATION] Error details:", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message
        });
        
        if (axiosError.response?.status === 401) {
          setError("Your session has expired. Please login again and try again.");
          // Don't redirect immediately - let user see the error
          setTimeout(() => {
            localStorage.setItem("returnUrl", "/providers/register");
            router.push("/auth/login?message=Your session expired. Please login again to complete provider registration.");
          }, 3000);
          return;
        }
        
        // Handle 409 Conflict (email already exists)
        if (axiosError.response?.status === 409 || axiosError.response?.status === 400) {
          // Safely extract error message - handle both string and object responses
          let errorMessage: string = "";
          if (axiosError.response?.data?.message) {
            errorMessage = typeof axiosError.response.data.message === 'string' 
              ? axiosError.response.data.message 
              : JSON.stringify(axiosError.response.data.message);
          } else if (axiosError.response?.data) {
            // If data is an object/array, try to extract meaningful message
            if (Array.isArray(axiosError.response.data)) {
              errorMessage = axiosError.response.data.map((e: any) => 
                typeof e === 'string' ? e : e.message || JSON.stringify(e)
              ).join(', ');
            } else if (typeof axiosError.response.data === 'object') {
              errorMessage = axiosError.response.data.message || JSON.stringify(axiosError.response.data);
            } else {
              errorMessage = String(axiosError.response.data);
            }
          } else if (axiosError.message) {
            errorMessage = typeof axiosError.message === 'string' ? axiosError.message : String(axiosError.message);
          }
          
          // Check if error is about email/account
          const errorLower = errorMessage.toLowerCase();
          if (errorLower.includes('email') || errorLower.includes('already exists')) {
            setError("An account with this email already exists. Please login instead, then complete your provider registration.");
          } else {
            setError(errorMessage || "Registration failed. Please check all fields and try again.");
          }
          return;
        }
        
        // Handle other HTTP errors
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
          return;
        }
        
        // Handle network errors
        if (axiosError.code === 'ERR_NETWORK' || axiosError.message?.includes('Network Error')) {
          setError("Cannot connect to server. Please check your internet connection and ensure the backend server is running.");
          return;
        }
      }
      
      if (err instanceof Error) {
        console.error('[PROVIDER REGISTRATION] Error object:', err);
        setError(err.message || "Registration failed. Please try again.");
      } else {
        console.error('[PROVIDER REGISTRATION] Unknown error:', err);
        setError("An error occurred. Please try again. Check the console for details.");
      }
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    const minStep = needsAccount ? 0 : 1;
    if (currentStep > minStep) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 1 && !needsAccount) {
      // Can't go back from step 1 if not logged in (would go to step 0 which doesn't exist)
      return;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Account creation step
        if (!needsAccount) return true;
        return (
          watch("email") &&
          watch("password")?.length >= 8 &&
          watch("firstName")?.length >= 2 &&
          watch("lastName")?.length >= 2
        );
      case 1:
        return watch("businessName") && watch("description")?.length >= 50;
      case 2:
        return selectedServices.length > 0;
      case 3:
        return watch("city") && selectedDays.length > 0 && watch("startTime") && watch("endTime");
      default:
        return true;
    }
  };

  // Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-8 text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Registration Successful! ðŸŽ‰</h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Congratulations! You've successfully registered as a service provider on PropertyMarket Online.
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-8 border border-blue-200 text-left">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              What happens next?
            </h3>
            <ul className="space-y-3 text-sm text-blue-800">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Your profile is now active and visible to customers</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You'll start receiving job requests from customers</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Manage your jobs, earnings, and messages from your dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Get verified to build more trust with customers</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                // Redirect to providers page to see their listing
                router.push("/providers");
                // After a short delay, scroll to their provider card if possible
                setTimeout(() => {
                  // Try to find and highlight their provider
                  const providerCards = document.querySelectorAll('[data-provider-id]');
                  if (providerCards.length > 0) {
                    providerCards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 500);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 transition-all"
            >
              <Briefcase className="w-5 h-5" />
              View My Provider Profile
            </button>
            <button
              onClick={() => router.push("/dashboard/provider")}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Go to Provider Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/providers"
              className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Providers
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b sticky top-[73px] z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              
              return (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all duration-300 ${
                        isActive
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                      )}
                    </div>
                    <span
                      className={`text-xs text-center font-medium transition-colors ${
                        isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-colors ${
                        isCompleted ? "bg-green-500" : currentStep > step.num ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Become a Service Provider</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our platform and connect with thousands of property owners. Get verified, grow your business, and get paid securely.
          </p>
        </div>

        {/* Show logged-in user info */}
        {!needsAccount && isAuthenticated && user && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Registering as: {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  Email: {user.email} â€¢ Role: {user.role}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  âœ“ You're logged in. We'll use your existing account to create your provider profile.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit as any, (errors) => {
          console.error('[PROVIDER REGISTRATION] Form validation errors:', errors);
          setError('Please fill in all required fields correctly.');
          // Scroll to first error
          const firstErrorField = Object.keys(errors)[0];
          if (firstErrorField) {
            const element = document.querySelector(`[name="${firstErrorField}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        })}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {/* Show validation errors summary */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 m-6 rounded-lg">
                <p className="text-sm text-yellow-700 font-semibold mb-2">
                  Please fix the following errors:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-600">
                  {Object.entries(errors).map(([field, error]: [string, any]) => (
                    <li key={field}>
                      {field}: {error?.message || 'Invalid value'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-8">
              {/* Step 0: Account Creation (only if not logged in) */}
              {currentStep === 0 && needsAccount && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
                        <p className="text-gray-500">We'll create your account and provider profile together</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            First Name *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="John"
                              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                errors.firstName ? "border-red-300" : "border-gray-300"
                              }`}
                              {...register("firstName")}
                            />
                          </div>
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Doe"
                              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                errors.lastName ? "border-red-300" : "border-gray-300"
                              }`}
                              {...register("lastName")}
                            />
                          </div>
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              errors.email ? "border-red-300" : "border-gray-300"
                            }`}
                            {...register("email")}
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone Number (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            placeholder="+256 700 000 000"
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            {...register("phone")}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="password"
                            placeholder="Minimum 8 characters"
                            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              errors.password ? "border-red-300" : "border-gray-300"
                            }`}
                            {...register("password")}
                          />
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Password must be at least 8 characters long
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Business Info */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
                        <p className="text-gray-500">Tell us about your business</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Building2 className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="e.g., John's Electrical Services"
                            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              errors.businessName ? "border-red-300" : "border-gray-300"
                            }`}
                            {...register("businessName")}
                          />
                        </div>
                        {errors.businessName && (
                          <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Description *
                        </label>
                        <textarea
                          placeholder="Describe your services, experience, certifications, and what makes your business unique. Minimum 50 characters."
                          rows={6}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                            errors.description ? "border-red-300" : "border-gray-300"
                          }`}
                          {...register("description")}
                        />
                        <div className="mt-2 flex justify-between items-center">
                          {errors.description ? (
                            <p className="text-sm text-red-600">{errors.description.message}</p>
                          ) : (
                            <p className="text-xs text-gray-500">
                              {watch("description")?.length || 0} / 50 characters minimum
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Services & Pricing */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Services & Pricing</h2>
                        <p className="text-gray-500">Select your services and set your rates</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Select Services You Provide *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {SERVICE_PROVIDER_CATEGORIES.map((category) => {
                            const isSelected = selectedServices.includes(category.value);
                            return (
                              <button
                                key={category.value}
                                type="button"
                                onClick={() => toggleService(category.value)}
                                className={`p-4 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                {category.label}
                              </button>
                            );
                          })}
                        </div>
                        {errors.serviceTypes && (
                          <p className="mt-2 text-sm text-red-600">{errors.serviceTypes.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Pricing Type *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {pricingOptions.map((option) => {
                            const isSelected = pricingType === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setValue("pricingType", option.value as "hourly" | "fixed" | "custom")}
                                className={`p-4 border-2 rounded-xl text-sm font-medium transition-all ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {pricingType === "hourly" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Hourly Rate (UGX) *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="number"
                              placeholder="50000"
                              min="1"
                              step="1"
                              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.hourlyRate ? "border-red-300" : "border-gray-300"
                              }`}
                              {...register("hourlyRate", { 
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                          {errors.hourlyRate && (
                            <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>
                          )}
                        </div>
                      )}

                      {pricingType === "fixed" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Minimum Charge (UGX) *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="number"
                              placeholder="100000"
                              min="1"
                              step="1"
                              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.minimumCharge ? "border-red-300" : "border-gray-300"
                              }`}
                              {...register("minimumCharge", { 
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                          {errors.minimumCharge && (
                            <p className="mt-1 text-sm text-red-600">{errors.minimumCharge.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Location & Hours */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Location & Availability</h2>
                        <p className="text-gray-500">Where you operate and when you're available</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            City *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Kampala"
                              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.city ? "border-red-300" : "border-gray-300"
                              }`}
                              {...register("city")}
                            />
                          </div>
                          {errors.city && (
                            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            District (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Nakawa"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            {...register("district")}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Service Radius (km) *
                        </label>
                        <input
                          type="number"
                          placeholder="10"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.serviceRadius ? "border-red-300" : "border-gray-300"
                          }`}
                          {...register("serviceRadius", { valueAsNumber: true })}
                        />
                        {errors.serviceRadius && (
                          <p className="mt-1 text-sm text-red-600">{errors.serviceRadius.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Available Days *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {daysOfWeek.map((day) => {
                            const isSelected = selectedDays.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(day.value)}
                                className={`p-3 border-2 rounded-xl text-sm font-medium transition-all ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                        {errors.availableDays && (
                          <p className="mt-2 text-sm text-red-600">{errors.availableDays.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Start Time *
                          </label>
                          <input
                            type="time"
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.startTime ? "border-red-300" : "border-gray-300"
                            }`}
                            {...register("startTime")}
                          />
                          {errors.startTime && (
                            <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            End Time *
                          </label>
                          <input
                            type="time"
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.endTime ? "border-red-300" : "border-gray-300"
                            }`}
                            {...register("endTime")}
                          />
                          {errors.endTime && (
                            <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>
                        <p className="text-gray-500">Please review all details before submitting</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Business Information
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Business Name:</span>
                            <span className="font-medium text-gray-900">{watch("businessName")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Services:</span>
                            <span className="font-medium text-gray-900">{selectedServices.join(", ")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium text-gray-900">
                              {watch("city")}
                              {watch("district") && `, ${watch("district")}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service Radius:</span>
                            <span className="font-medium text-gray-900">{watch("serviceRadius")} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pricing:</span>
                            <span className="font-medium text-gray-900">
                              {pricingType === "hourly" && `UGX ${watch("hourlyRate")?.toLocaleString()}/hr`}
                              {pricingType === "fixed" && `From UGX ${watch("minimumCharge")?.toLocaleString()}`}
                              {pricingType === "custom" && "Custom Quote"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Available Days:</span>
                            <span className="font-medium text-gray-900">{selectedDays.length} days selected</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Working Hours:</span>
                            <span className="font-medium text-gray-900">
                              {watch("startTime")} - {watch("endTime")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t bg-gray-50 px-8 py-6 flex justify-between items-center">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === (needsAccount ? 0 : 1)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || isFormSubmitting}
                  onClick={(e) => {
                    console.log('[PROVIDER REGISTRATION] Button clicked!', {
                      isSubmitting,
                      isFormSubmitting,
                      errors: Object.keys(errors),
                      currentStep,
                      needsAccount,
                      isAuthenticated,
                    });
                    
                    // Let the form handle validation - don't prevent default
                    // The form's handleSubmit will catch validation errors
                  }}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isSubmitting || isFormSubmitting) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Complete Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Benefits Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Grow Your Business</h3>
            <p className="text-sm text-gray-600">
              Reach thousands of potential clients actively looking for your services
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Get Verified</h3>
            <p className="text-sm text-gray-600">
              Build trust with a verified badge and stand out from competitors
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-sm text-gray-600">
              Get paid safely and on time with our secure payment system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

