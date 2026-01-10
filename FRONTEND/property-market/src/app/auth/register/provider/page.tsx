"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { providerService, authService } from "@/services";
import { useAuthStore } from "@/store";
import type { ServiceType } from "@/types";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Upload,
  Camera,
  Clock,
  DollarSign,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Zap,
  Droplet,
  Hammer,
  Paintbrush,
  Sparkles,
  Truck,
  Shield,
  Home,
  Calculator,
  Scale,
  Wrench,
  TreePine,
  Palette,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Plus,
} from "lucide-react";

// =============================================
// SERVICE CATEGORIES
// =============================================
const SERVICE_CATEGORIES = [
  { id: "electrician", name: "Electrician", icon: Zap },
  { id: "plumber", name: "Plumber", icon: Droplet },
  { id: "carpenter", name: "Carpenter", icon: Hammer },
  { id: "mason", name: "Mason", icon: Home },
  { id: "cleaner", name: "House Cleaner", icon: Sparkles },
  { id: "security", name: "Security Services", icon: Shield },
  { id: "surveyor", name: "Land Surveyor", icon: MapPin },
  { id: "valuer", name: "Property Valuer", icon: Calculator },
  { id: "mover", name: "Movers/Transport", icon: Truck },
  { id: "painter", name: "Painter", icon: Paintbrush },
  { id: "appliance", name: "Appliance Repair", icon: Wrench },
  { id: "roofing", name: "Roofing Expert", icon: Home },
  { id: "interior", name: "Interior Designer", icon: Palette },
  { id: "landscaper", name: "Landscaper", icon: TreePine },
  { id: "lawyer", name: "Lawyer/Conveyancing", icon: Scale },
];

const DAYS_OF_WEEK = [
  { id: "mon", name: "Mon" },
  { id: "tue", name: "Tue" },
  { id: "wed", name: "Wed" },
  { id: "thu", name: "Thu" },
  { id: "fri", name: "Fri" },
  { id: "sat", name: "Sat" },
  { id: "sun", name: "Sun" },
];

const LOCATIONS = [
  "Kampala Central",
  "Kampala - Makindye",
  "Kampala - Nakawa",
  "Kampala - Rubaga",
  "Kampala - Kawempe",
  "Wakiso",
  "Entebbe",
  "Mukono",
  "Jinja",
  "Mbarara",
];

