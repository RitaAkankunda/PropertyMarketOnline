"use client";

import { useState } from "react";
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
  Upload,
} from "lucide-react";
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
import { providerService } from "@/services";
import { APP_NAME, SERVICE_PROVIDER_CATEGORIES } from "@/lib/constants";
import type { ServiceType } from "@/types";

const providerSchema = z.object({
  businessName: z.string().min(3, "Business name must be at least 3 characters"),
  serviceTypes: z.array(z.string()).min(1, "Select at least one service type"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  pricingType: z.enum(["hourly", "fixed", "custom"]),
  hourlyRate: z.number().optional(),
  minimumCharge: z.number().optional(),
  city: z.string().min(2, "City is required"),
  district: z.string().optional(),
  serviceRadius: z.number().min(1, "Service radius is required"),
  availableDays: z.array(z.string()).min(1, "Select at least one available day"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

type ProviderFormData = z.infer<typeof providerSchema>;

const daysOfWeek = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const pricingOptions = [
  { value: "hourly", label: "Hourly Rate" },
  { value: "fixed", label: "Fixed Price" },
  { value: "custom", label: "Custom Quote" },
];

export default function ProviderRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      pricingType: "hourly",
      serviceRadius: 10,
    },
  });

  const pricingType = watch("pricingType");

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

  const onSubmit = async (data: ProviderFormData) => {
    try {
      setError(null);
      
      await providerService.register({
        businessName: data.businessName,
        serviceTypes: data.serviceTypes as ServiceType[],
        description: data.description,
        pricing: {
          type: data.pricingType,
          hourlyRate: data.hourlyRate,
          minimumCharge: data.minimumCharge,
          currency: "UGX",
        },
        availability: {
          days: data.availableDays,
          startTime: data.startTime,
          endTime: data.endTime,
        },
        location: {
          city: data.city,
          district: data.district,
          serviceRadius: data.serviceRadius,
        },
      });

      router.push("/dashboard?success=provider_registered");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Registration failed. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/providers"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Providers
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Become a Service Provider</h1>
          </div>
          <p className="text-muted-foreground">
            Join our platform and connect with thousands of property owners
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: "Business Info" },
              { num: 2, title: "Services & Pricing" },
              { num: 3, title: "Location & Hours" },
              { num: 4, title: "Review" },
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                      currentStep >= step.num
                        ? "bg-primary text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {currentStep > step.num ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className="text-xs text-center font-medium">
                    {step.title}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step.num ? "bg-primary" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-6">
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Step 1: Business Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Business Information
                    </h3>
                    <div className="space-y-4">
                      <Input
                        label="Business Name"
                        placeholder="e.g., John's Electrical Services"
                        icon={<Building2 className="h-4 w-4" />}
                        error={errors.businessName?.message}
                        {...register("businessName")}
                      />

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Business Description *
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border rounded-md min-h-[120px]"
                          placeholder="Describe your services, experience, and what makes your business unique..."
                          {...register("description")}
                        />
                        {errors.description && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.description.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={nextStep}>
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Services & Pricing */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Services & Pricing
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          Select Services You Provide *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {SERVICE_PROVIDER_CATEGORIES.map((category) => (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => toggleService(category.value)}
                              className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                                selectedServices.includes(category.value)
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {category.label}
                            </button>
                          ))}
                        </div>
                        {errors.serviceTypes && (
                          <p className="text-sm text-destructive mt-2">
                            {errors.serviceTypes.message}
                          </p>
                        )}
                      </div>

                      <Select
                        label="Pricing Type"
                        placeholder="Select pricing type"
                        options={pricingOptions}
                        value={pricingType}
                        onChange={(value) =>
                          setValue("pricingType", value as "hourly" | "fixed" | "custom")
                        }
                        error={errors.pricingType?.message}
                      />

                      {pricingType === "hourly" && (
                        <Input
                          type="number"
                          label="Hourly Rate (UGX)"
                          placeholder="50000"
                          icon={<DollarSign className="h-4 w-4" />}
                          error={errors.hourlyRate?.message}
                          {...register("hourlyRate", { valueAsNumber: true })}
                        />
                      )}

                      {pricingType === "fixed" && (
                        <Input
                          type="number"
                          label="Minimum Charge (UGX)"
                          placeholder="100000"
                          icon={<DollarSign className="h-4 w-4" />}
                          error={errors.minimumCharge?.message}
                          {...register("minimumCharge", { valueAsNumber: true })}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Previous
                    </Button>
                    <Button type="button" onClick={nextStep}>
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Location & Hours */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Location & Availability
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="City"
                          placeholder="Kampala"
                          icon={<MapPin className="h-4 w-4" />}
                          error={errors.city?.message}
                          {...register("city")}
                        />
                        <Input
                          label="District (Optional)"
                          placeholder="Nakawa"
                          error={errors.district?.message}
                          {...register("district")}
                        />
                      </div>

                      <Input
                        type="number"
                        label="Service Radius (km)"
                        placeholder="10"
                        error={errors.serviceRadius?.message}
                        {...register("serviceRadius", { valueAsNumber: true })}
                      />

                      <div>
                        <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Available Days *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {daysOfWeek.map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleDay(day.value)}
                              className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                                selectedDays.includes(day.value)
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                        {errors.availableDays && (
                          <p className="text-sm text-destructive mt-2">
                            {errors.availableDays.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="time"
                          label="Start Time"
                          error={errors.startTime?.message}
                          {...register("startTime")}
                        />
                        <Input
                          type="time"
                          label="End Time"
                          error={errors.endTime?.message}
                          {...register("endTime")}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Previous
                    </Button>
                    <Button type="button" onClick={nextStep}>
                      Review
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Review Your Information
                    </h3>

                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium mb-2">Business Information</h4>
                        <p className="text-sm text-muted-foreground">
                          Review and confirm all details before submitting
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg space-y-3 text-sm">
                        <div>
                          <span className="font-medium">Business Name: </span>
                          <span>{watch("businessName")}</span>
                        </div>
                        <div>
                          <span className="font-medium">Services: </span>
                          <span>{selectedServices.join(", ")}</span>
                        </div>
                        <div>
                          <span className="font-medium">Location: </span>
                          <span>
                            {watch("city")}
                            {watch("district") && `, ${watch("district")}`}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Pricing: </span>
                          <span>
                            {pricingType === "hourly" && `UGX ${watch("hourlyRate")}/hr`}
                            {pricingType === "fixed" && `From UGX ${watch("minimumCharge")}`}
                            {pricingType === "custom" && "Custom Quote"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Previous
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                      Complete Registration
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>

        {/* Benefits Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Grow Your Business</h3>
              <p className="text-sm text-muted-foreground">
                Reach thousands of potential clients
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">Get Verified</h3>
              <p className="text-sm text-muted-foreground">
                Build trust with verified badge
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold mb-2">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">
                Get paid safely and on time
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