// =============================================
// MAIN REGISTRATION COMPONENT
// =============================================
export default function ProviderRegistration() {
  const router = useRouter();
  const { user, refreshProfile, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize step based on auth status
  useEffect(() => {
    if (!authLoading) {
      // If user is logged in, start at step 1 (Business Info), otherwise step 0 (Personal Info)
      const startingStep = isAuthenticated && user ? 1 : 0;
      setCurrentStep(startingStep);
      console.log("[PROVIDER REGISTRATION] Initialized step:", startingStep, {
        isAuthenticated,
        hasUser: !!user,
        userEmail: user?.email,
      });
    }
  }, [authLoading, isAuthenticated, user]);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    
    // Step 2: Business Info
    businessName: "",
    description: "",
    serviceTypes: [] as string[],
    locations: [] as string[],
    
    // Step 3: Documents & Portfolio
    nationalId: null as File | null,
    certifications: [] as File[],
    portfolioImages: [] as File[],
    
    // Step 4: Pricing
    pricingType: "hourly", // hourly, fixed, custom
    currency: "UGX", // UGX or USD
    hourlyRateUGX: "",
    hourlyRateUSD: "",
    minimumChargeUGX: "",
    minimumChargeUSD: "",
    
    // Step 5: Availability
    availableDays: ["mon", "tue", "wed", "thu", "fri"] as string[],
    startTime: "08:00",
    endTime: "18:00",
    
    // Terms
    agreeTerms: false,
    agreeKYC: false,
  });

  const updateForm = (field: string, value: string | boolean | string[] | File | File[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceId)
        ? prev.serviceTypes.filter(s => s !== serviceId)
        : [...prev.serviceTypes, serviceId]
    }));
  };

  const toggleLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  };

  const toggleDay = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(dayId)
        ? prev.availableDays.filter(d => d !== dayId)
        : [...prev.availableDays, dayId]
    }));
  };

  const handleFileUpload = (field: string, files: FileList | null, multiple = false) => {
    if (!files) return;
    if (multiple) {
      updateForm(field, [...(formData[field as keyof typeof formData] as File[] || []), ...Array.from(files)]);
    } else {
      updateForm(field, files[0]);
    }
  };

  const removeFile = (field: string, index?: number) => {
    if (index !== undefined) {
      const files = formData[field as keyof typeof formData] as File[];
      updateForm(field, files.filter((_, i) => i !== index));
    } else {
      updateForm(field, null);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Step 1: Create user account (if not already logged in)
      if (!user) {
        // Validate account fields
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
          throw new Error("Please fill in all required account information");
        }
        
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        if (formData.password.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }
        
        // Use complete registration endpoint (creates account + provider in one step)
        // This ensures the user gets the correct role immediately
        const hourlyRate = formData.currency === 'UGX' 
          ? (formData.hourlyRateUGX ? parseFloat(formData.hourlyRateUGX) : undefined)
          : (formData.hourlyRateUSD ? parseFloat(formData.hourlyRateUSD) : undefined);
        
        const minimumCharge = formData.currency === 'UGX'
          ? (formData.minimumChargeUGX ? parseFloat(formData.minimumChargeUGX) : undefined)
          : (formData.minimumChargeUSD ? parseFloat(formData.minimumChargeUSD) : undefined);
        
        // Map form service IDs to database service type values
        const serviceTypeMap: Record<string, string> = {
          'electrician': 'electrician',
          'plumber': 'plumber',
          'carpenter': 'carpenter',
          'mason': 'mason',
          'cleaner': 'cleaner',
          'security': 'security_services',
          'surveyor': 'surveyor',
          'valuer': 'valuer',
          'mover': 'mover',
          'painter': 'painter',
          'appliance': 'appliance_repair',
          'roofing': 'roofing',
          'interior': 'interior_designer',
          'landscaper': 'landscaper',
          'lawyer': 'lawyer',
        };
        
        const mappedServiceTypes = formData.serviceTypes.map(id => serviceTypeMap[id] || id);
        
        // Validate provider data
        if (!formData.businessName || formData.businessName.length < 3) {
          throw new Error("Business name must be at least 3 characters");
        }
        
        if (!formData.description || formData.description.length < 50) {
          throw new Error("Description must be at least 50 characters");
        }
        
        if (!mappedServiceTypes || mappedServiceTypes.length === 0) {
          throw new Error("Please select at least one service type");
        }
        
        if (!formData.availableDays || formData.availableDays.length === 0) {
          throw new Error("Please select at least one available day");
        }
        
        const completeRegistrationData = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          businessName: formData.businessName,
          serviceTypes: mappedServiceTypes as ServiceType[],
          description: formData.description,
          pricing: {
            type: formData.pricingType as "hourly" | "fixed" | "custom",
            hourlyRate: hourlyRate,
            minimumCharge: minimumCharge,
            currency: formData.currency || "UGX",
          },
          availability: {
            days: formData.availableDays.map(day => {
              const dayMap: Record<string, string> = {
                'mon': 'monday',
                'tue': 'tuesday',
                'wed': 'wednesday',
                'thu': 'thursday',
                'fri': 'friday',
                'sat': 'saturday',
                'sun': 'sunday',
              };
              return dayMap[day.toLowerCase()] || day;
            }),
            startTime: formData.startTime,
            endTime: formData.endTime,
          },
          location: {
            city: (() => {
              if (formData.locations.length === 0) return "Kampala";
              const location = formData.locations[0];
              if (location.includes(" - ")) {
                return location.split(" - ")[0].trim();
              }
              if (location.toLowerCase().includes("kampala")) {
                return "Kampala";
              }
              return location.split(" ")[0] || "Kampala";
            })(),
            district: (() => {
              if (formData.locations.length === 0) return undefined;
              const location = formData.locations[0];
              if (location.includes(" - ")) {
                return location.split(" - ")[1].trim();
              }
              if (location.toLowerCase().includes("central")) {
                return "Central";
              }
              const parts = location.split(" ");
              if (parts.length > 1) {
                return parts.slice(1).join(" ");
              }
              return undefined;
            })(),
            serviceRadius: 10,
          },
        };
        
        console.log('[PROVIDER REGISTRATION] Using complete registration endpoint...');
        const result = await providerService.registerComplete(completeRegistrationData);
        console.log('[PROVIDER REGISTRATION] Account and provider created successfully:', result);
        
        // Store auth token and update auth state
        if (typeof window !== "undefined") {
          localStorage.setItem("token", result.accessToken);
        }
        useAuthStore.setState({
          user: result.user,
          token: result.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Show success screen
        setIsSuccess(true);
        
        // Redirect to provider dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/provider');
        }, 2000);
        return; // Exit early since we're done
      }
      
      // Step 2: Register as provider (user is already logged in)
      // Determine which rate to use based on currency
      const hourlyRate = formData.currency === 'UGX' 
        ? (formData.hourlyRateUGX ? parseFloat(formData.hourlyRateUGX) : undefined)
        : (formData.hourlyRateUSD ? parseFloat(formData.hourlyRateUSD) : undefined);
      
      const minimumCharge = formData.currency === 'UGX'
        ? (formData.minimumChargeUGX ? parseFloat(formData.minimumChargeUGX) : undefined)
        : (formData.minimumChargeUSD ? parseFloat(formData.minimumChargeUSD) : undefined);
      
      // Map form service IDs to database service type values
      const serviceTypeMap: Record<string, string> = {
        'electrician': 'electrician',
        'plumber': 'plumber',
        'carpenter': 'carpenter',
        'mason': 'mason',
        'cleaner': 'cleaner',
        'security': 'security_services',
        'surveyor': 'surveyor',
        'valuer': 'valuer',
        'mover': 'mover',
        'painter': 'painter',
        'appliance': 'appliance_repair',
        'roofing': 'roofing',
        'interior': 'interior_designer',
        'landscaper': 'landscaper',
        'lawyer': 'lawyer',
      };
      
      // Convert service type IDs to database values
      const mappedServiceTypes = formData.serviceTypes.map(id => serviceTypeMap[id] || id);
      
      const providerData = {
        businessName: formData.businessName,
        serviceTypes: mappedServiceTypes as ServiceType[],
        description: formData.description,
        pricing: {
          type: formData.pricingType as "hourly" | "fixed" | "custom",
          hourlyRate: hourlyRate,
          minimumCharge: minimumCharge,
          currency: formData.currency || "UGX",
        },
        availability: {
          // Convert short day codes to full day names
          days: formData.availableDays.map(day => {
            const dayMap: Record<string, string> = {
              'mon': 'monday',
              'tue': 'tuesday',
              'wed': 'wednesday',
              'thu': 'thursday',
              'fri': 'friday',
              'sat': 'saturday',
              'sun': 'sunday',
            };
            return dayMap[day.toLowerCase()] || day;
          }),
          startTime: formData.startTime,
          endTime: formData.endTime,
        },
        location: {
          // Parse location string to extract city and district
          // Format: "Kampala Central" or "Kampala - Makindye"
          city: (() => {
            if (formData.locations.length === 0) return "Kampala";
            const location = formData.locations[0];
            // If location contains " - ", split it (e.g., "Kampala - Makindye")
            if (location.includes(" - ")) {
              return location.split(" - ")[0].trim();
            }
            // If location contains "Central", "Makindye", etc., extract city
            if (location.toLowerCase().includes("kampala")) {
              return "Kampala";
            }
            // Default to first location or "Kampala"
            return location.split(" ")[0] || "Kampala";
          })(),
          district: (() => {
            if (formData.locations.length === 0) return undefined;
            const location = formData.locations[0];
            // If location contains " - ", use the part after " - " as district
            if (location.includes(" - ")) {
              return location.split(" - ")[1].trim();
            }
            // If location is just "Kampala Central", use "Central" as district
            if (location.toLowerCase().includes("central")) {
              return "Central";
            }
            // Otherwise, try to extract district from location name
            const parts = location.split(" ");
            if (parts.length > 1) {
              return parts.slice(1).join(" ");
            }
            return undefined;
          })(),
          serviceRadius: 10, // Default 10km radius
        },
      };
      
      console.log('[PROVIDER REGISTRATION] Sending provider data:', {
        businessName: providerData.businessName,
        serviceTypes: providerData.serviceTypes,
        descriptionLength: providerData.description?.length,
        pricing: providerData.pricing,
        availability: providerData.availability,
        location: providerData.location,
      });

      // Call backend API to register provider
      const result = await providerService.register(providerData);
      console.log('[PROVIDER REGISTRATION] Provider registered successfully:', result);
      
      // Step 3: Wait a moment for backend to commit role update, then refresh user profile
      console.log('[PROVIDER REGISTRATION] Waiting for role update to commit...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure DB commit
      
      // Refresh user profile to get updated role
      console.log('[PROVIDER REGISTRATION] Refreshing user profile...');
      await refreshProfile();
      
      // Double-check the role was updated
      const updatedUser = useAuthStore.getState().user;
      console.log('[PROVIDER REGISTRATION] User after refresh:', {
        id: updatedUser?.id,
        email: updatedUser?.email,
        role: updatedUser?.role,
      });
      
      if (updatedUser?.role !== 'service_provider') {
        console.warn('[PROVIDER REGISTRATION] Role not updated yet, refreshing again...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshProfile();
        const finalUser = useAuthStore.getState().user;
        console.log('[PROVIDER REGISTRATION] Final user role:', finalUser?.role);
      }
      
      // Show success screen
      setIsSuccess(true);
      
      // Redirect to provider dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/provider');
      }, 2000);
    } catch (err: any) {
      console.error("Provider registration error:", err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });
      
      // Handle specific error cases
      if (err.response?.status === 409 || err.response?.status === 400) {
        // Safely extract error message - handle both string and object responses
        let errorMessage: string = "";
        if (err.response?.data?.message) {
          errorMessage = typeof err.response.data.message === 'string' 
            ? err.response.data.message 
            : JSON.stringify(err.response.data.message);
        } else if (err.response?.data) {
          // If data is an object/array, try to extract meaningful message
          if (Array.isArray(err.response.data)) {
            errorMessage = err.response.data.map((e: any) => 
              typeof e === 'string' ? e : e.message || JSON.stringify(e)
            ).join(', ');
          } else if (typeof err.response.data === 'object') {
            errorMessage = err.response.data.message || JSON.stringify(err.response.data);
          } else {
            errorMessage = String(err.response.data);
          }
        } else if (err.message) {
          errorMessage = typeof err.message === 'string' ? err.message : String(err.message);
        }
        
        // Check if error is about email/account
        const errorLower = errorMessage.toLowerCase();
        if (errorLower.includes('email') || errorLower.includes('already exists')) {
          setError("An account with this email already exists. Please login instead, then register as a provider from your dashboard.");
        } else {
          setError(errorMessage || "Registration failed. Please check all fields and try again.");
        }
      } else {
        // Handle other errors
        const errorMessage = err.response?.data?.message 
          ? (typeof err.response.data.message === 'string' ? err.response.data.message : JSON.stringify(err.response.data.message))
          : (err.message || "Failed to register as provider. Please try again.");
        setError(errorMessage);
      }
      
      setIsSubmitting(false);
    }
  };

  // Adjust total steps based on whether user is logged in
  const totalSteps = isAuthenticated && user ? 4 : 5;
  // Calculate progress: if logged in, steps are 1-4 (0-3 in array), if not, steps are 0-4
  const progress = isAuthenticated && user 
    ? ((currentStep) / 4) * 100 
    : ((currentStep + 1) / 5) * 100;

  // Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-600 mb-6">
            You are now registered as a service provider! Redirecting you to your provider dashboard...
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-blue-800 mb-2">Next Steps:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>â€¢ Complete your profile with photos and certifications</li>
              <li>â€¢ Start receiving job requests from clients</li>
              <li>â€¢ Build your reputation with great service!</li>
            </ul>
          </div>
          <button
            onClick={() => router.push('/dashboard/provider')}
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Provider Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              PropertyMarket
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {isAuthenticated && user ? currentStep : currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {!isAuthenticated && (
              <span className={currentStep >= 0 ? "text-blue-600 font-medium" : ""}>Personal</span>
            )}
            <span className={currentStep >= 1 ? "text-blue-600 font-medium" : ""}>Business</span>
            <span className={currentStep >= 2 ? "text-blue-600 font-medium" : ""}>Documents</span>
            <span className={currentStep >= 3 ? "text-blue-600 font-medium" : ""}>Pricing</span>
            <span className={currentStep >= 4 ? "text-blue-600 font-medium" : ""}>Availability</span>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Logged In Banner */}
        {isAuthenticated && user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  âœ“ You're logged in as {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Email: {user.email} â€¢ We'll use your existing account to create your provider profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* STEP 0: Personal Information (Only if not logged in) */}
        {/* ============================================= */}
        {currentStep === 0 && !isAuthenticated && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-500">Let&apos;s start with your basic details</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateForm("firstName", e.target.value)}
                    placeholder="John"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateForm("lastName", e.target.value)}
                    placeholder="Doe"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" /> Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="john@example.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="+256 7XX XXX XXX"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateForm("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* STEP 1: Business Information */}
        {/* ============================================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
              <p className="text-gray-500">Tell us about your services</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateForm("businessName", e.target.value)}
                  placeholder="e.g., ElectroPro Services"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Describe your services, experience, and what makes you stand out..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Service Types <span className="text-gray-400">(Select all that apply)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SERVICE_CATEGORIES.map((service) => {
                    const Icon = service.icon;
                    const isSelected = formData.serviceTypes.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                          isSelected 
                            ? "border-blue-500 bg-blue-50 text-blue-700" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-1 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                        <span className="text-xs text-center">{service.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 inline mr-1" /> Service Locations
                </label>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((location) => {
                    const isSelected = formData.locations.includes(location);
                    return (
                      <button
                        key={location}
                        type="button"
                        onClick={() => toggleLocation(location)}
                        className={`px-3 py-2 rounded-full text-sm transition-all ${
                          isSelected 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {location}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* STEP 2: Documents & Portfolio */}
        {/* ============================================= */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Documents & Portfolio</h2>
              <p className="text-gray-500">Upload your verification documents</p>
            </div>

            <div className="space-y-6">
              {/* National ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  National ID / Passport <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  {formData.nationalId ? (
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700">{formData.nationalId.name}</span>
                      </div>
                      <button onClick={() => removeFile("nationalId")} className="text-red-500">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400">PNG, JPG, PDF up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload("nationalId", e.target.files)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Required for KYC verification
                </p>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Certifications <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <label className="cursor-pointer">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload certifications, licenses, or qualifications</p>
                    <p className="text-xs text-gray-400">PNG, JPG, PDF up to 5MB each</p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={(e) => handleFileUpload("certifications", e.target.files, true)}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.certifications.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.certifications.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <button onClick={() => removeFile("certifications", index)} className="text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera className="w-4 h-4 inline mr-1" /> Portfolio Images <span className="text-gray-400">(Showcase your work)</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {formData.portfolioImages.map((file, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button 
                        onClick={() => removeFile("portfolioImages", index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.portfolioImages.length < 9 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                      <Plus className="w-8 h-8 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload("portfolioImages", e.target.files, true)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Upload up to 9 images of your previous work</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* STEP 3: Pricing */}
        {/* ============================================= */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
              <p className="text-gray-500">Set your service rates</p>
            </div>

            <div className="space-y-6">
              {/* Pricing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Pricing Model</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "hourly", label: "Per Hour", desc: "Charge by the hour" },
                    { id: "fixed", label: "Per Job", desc: "Fixed project rate" },
                    { id: "custom", label: "Custom", desc: "Quote per request" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateForm("pricingType", option.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.pricingType === option.id 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className={`font-medium ${formData.pricingType === option.id ? "text-blue-700" : "text-gray-900"}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <div className="grid grid-cols-2 gap-3">
                  {["UGX", "USD"].map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => updateForm("currency", curr)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.currency === curr
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate Input */}
              {formData.pricingType === "hourly" && (
                <div>
                  {formData.currency === "UGX" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">UGX</span>
                        <input
                          type="number"
                          value={formData.hourlyRateUGX}
                          onChange={(e) => updateForm("hourlyRateUGX", e.target.value)}
                          placeholder="50,000"
                          className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">/hr</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={formData.hourlyRateUSD}
                          onChange={(e) => updateForm("hourlyRateUSD", e.target.value)}
                          placeholder="15"
                          className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">/hr</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.pricingType === "fixed" && (
                <div>
                  {formData.currency === "UGX" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Starting Rate *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">From UGX</span>
                        <input
                          type="number"
                          value={formData.minimumChargeUGX}
                          onChange={(e) => updateForm("minimumChargeUGX", e.target.value)}
                          placeholder="100,000"
                          className="w-full pl-24 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Starting Rate *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">From $</span>
                        <input
                          type="number"
                          value={formData.minimumChargeUSD}
                          onChange={(e) => updateForm("minimumChargeUSD", e.target.value)}
                          placeholder="30"
                          className="w-full pl-24 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Minimum Charge */}
              <div>
                {formData.currency === "UGX" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Charge</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">UGX</span>
                      <input
                        type="number"
                        value={formData.minimumChargeUGX}
                        onChange={(e) => updateForm("minimumChargeUGX", e.target.value)}
                        placeholder="50,000"
                        className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum amount for any job</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Charge</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.minimumChargeUSD}
                        onChange={(e) => updateForm("minimumChargeUSD", e.target.value)}
                        placeholder="15"
                        className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum amount for any job</p>
                  </div>
                )}
              </div>

              {/* Commission Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Platform Commission</h4>
                <p className="text-sm text-blue-700">
                  PropertyMarket charges a 5% commission on completed jobs. This helps us maintain the platform and provide customer support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* STEP 4: Availability */}
        {/* ============================================= */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Availability</h2>
              <p className="text-gray-500">Set your working schedule</p>
            </div>

            <div className="space-y-6">
              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Available Days</label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = formData.availableDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          isSelected 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {day.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => updateForm("startTime", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0");
                      return <option key={i} value={`${hour}:00`}>{hour}:00</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => updateForm("endTime", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0");
                      return <option key={i} value={`${hour}:00`}>{hour}:00</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* Emergency Availability */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 text-blue-500 rounded" />
                  <div>
                    <p className="font-medium text-gray-900">Available for Emergency Calls</p>
                    <p className="text-sm text-gray-500">Accept urgent jobs outside normal hours (higher rates apply)</p>
                  </div>
                </label>
              </div>

              {/* Terms */}
              <div className="space-y-3 pt-4 border-t">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.agreeTerms}
                    onChange={(e) => updateForm("agreeTerms", e.target.checked)}
                    className="w-5 h-5 text-blue-500 rounded mt-0.5" 
                  />
                  <p className="text-sm text-gray-600">
                    I agree to the <a href="#" className="text-blue-600 underline">Terms of Service</a> and <a href="#" className="text-blue-600 underline">Provider Agreement</a>
                  </p>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.agreeKYC}
                    onChange={(e) => updateForm("agreeKYC", e.target.checked)}
                    className="w-5 h-5 text-blue-500 rounded mt-0.5" 
                  />
                  <p className="text-sm text-gray-600">
                    I consent to KYC verification and understand that my documents will be reviewed
                  </p>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="space-y-3 mt-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSubmitting}
                className="flex-1 py-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            )}
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!formData.agreeTerms || !formData.agreeKYC || isSubmitting}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

