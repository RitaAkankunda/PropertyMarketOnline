"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Plus,
  MapPin,
  Home,
  Check,
  Info,
  ImagePlus,
  AlertCircle,
} from "lucide-react";
import { Button, Input, Select, Textarea, Card, Badge } from "@/components/ui";
import { useToastContext } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES, LISTING_TYPES, LOCATIONS, HOTEL_AMENITIES, HOTEL_ROOM_TYPES, UGANDA_REGIONS, UGANDA_CITIES, UGANDA_DISTRICTS } from "@/lib/constants";
import { propertyService } from "@/services";
import { useAuthStore } from "@/store";
import { useRequireRole } from "@/hooks/use-auth";

const steps = [
  { id: 1, title: "Basic Info", description: "Property type & listing details" },
  { id: 2, title: "Location", description: "Where is your property?" },
  { id: 3, title: "Features", description: "Size, rooms & amenities" },
  { id: 4, title: "Photos", description: "Add property images" },
  { id: 5, title: "Pricing", description: "Set your price" },
  { id: 6, title: "Review", description: "Review & submit" },
];

const amenitiesList = [
  "Swimming Pool",
  "Garden",
  "Security",
  "Backup Generator",
  "Water Tank",
  "Air Conditioning",
  "Internet Ready",
  "Balcony",
  "Garage",
  "Parking",
  "Gym",
  "Elevator",
  "Laundry Room",
  "Storage",
  "Servant Quarters",
  "CCTV",
  "Solar Power",
  "Borehole",
];

export default function CreateListingPage() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  // Protect route: Only LISTER, PROPERTY_MANAGER, ADMIN can create listings
  const { hasAccess } = useRequireRole(
    ['lister', 'property_manager', 'admin'],
    '/'
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    title: "",
    propertyType: "",
    listingType: "",
    description: "",

    // Location
    region: "",
    city: "",
    district: "",
    county: "",
    subcounty: "",
    parish: "",
    village: "",

    // Features
    bedrooms: "",
    bathrooms: "",
    size: "",
    sizeUnit: "sqm",
    parking: "",
    yearBuilt: "",
    furnished: false,
    amenities: [] as string[],

    // Hotel-specific fields
    totalRooms: "",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    starRating: "",
    hotelAmenities: [] as string[],

    // Land-specific fields
    landUseType: "",
    topography: "",
    roadAccess: false,
    waterAvailability: false,
    electricityAvailability: false,
    titleType: "",
    soilQuality: "",

    // Commercial-specific fields
    totalFloors: "",
    frontageWidth: "",
    ceilingHeight: "",
    loadingBays: "",
    footTrafficLevel: "",
    threePhasePower: false,
    hvacSystem: false,
    fireSafety: false,

    // Warehouse-specific fields
    clearHeight: "",
    loadingDocks: "",
    driveInAccess: false,
    floorLoadCapacity: "",
    columnSpacing: "",
    officeArea: "",
    coldStorage: false,
    rampAccess: false,

    // Office-specific fields
    workstationCapacity: "",
    meetingRooms: "",
    receptionArea: false,
    elevator: false,
    conferenceRoom: false,
    serverRoom: false,
    cafeteria: false,

    // Photos
    images: [] as { id: string; url: string; file?: File }[],

    // Pricing - Common
    price: "",
    currency: "UGX",
    negotiable: false,

    // Airbnb pricing
    nightlyRate: "",
    weeklyRate: "",
    monthlyRate: "",
    cleaningFee: "",
    securityDeposit: "",

    // Hotel pricing
    standardRoomRate: "",
    peakSeasonRate: "",
    offPeakSeasonRate: "",

    // Land pricing
    pricePerAcre: "",
    pricePerHectare: "",
    totalLandPrice: "",

    // Commercial pricing
    pricePerSqm: "",
    serviceCharge: "",
    commercialDeposit: "",

    // Warehouse pricing
    warehouseLeaseRate: "",
    warehousePricePerSqm: "",
    warehouseDeposit: "",
    utilitiesIncluded: false,

    // Office pricing
    pricePerWorkstation: "",
    officePricePerSqm: "",
    sharedFacilitiesCost: "",
    officeUtilitiesIncluded: false,
  });

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    if (formData.propertyType === "hotel") {
      setFormData((prev) => ({
        ...prev,
        hotelAmenities: prev.hotelAmenities.includes(amenity)
          ? prev.hotelAmenities.filter((a) => a !== amenity)
          : [...prev.hotelAmenities, amenity],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        amenities: prev.amenities.includes(amenity)
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        file,
      }));
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    }
  };

  const removeImage = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== id),
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.title || !formData.description || !formData.propertyType || !formData.price) {
      showError("Please fill in all required fields (Title, Description, Property Type, and Price).");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload images first if any exist
      let uploadedImageUrls: string[] = [];
      if (formData.images.length > 0) {
        const filesToUpload = formData.images.map(img => img.file).filter(Boolean) as File[];
        if (filesToUpload.length > 0) {
          console.log(`Uploading ${filesToUpload.length} images...`);
          uploadedImageUrls = await propertyService.uploadImages(filesToUpload);
          console.log("Images uploaded successfully:", uploadedImageUrls);
        }
      }

      // Prepare data for API
      const propertyData = {
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        price: parseFloat(formData.price),
        currency: formData.currency,
        location: {
          region: formData.region,
          city: formData.city,
          district: formData.district,
          county: formData.county,
          subcounty: formData.subcounty,
          parish: formData.parish,
          village: formData.village,
          country: "Uganda",
          // Default coordinates for Kampala if not provided
          latitude: 0.3476,
          longitude: 32.5825,
        },
        // Hotel-specific fields
        ...(formData.propertyType === "hotel" && {
          totalRooms: formData.totalRooms ? parseInt(formData.totalRooms) : undefined,
          starRating: formData.starRating ? parseInt(formData.starRating) : undefined,
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
        }),
        
        // Land-specific fields
        ...(formData.propertyType === "land" && {
          landUseType: formData.landUseType,
          topography: formData.topography,
          roadAccess: formData.roadAccess,
          waterAvailability: formData.waterAvailability,
          electricityAvailability: formData.electricityAvailability,
          titleType: formData.titleType,
          soilQuality: formData.soilQuality,
        }),

        // Commercial-specific fields
        ...(formData.propertyType === "commercial" && {
          totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
          frontageWidth: formData.frontageWidth ? parseFloat(formData.frontageWidth) : undefined,
          ceilingHeight: formData.ceilingHeight ? parseFloat(formData.ceilingHeight) : undefined,
          loadingBays: formData.loadingBays ? parseInt(formData.loadingBays) : undefined,
          footTrafficLevel: formData.footTrafficLevel,
          threePhasePower: formData.threePhasePower,
          hvacSystem: formData.hvacSystem,
          fireSafety: formData.fireSafety,
        }),

        // Warehouse-specific fields
        ...(formData.propertyType === "warehouse" && {
          clearHeight: formData.clearHeight ? parseFloat(formData.clearHeight) : undefined,
          loadingDocks: formData.loadingDocks ? parseInt(formData.loadingDocks) : undefined,
          driveInAccess: formData.driveInAccess,
          floorLoadCapacity: formData.floorLoadCapacity ? parseFloat(formData.floorLoadCapacity) : undefined,
          columnSpacing: formData.columnSpacing ? parseFloat(formData.columnSpacing) : undefined,
          officeArea: formData.officeArea ? parseFloat(formData.officeArea) : undefined,
          coldStorage: formData.coldStorage,
          rampAccess: formData.rampAccess,
        }),

        // Office-specific fields
        ...(formData.propertyType === "office" && {
          workstationCapacity: formData.workstationCapacity ? parseInt(formData.workstationCapacity) : undefined,
          meetingRooms: formData.meetingRooms ? parseInt(formData.meetingRooms) : undefined,
          receptionArea: formData.receptionArea,
          elevator: formData.elevator,
          conferenceRoom: formData.conferenceRoom,
          serverRoom: formData.serverRoom,
          cafeteria: formData.cafeteria,
        }),

        // Residential-specific fields (for House, Apartment, Condo, Villa, Airbnb)
        ...(["house", "apartment", "condo", "villa", "airbnb"].includes(formData.propertyType) && {
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          parking: formData.parking ? parseInt(formData.parking) : undefined,
          furnished: formData.furnished,
        }),

        // Common fields for all property types
        area: formData.size ? parseFloat(formData.size) : undefined,
        areaUnit: formData.sizeUnit,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
        amenities: formData.propertyType === "hotel" ? formData.hotelAmenities : formData.amenities,
        images: uploadedImageUrls, // Use the uploaded image URLs
      };

      const createdProperty = await propertyService.createProperty(propertyData);
      
      console.log("Property created successfully:", createdProperty);
      console.log("Created property ID:", createdProperty?.id);
      console.log("Created property type:", createdProperty?.propertyType);
      
      if (!createdProperty?.id) {
        throw new Error("Property was created but no ID was returned from the server");
      }
      
      success("Listing submitted successfully! Your property is now live.", 5000);
      
      // Redirect to properties list filtered by the property type so user can see their listing
      const propertyType = createdProperty.propertyType || formData.propertyType || "apartment";
      // Map singular to plural for URL
      const propertyTypeMap: Record<string, string> = {
        apartment: "apartments",
        house: "houses",
        villa: "villas",
        office: "offices",
        land: "land",
        commercial: "commercial",
        airbnb: "airbnb",
      };
      const urlType = propertyTypeMap[propertyType] || propertyType;
      
      setTimeout(() => {
        router.push(`/properties?type=${urlType}`);
      }, 2000);
    } catch (err: any) {
      console.error("Failed to submit listing:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      // Show more specific error message
      let errorMessage = "Failed to submit listing. Please try again.";
      
      // Check if backend is not running (HTML response or connection refused)
      if (err.message?.includes("HTML instead of JSON") || 
          err.message?.includes("Cannot connect to backend") ||
          err.code === "ECONNREFUSED" ||
          err.message?.includes("Network Error")) {
        errorMessage = "Backend server is not running. Please start the backend server on port 3002 and try again.";
      } else if (err.response) {
        // API returned an error response
        const status = err.response.status;
        const message = err.response.data?.message || err.response.data?.error || err.response.data?.error?.message;
        
        // Log full error details
        console.error("Full error response data:", JSON.stringify(err.response.data, null, 2));
        
        if (status === 401) {
          errorMessage = "You need to be logged in to create a listing. Please log in and try again.";
        } else if (status === 403) {
          errorMessage = "You don't have permission to create listings. Please contact support.";
        } else if (status === 400) {
          errorMessage = message || "Invalid data. Please check all fields and try again.";
        } else if (status === 500) {
          // Show more details for 500 errors
          const errorDetails = err.response.data?.error || err.response.data?.message || "Server error";
          errorMessage = `Server error: ${errorDetails}. Please check the backend logs and try again.`;
          console.error("500 Error details:", errorDetails);
        } else if (message) {
          errorMessage = message;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "Unable to connect to server. Please check if the backend is running on port 3002.";
      }
      
      showError(errorMessage, 8000);
      setIsSubmitting(false);
    }
  };

  const propertyTypeOptions = [
    { value: "", label: "Select Property Type" },
    ...PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label })),
  ];

  const listingTypeOptions = [
    { value: "", label: "Select Listing Type" },
    ...LISTING_TYPES.map((t) => ({ value: t.value, label: t.label })),
  ];

  // Memoize location options to prevent re-renders with new array references
  const regionOptions = useMemo(
    () => [
      { value: "", label: "Select Region" },
      ...UGANDA_REGIONS.map((region) => ({ value: region.value, label: region.label })),
    ],
    []
  );

  const cityOptions = useMemo(
    () => [
      { value: "", label: "Select City" },
      ...UGANDA_CITIES.map((city) => ({ value: city.value, label: city.label })),
    ],
    []
  );

  const districtOptions = useMemo(
    () => [
      { value: "", label: "Select District" },
      ...UGANDA_DISTRICTS.map((district) => ({ value: district.value, label: district.label })),
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=2000&q=80"
            alt="Real estate"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 to-slate-900/80" />
        </div>
        <div className="relative z-10 border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/properties"
                className="inline-flex items-center text-white/80 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Link>
              <h1 className="text-lg font-semibold text-white">Create New Listing</h1>
              <div className="w-20" />
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="relative z-10 py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                        currentStep === step.id
                          ? "bg-blue-600 text-white"
                          : currentStep > step.id
                          ? "bg-green-500 text-white"
                          : "bg-white/20 text-white/60"
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2 hidden md:block",
                        currentStep >= step.id ? "text-white font-medium" : "text-white/50"
                      )}
                    >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 md:w-16 lg:w-24 h-1 mx-2 rounded",
                      currentStep > step.id ? "bg-green-500" : "bg-white/20"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Basic Information</h2>
              <p className="text-slate-500 mb-6">Tell us about your property</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Property Title *
                  </label>
                  <Input
                    placeholder="e.g., Modern 3-Bedroom Apartment in Kampala"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Create an attractive title that describes your property
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Property Type *
                    </label>
                    <Select
                      options={propertyTypeOptions}
                      value={formData.propertyType}
                      onChange={(value) => updateFormData("propertyType", value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Listing Type *
                    </label>
                    <Select
                      options={listingTypeOptions}
                      value={formData.listingType}
                      onChange={(value) => updateFormData("listingType", value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <Textarea
                    placeholder="Describe your property in detail. Include information about the neighborhood, nearby amenities, unique features, etc."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Minimum 100 characters. Good descriptions get more views.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Location</h2>
              <p className="text-slate-500 mb-6">Where is your property located?</p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Region *
                    </label>
                    <Select
                      options={regionOptions}
                      value={formData.region}
                      onChange={(value) => updateFormData("region", value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City *
                    </label>
                    <Select
                      options={cityOptions}
                      value={formData.city}
                      onChange={(value) => updateFormData("city", value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      District *
                    </label>
                    <Select
                      options={districtOptions}
                      value={formData.district}
                      onChange={(value) => updateFormData("district", value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      County/Municipality
                    </label>
                    <Input
                      placeholder="e.g., Kampala County"
                      value={formData.county}
                      onChange={(e) => updateFormData("county", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subcounty/Division
                    </label>
                    <Input
                      placeholder="e.g., Kampala Sub County"
                      value={formData.subcounty}
                      onChange={(e) => updateFormData("subcounty", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Parish/Ward
                    </label>
                    <Input
                      placeholder="e.g., Kampala Parish"
                      value={formData.parish}
                      onChange={(e) => updateFormData("parish", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Village/Zone
                  </label>
                  <Input
                    placeholder="e.g., Kololo Zone"
                    value={formData.village}
                    onChange={(e) => updateFormData("village", e.target.value)}
                  />
                </div>

                {/* Map Placeholder */}
                <div className="border-2 border-dashed rounded-xl p-8 text-center">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">Pin location on map</p>
                  <p className="text-xs text-slate-400">Coming soon: Click on map to set exact location</p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Features */}
          {currentStep === 3 && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {formData.propertyType === "hotel" ? "Hotel Details" :
                 formData.propertyType === "land" ? "Land Details" :
                 formData.propertyType === "commercial" ? "Commercial Property Details" :
                 formData.propertyType === "warehouse" ? "Warehouse Details" :
                 formData.propertyType === "office" ? "Office Space Details" :
                 "Property Features"}
              </h2>
              <p className="text-slate-500 mb-6">
                Add details about your {formData.propertyType || "property"}
              </p>

              <div className="space-y-6">
                {/* Hotel-specific fields */}
                {formData.propertyType === "hotel" ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Total Rooms *
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 50"
                          min="1"
                          value={formData.totalRooms}
                          onChange={(e) => updateFormData("totalRooms", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Star Rating (1-5)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 4"
                          min="1"
                          max="5"
                          value={formData.starRating}
                          onChange={(e) => updateFormData("starRating", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Year Built
                        </label>
                        <Input
                          type="number"
                          placeholder="2020"
                          value={formData.yearBuilt}
                          onChange={(e) => updateFormData("yearBuilt", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Check-in Time *
                        </label>
                        <Input
                          type="time"
                          value={formData.checkInTime}
                          onChange={(e) => updateFormData("checkInTime", e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-1">Typical: 2:00 PM</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Check-out Time *
                        </label>
                        <Input
                          type="time"
                          value={formData.checkOutTime}
                          onChange={(e) => updateFormData("checkOutTime", e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-1">Typical: 11:00 AM</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Property Size (optional)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="number"
                          placeholder="e.g., 5000"
                          value={formData.size}
                          onChange={(e) => updateFormData("size", e.target.value)}
                        />
                        <Select
                          options={[
                            { value: "sqm", label: "Square Meters (sqm)" },
                            { value: "sqft", label: "Square Feet (sqft)" },
                            { value: "acres", label: "Acres" },
                            { value: "hectares", label: "Hectares" },
                          ]}
                          value={formData.sizeUnit}
                          onChange={(value) => updateFormData("sizeUnit", value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Hotel Amenities
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {HOTEL_AMENITIES.map((amenity) => (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition",
                              formData.hotelAmenities.includes(amenity)
                                ? "bg-blue-50 border-blue-500 text-blue-700"
                                : "border-slate-200 hover:border-blue-500"
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center",
                                formData.hotelAmenities.includes(amenity)
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-slate-300"
                              )}
                            >
                              {formData.hotelAmenities.includes(amenity) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : formData.propertyType === "land" ? (
                  <>
                    {/* Land-specific fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Land Area *
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 5"
                          value={formData.size}
                          onChange={(e) => updateFormData("size", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Area Unit *
                        </label>
                        <Select
                          options={[
                            { value: "acres", label: "Acres" },
                            { value: "hectares", label: "Hectares" },
                            { value: "sqm", label: "Square Meters" },
                          ]}
                          value={formData.sizeUnit}
                          onChange={(value) => updateFormData("sizeUnit", value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Land Use Type *
                        </label>
                        <Select
                          options={[
                            { value: "", label: "Select Land Use" },
                            { value: "agricultural", label: "Agricultural" },
                            { value: "residential", label: "Residential" },
                            { value: "commercial", label: "Commercial" },
                            { value: "industrial", label: "Industrial" },
                            { value: "mixed", label: "Mixed Use" },
                          ]}
                          value={formData.landUseType}
                          onChange={(value) => updateFormData("landUseType", value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Topography
                        </label>
                        <Select
                          options={[
                            { value: "", label: "Select Topography" },
                            { value: "flat", label: "Flat" },
                            { value: "sloped", label: "Sloped" },
                            { value: "hilly", label: "Hilly" },
                            { value: "valley", label: "Valley" },
                          ]}
                          value={formData.topography}
                          onChange={(value) => updateFormData("topography", value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Title Type
                        </label>
                        <Select
                          options={[
                            { value: "", label: "Select Title Type" },
                            { value: "freehold", label: "Freehold" },
                            { value: "leasehold", label: "Leasehold" },
                            { value: "mailo", label: "Mailo" },
                          ]}
                          value={formData.titleType}
                          onChange={(value) => updateFormData("titleType", value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Soil Quality (for agricultural land)
                        </label>
                        <Input
                          placeholder="e.g., Loamy, fertile"
                          value={formData.soilQuality}
                          onChange={(e) => updateFormData("soilQuality", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Available Utilities
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="roadAccess"
                            checked={formData.roadAccess}
                            onChange={(e) => updateFormData("roadAccess", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="roadAccess" className="text-slate-700">
                            Road Access
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="waterAvailability"
                            checked={formData.waterAvailability}
                            onChange={(e) => updateFormData("waterAvailability", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="waterAvailability" className="text-slate-700">
                            Water Availability
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="electricityAvailability"
                            checked={formData.electricityAvailability}
                            onChange={(e) => updateFormData("electricityAvailability", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="electricityAvailability" className="text-slate-700">
                            Electricity Availability
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                ) : formData.propertyType === "commercial" ? (
                  <>
                    {/* Commercial-specific fields */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Total Floor Area *
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 500"
                          value={formData.size}
                          onChange={(e) => updateFormData("size", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Number of Floors
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 2"
                          min="1"
                          value={formData.totalFloors}
                          onChange={(e) => updateFormData("totalFloors", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Frontage Width (meters)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 15"
                          value={formData.frontageWidth}
                          onChange={(e) => updateFormData("frontageWidth", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Ceiling Height (meters)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 3.5"
                          step="0.1"
                          value={formData.ceilingHeight}
                          onChange={(e) => updateFormData("ceilingHeight", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Loading Bays
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.loadingBays}
                          onChange={(e) => updateFormData("loadingBays", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Parking Spaces
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.parking}
                          onChange={(e) => updateFormData("parking", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Foot Traffic Level
                        </label>
                        <Select
                          options={[
                            { value: "", label: "Select Level" },
                            { value: "low", label: "Low" },
                            { value: "medium", label: "Medium" },
                            { value: "high", label: "High" },
                            { value: "very_high", label: "Very High" },
                          ]}
                          value={formData.footTrafficLevel}
                          onChange={(value) => updateFormData("footTrafficLevel", value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Year Built
                        </label>
                        <Input
                          type="number"
                          placeholder="2020"
                          value={formData.yearBuilt}
                          onChange={(e) => updateFormData("yearBuilt", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Features & Amenities
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="threePhasePower"
                            checked={formData.threePhasePower}
                            onChange={(e) => updateFormData("threePhasePower", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="threePhasePower" className="text-slate-700">
                            3-Phase Power Available
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="hvacSystem"
                            checked={formData.hvacSystem}
                            onChange={(e) => updateFormData("hvacSystem", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="hvacSystem" className="text-slate-700">
                            HVAC System
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="fireSafety"
                            checked={formData.fireSafety}
                            onChange={(e) => updateFormData("fireSafety", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="fireSafety" className="text-slate-700">
                            Fire Safety Systems
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                ) : formData.propertyType === "warehouse" ? (
                  <>
                    {/* Warehouse-specific fields */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Total Floor Area *
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 2000"
                          value={formData.size}
                          onChange={(e) => updateFormData("size", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Clear Height (meters) *
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 8"
                          step="0.1"
                          value={formData.clearHeight}
                          onChange={(e) => updateFormData("clearHeight", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Loading Docks
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.loadingDocks}
                          onChange={(e) => updateFormData("loadingDocks", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Floor Load Capacity (kg/sqm)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 1000"
                          value={formData.floorLoadCapacity}
                          onChange={(e) => updateFormData("floorLoadCapacity", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Column Spacing (meters)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 10"
                          step="0.1"
                          value={formData.columnSpacing}
                          onChange={(e) => updateFormData("columnSpacing", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Office Area (sqm)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 100"
                          value={formData.officeArea}
                          onChange={(e) => updateFormData("officeArea", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Parking Spaces
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.parking}
                          onChange={(e) => updateFormData("parking", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Year Built
                        </label>
                        <Input
                          type="number"
                          placeholder="2020"
                          value={formData.yearBuilt}
                          onChange={(e) => updateFormData("yearBuilt", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Warehouse Features
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="driveInAccess"
                            checked={formData.driveInAccess}
                            onChange={(e) => updateFormData("driveInAccess", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="driveInAccess" className="text-slate-700">
                            Drive-In Access
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="coldStorage"
                            checked={formData.coldStorage}
                            onChange={(e) => updateFormData("coldStorage", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="coldStorage" className="text-slate-700">
                            Cold Storage Capability
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="rampAccess"
                            checked={formData.rampAccess}
                            onChange={(e) => updateFormData("rampAccess", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="rampAccess" className="text-slate-700">
                            Ramp Access
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                ) : formData.propertyType === "office" ? (
                  <>
                    {/* Office-specific fields */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Total Floor Area *
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 300"
                          value={formData.size}
                          onChange={(e) => updateFormData("size", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Number of Floors
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 1"
                          min="1"
                          value={formData.totalFloors}
                          onChange={(e) => updateFormData("totalFloors", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Workstation Capacity
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 20"
                          value={formData.workstationCapacity}
                          onChange={(e) => updateFormData("workstationCapacity", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Meeting Rooms
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.meetingRooms}
                          onChange={(e) => updateFormData("meetingRooms", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Parking Spaces
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.parking}
                          onChange={(e) => updateFormData("parking", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Year Built
                        </label>
                        <Input
                          type="number"
                          placeholder="2020"
                          value={formData.yearBuilt}
                          onChange={(e) => updateFormData("yearBuilt", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Office Features
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="receptionArea"
                            checked={formData.receptionArea}
                            onChange={(e) => updateFormData("receptionArea", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="receptionArea" className="text-slate-700">
                            Reception Area
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="elevator"
                            checked={formData.elevator}
                            onChange={(e) => updateFormData("elevator", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="elevator" className="text-slate-700">
                            Elevator/Lift
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="conferenceRoom"
                            checked={formData.conferenceRoom}
                            onChange={(e) => updateFormData("conferenceRoom", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="conferenceRoom" className="text-slate-700">
                            Conference Room
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="serverRoom"
                            checked={formData.serverRoom}
                            onChange={(e) => updateFormData("serverRoom", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="serverRoom" className="text-slate-700">
                            Server Room
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="cafeteria"
                            checked={formData.cafeteria}
                            onChange={(e) => updateFormData("cafeteria", e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="cafeteria" className="text-slate-700">
                            Cafeteria/Kitchenette
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Standard Amenities
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {["Air Conditioning", "Backup Generator", "Internet Ready", "Security", "CCTV", "Parking"].map((amenity) => (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition",
                              formData.amenities.includes(amenity)
                                ? "bg-blue-50 border-blue-500 text-blue-700"
                                : "border-slate-200 hover:border-blue-500"
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center",
                                formData.amenities.includes(amenity)
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-slate-300"
                              )}
                            >
                              {formData.amenities.includes(amenity) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Regular property fields (House, Apartment, Condo, Villa, Airbnb) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Bedrooms
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.bedrooms}
                          onChange={(e) => updateFormData("bedrooms", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Bathrooms
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.bathrooms}
                          onChange={(e) => updateFormData("bathrooms", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Parking Spots
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.parking}
                          onChange={(e) => updateFormData("parking", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Year Built
                        </label>
                        <Input
                          type="number"
                          placeholder="2020"
                          value={formData.yearBuilt}
                          onChange={(e) => updateFormData("yearBuilt", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Property Size
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 200"
                          value={formData.size}
                          onChange={(e) => updateFormData("size", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Size Unit
                        </label>
                        <Select
                          options={[
                            { value: "sqm", label: "Square Meters (sqm)" },
                            { value: "sqft", label: "Square Feet (sqft)" },
                            { value: "acres", label: "Acres" },
                            { value: "hectares", label: "Hectares" },
                          ]}
                          value={formData.sizeUnit}
                          onChange={(value) => updateFormData("sizeUnit", value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="furnished"
                        checked={formData.furnished}
                        onChange={(e) => updateFormData("furnished", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="furnished" className="text-slate-700">
                        This property is furnished
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Amenities
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {amenitiesList.map((amenity) => (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition",
                              formData.amenities.includes(amenity)
                                ? "bg-blue-50 border-blue-500 text-blue-700"
                                : "border-slate-200 hover:border-blue-500"
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center",
                                formData.amenities.includes(amenity)
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-slate-300"
                              )}
                            >
                              {formData.amenities.includes(amenity) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Step 4: Photos */}
          {currentStep === 4 && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Photos</h2>
              <p className="text-slate-500 mb-6">
                Add high-quality photos of your property. Properties with good photos get 10x more views.
              </p>

              <div className="space-y-6">
                {/* Upload Area */}
                <label className="block">
                  <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                    <ImagePlus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-700 font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-slate-400">
                      PNG, JPG up to 10MB each. First image will be the cover.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <img
                            src={image.url}
                            alt={`Property ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <Badge className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs">
                            Cover Photo
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Tips for great photos:</p>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Take photos during the day with good natural light</li>
                      <li>• Include photos of every room</li>
                      <li>• Show exterior views and outdoor spaces</li>
                      <li>• Make sure rooms are clean and tidy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Step 5: Pricing */}
          {currentStep === 5 && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Set Your Price</h2>
              <p className="text-slate-500 mb-6">
                {formData.propertyType === "airbnb" && "Set your nightly and extended stay rates"}
                {formData.propertyType === "hotel" && "Configure your room rates"}
                {formData.propertyType === "land" && "Set your land pricing"}
                {formData.propertyType === "commercial" && "Set your commercial property pricing"}
                {formData.propertyType === "warehouse" && "Configure your warehouse pricing"}
                {formData.propertyType === "office" && "Set your office space pricing"}
                {!["airbnb", "hotel", "land", "commercial", "warehouse", "office"].includes(formData.propertyType) && 
                  "How much do you want for your property?"}
              </p>

              <div className="space-y-6">
                {/* Residential Properties (House, Apartment, Condo, Villa) */}
                {["house", "apartment", "condo", "villa"].includes(formData.propertyType) && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {formData.listingType === "sale" ? "Sale Price" : "Monthly Rent"} *
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 50000000"
                          value={formData.price}
                          onChange={(e) => updateFormData("price", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Currency
                        </label>
                        <Select
                          options={[
                            { value: "UGX", label: "UGX" },
                            { value: "USD", label: "USD" },
                          ]}
                          value={formData.currency}
                          onChange={(value) => updateFormData("currency", value)}
                        />
                      </div>
                    </div>

                    {formData.price && (
                      <div className="p-4 bg-slate-100 rounded-xl">
                        <p className="text-sm text-slate-500">Your price:</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {formData.currency} {Number(formData.price).toLocaleString()}
                          {formData.listingType === "rent" && (
                            <span className="text-lg font-normal text-slate-500">/month</span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="negotiable"
                        checked={formData.negotiable}
                        onChange={(e) => updateFormData("negotiable", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="negotiable" className="text-slate-700">
                        Price is negotiable
                      </label>
                    </div>
                  </>
                )}

                {/* Airbnb Pricing */}
                {formData.propertyType === "airbnb" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Nightly Rate *
                        </label>
                        <div className="flex gap-2">
                          <Select
                            options={[
                              { value: "UGX", label: "UGX" },
                              { value: "USD", label: "USD" },
                            ]}
                            value={formData.currency}
                            onChange={(value) => updateFormData("currency", value)}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="150000"
                            value={formData.nightlyRate}
                            onChange={(e) => updateFormData("nightlyRate", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Weekly Rate (Optional)
                        </label>
                        <Input
                          type="number"
                          placeholder="900000"
                          value={formData.weeklyRate}
                          onChange={(e) => updateFormData("weeklyRate", e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">7-night discount</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Monthly Rate (Optional)
                        </label>
                        <Input
                          type="number"
                          placeholder="3000000"
                          value={formData.monthlyRate}
                          onChange={(e) => updateFormData("monthlyRate", e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">30-night discount</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Cleaning Fee
                        </label>
                        <Input
                          type="number"
                          placeholder="50000"
                          value={formData.cleaningFee}
                          onChange={(e) => updateFormData("cleaningFee", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Security Deposit
                      </label>
                      <Input
                        type="number"
                        placeholder="500000"
                        value={formData.securityDeposit}
                        onChange={(e) => updateFormData("securityDeposit", e.target.value)}
                      />
                    </div>

                    {formData.nightlyRate && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-2">Pricing Summary:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Per Night:</span>
                            <span className="font-semibold">{formData.currency} {Number(formData.nightlyRate).toLocaleString()}</span>
                          </div>
                          {formData.weeklyRate && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Per Week:</span>
                              <span className="font-semibold">{formData.currency} {Number(formData.weeklyRate).toLocaleString()}</span>
                            </div>
                          )}
                          {formData.monthlyRate && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Per Month:</span>
                              <span className="font-semibold">{formData.currency} {Number(formData.monthlyRate).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Hotel Pricing */}
                {formData.propertyType === "hotel" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Standard Room Rate (per night) *
                        </label>
                        <div className="flex gap-2">
                          <Select
                            options={[
                              { value: "UGX", label: "UGX" },
                              { value: "USD", label: "USD" },
                            ]}
                            value={formData.currency}
                            onChange={(value) => updateFormData("currency", value)}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="200000"
                            value={formData.standardRoomRate}
                            onChange={(e) => updateFormData("standardRoomRate", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Peak Season Rate
                        </label>
                        <Input
                          type="number"
                          placeholder="300000"
                          value={formData.peakSeasonRate}
                          onChange={(e) => updateFormData("peakSeasonRate", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Off-Peak Season Rate
                      </label>
                      <Input
                        type="number"
                        placeholder="150000"
                        value={formData.offPeakSeasonRate}
                        onChange={(e) => updateFormData("offPeakSeasonRate", e.target.value)}
                      />
                    </div>

                    {formData.standardRoomRate && (
                      <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <p className="text-sm font-medium text-purple-900 mb-2">Room Rates:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-purple-700">Standard Rate:</span>
                            <span className="font-semibold">{formData.currency} {Number(formData.standardRoomRate).toLocaleString()}/night</span>
                          </div>
                          {formData.peakSeasonRate && (
                            <div className="flex justify-between">
                              <span className="text-purple-700">Peak Season:</span>
                              <span className="font-semibold">{formData.currency} {Number(formData.peakSeasonRate).toLocaleString()}/night</span>
                            </div>
                          )}
                          {formData.offPeakSeasonRate && (
                            <div className="flex justify-between">
                              <span className="text-purple-700">Off-Peak:</span>
                              <span className="font-semibold">{formData.currency} {Number(formData.offPeakSeasonRate).toLocaleString()}/night</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Land Pricing */}
                {formData.propertyType === "land" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Price per Acre
                        </label>
                        <div className="flex gap-2">
                          <Select
                            options={[
                              { value: "UGX", label: "UGX" },
                              { value: "USD", label: "USD" },
                            ]}
                            value={formData.currency}
                            onChange={(value) => updateFormData("currency", value)}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="50000000"
                            value={formData.pricePerAcre}
                            onChange={(e) => updateFormData("pricePerAcre", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Price per Hectare
                        </label>
                        <Input
                          type="number"
                          placeholder="125000000"
                          value={formData.pricePerHectare}
                          onChange={(e) => updateFormData("pricePerHectare", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Total Land Price *
                      </label>
                      <Input
                        type="number"
                        placeholder="200000000"
                        value={formData.totalLandPrice}
                        onChange={(e) => updateFormData("totalLandPrice", e.target.value)}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Total price for the entire {formData.size} {formData.sizeUnit}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="negotiable-land"
                        checked={formData.negotiable}
                        onChange={(e) => updateFormData("negotiable", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="negotiable-land" className="text-slate-700">
                        Price is negotiable
                      </label>
                    </div>

                    {formData.totalLandPrice && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-sm font-medium text-green-900 mb-2">Land Pricing:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-700">Total Price:</span>
                            <span className="font-semibold text-lg">{formData.currency} {Number(formData.totalLandPrice).toLocaleString()}</span>
                          </div>
                          {formData.pricePerAcre && (
                            <div className="flex justify-between">
                              <span className="text-green-700">Per Acre:</span>
                              <span>{formData.currency} {Number(formData.pricePerAcre).toLocaleString()}</span>
                            </div>
                          )}
                          {formData.pricePerHectare && (
                            <div className="flex justify-between">
                              <span className="text-green-700">Per Hectare:</span>
                              <span>{formData.currency} {Number(formData.pricePerHectare).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Commercial Pricing */}
                {formData.propertyType === "commercial" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {formData.listingType === "sale" ? "Total Price" : "Monthly Lease Rate"} *
                        </label>
                        <div className="flex gap-2">
                          <Select
                            options={[
                              { value: "UGX", label: "UGX" },
                              { value: "USD", label: "USD" },
                            ]}
                            value={formData.currency}
                            onChange={(value) => updateFormData("currency", value)}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="100000000"
                            value={formData.price}
                            onChange={(e) => updateFormData("price", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Price per Sqm
                        </label>
                        <Input
                          type="number"
                          placeholder="50000"
                          value={formData.pricePerSqm}
                          onChange={(e) => updateFormData("pricePerSqm", e.target.value)}
                        />
                      </div>
                    </div>

                    {formData.listingType === "rent" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Service Charge (Monthly)
                            </label>
                            <Input
                              type="number"
                              placeholder="2000000"
                              value={formData.serviceCharge}
                              onChange={(e) => updateFormData("serviceCharge", e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">Maintenance, security, etc.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Security Deposit
                            </label>
                            <Input
                              type="number"
                              placeholder="10000000"
                              value={formData.commercialDeposit}
                              onChange={(e) => updateFormData("commercialDeposit", e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="negotiable-commercial"
                        checked={formData.negotiable}
                        onChange={(e) => updateFormData("negotiable", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="negotiable-commercial" className="text-slate-700">
                        Price is negotiable
                      </label>
                    </div>

                    {formData.price && (
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <p className="text-sm font-medium text-orange-900 mb-2">Commercial Pricing:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-orange-700">
                              {formData.listingType === "sale" ? "Sale Price:" : "Monthly Rent:"}
                            </span>
                            <span className="font-semibold text-lg">{formData.currency} {Number(formData.price).toLocaleString()}</span>
                          </div>
                          {formData.pricePerSqm && (
                            <div className="flex justify-between">
                              <span className="text-orange-700">Per Sqm:</span>
                              <span>{formData.currency} {Number(formData.pricePerSqm).toLocaleString()}</span>
                            </div>
                          )}
                          {formData.serviceCharge && (
                            <div className="flex justify-between">
                              <span className="text-orange-700">Service Charge:</span>
                              <span>{formData.currency} {Number(formData.serviceCharge).toLocaleString()}/month</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Warehouse Pricing */}
                {formData.propertyType === "warehouse" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Monthly Lease Rate *
                        </label>
                        <div className="flex gap-2">
                          <Select
                            options={[
                              { value: "UGX", label: "UGX" },
                              { value: "USD", label: "USD" },
                            ]}
                            value={formData.currency}
                            onChange={(value) => updateFormData("currency", value)}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="15000000"
                            value={formData.warehouseLeaseRate}
                            onChange={(e) => updateFormData("warehouseLeaseRate", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Price per Sqm
                        </label>
                        <Input
                          type="number"
                          placeholder="30000"
                          value={formData.warehousePricePerSqm}
                          onChange={(e) => updateFormData("warehousePricePerSqm", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Security Deposit
                      </label>
                      <Input
                        type="number"
                        placeholder="30000000"
                        value={formData.warehouseDeposit}
                        onChange={(e) => updateFormData("warehouseDeposit", e.target.value)}
                      />
                      <p className="text-xs text-slate-500 mt-1">Typically 2-3 months rent</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="utilities-included"
                        checked={formData.utilitiesIncluded}
                        onChange={(e) => updateFormData("utilitiesIncluded", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="utilities-included" className="text-slate-700">
                        Utilities included in lease rate
                      </label>
                    </div>

                    {formData.warehouseLeaseRate && (
                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                        <p className="text-sm font-medium text-indigo-900 mb-2">Warehouse Pricing:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-indigo-700">Monthly Rent:</span>
                            <span className="font-semibold text-lg">{formData.currency} {Number(formData.warehouseLeaseRate).toLocaleString()}</span>
                          </div>
                          {formData.warehousePricePerSqm && (
                            <div className="flex justify-between">
                              <span className="text-indigo-700">Per Sqm:</span>
                              <span>{formData.currency} {Number(formData.warehousePricePerSqm).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-indigo-700">Utilities:</span>
                            <span>{formData.utilitiesIncluded ? "Included" : "Separate"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Office Pricing */}
                {formData.propertyType === "office" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Monthly Lease Rate *
                        </label>
                        <div className="flex gap-2">
                          <Select
                            options={[
                              { value: "UGX", label: "UGX" },
                              { value: "USD", label: "USD" },
                            ]}
                            value={formData.currency}
                            onChange={(value) => updateFormData("currency", value)}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="10000000"
                            value={formData.price}
                            onChange={(e) => updateFormData("price", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Price per Workstation
                        </label>
                        <Input
                          type="number"
                          placeholder="500000"
                          value={formData.pricePerWorkstation}
                          onChange={(e) => updateFormData("pricePerWorkstation", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Price per Sqm
                        </label>
                        <Input
                          type="number"
                          placeholder="40000"
                          value={formData.officePricePerSqm}
                          onChange={(e) => updateFormData("officePricePerSqm", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Shared Facilities Cost
                        </label>
                        <Input
                          type="number"
                          placeholder="1000000"
                          value={formData.sharedFacilitiesCost}
                          onChange={(e) => updateFormData("sharedFacilitiesCost", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="office-utilities"
                        checked={formData.officeUtilitiesIncluded}
                        onChange={(e) => updateFormData("officeUtilitiesIncluded", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="office-utilities" className="text-slate-700">
                        Utilities & internet included
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="negotiable-office"
                        checked={formData.negotiable}
                        onChange={(e) => updateFormData("negotiable", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="negotiable-office" className="text-slate-700">
                        Price is negotiable
                      </label>
                    </div>

                    {formData.price && (
                      <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                        <p className="text-sm font-medium text-cyan-900 mb-2">Office Pricing:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-cyan-700">Monthly Rent:</span>
                            <span className="font-semibold text-lg">{formData.currency} {Number(formData.price).toLocaleString()}</span>
                          </div>
                          {formData.pricePerWorkstation && (
                            <div className="flex justify-between">
                              <span className="text-cyan-700">Per Workstation:</span>
                              <span>{formData.currency} {Number(formData.pricePerWorkstation).toLocaleString()}</span>
                            </div>
                          )}
                          {formData.officePricePerSqm && (
                            <div className="flex justify-between">
                              <span className="text-cyan-700">Per Sqm:</span>
                              <span>{formData.currency} {Number(formData.officePricePerSqm).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-cyan-700">Utilities & Internet:</span>
                            <span>{formData.officeUtilitiesIncluded ? "Included" : "Separate"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Your Listing</h2>
              <p className="text-slate-500 mb-6">Make sure everything looks good before publishing</p>

              <div className="space-y-6">
                {/* Preview Card */}
                <div className="border rounded-xl overflow-hidden">
                  {formData.images.length > 0 && (
                    <div className="aspect-video">
                      <img
                        src={formData.images[0].url}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {formData.title || "Property Title"}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                      <MapPin className="w-4 h-4" />
                      {[formData.village, formData.parish, formData.district, formData.city]
                        .filter(Boolean)
                        .join(", ") || "Location"}
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formData.currency} {Number(formData.price || 0).toLocaleString()}
                      {formData.listingType === "rent" && (
                        <span className="text-base font-normal text-slate-500">/month</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Details Summary */}
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Property Type</span>
                    <span className="font-medium text-slate-900 capitalize">
                      {formData.propertyType || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Listing Type</span>
                    <span className="font-medium text-slate-900 capitalize">
                      For {formData.listingType || "-"}
                    </span>
                  </div>

                  {/* Location Details */}
                  <div className="py-3 border-b">
                    <span className="text-slate-500 block mb-2">Location</span>
                    <div className="space-y-1 text-sm">
                      {formData.region && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Region:</span>
                          <span className="font-medium text-slate-900">{formData.region}</span>
                        </div>
                      )}
                      {formData.city && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">City:</span>
                          <span className="font-medium text-slate-900">{formData.city}</span>
                        </div>
                      )}
                      {formData.district && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">District:</span>
                          <span className="font-medium text-slate-900">{formData.district}</span>
                        </div>
                      )}
                      {formData.county && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">County:</span>
                          <span className="font-medium text-slate-900">{formData.county}</span>
                        </div>
                      )}
                      {formData.subcounty && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Subcounty:</span>
                          <span className="font-medium text-slate-900">{formData.subcounty}</span>
                        </div>
                      )}
                      {formData.parish && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Parish:</span>
                          <span className="font-medium text-slate-900">{formData.parish}</span>
                        </div>
                      )}
                      {formData.village && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Village:</span>
                          <span className="font-medium text-slate-900">{formData.village}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hotel-specific display */}
                  {formData.propertyType === "hotel" && (
                    <>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Total Rooms</span>
                        <span className="font-medium text-slate-900">
                          {formData.totalRooms || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Star Rating</span>
                        <span className="font-medium text-slate-900">
                          {formData.starRating ? `${formData.starRating} ⭐` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Check-in Time</span>
                        <span className="font-medium text-slate-900">
                          {formData.checkInTime || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Check-out Time</span>
                        <span className="font-medium text-slate-900">
                          {formData.checkOutTime || "-"}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Land-specific display */}
                  {formData.propertyType === "land" && (
                    <>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Land Use Type</span>
                        <span className="font-medium text-slate-900">
                          {formData.landUseType || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Topography</span>
                        <span className="font-medium text-slate-900">
                          {formData.topography || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Title Type</span>
                        <span className="font-medium text-slate-900">
                          {formData.titleType || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Soil Quality</span>
                        <span className="font-medium text-slate-900">
                          {formData.soilQuality || "-"}
                        </span>
                      </div>
                      <div className="py-3 border-b">
                        <span className="text-slate-500 block mb-2">Utilities</span>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center">
                            <span className="text-slate-600">Road Access:</span>
                            <span className="ml-2 font-medium">
                              {formData.roadAccess ? "✓" : "✗"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-600">Water:</span>
                            <span className="ml-2 font-medium">
                              {formData.waterAvailability ? "✓" : "✗"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-600">Electricity:</span>
                            <span className="ml-2 font-medium">
                              {formData.electricityAvailability ? "✓" : "✗"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Commercial-specific display */}
                  {formData.propertyType === "commercial" && (
                    <>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Total Floors</span>
                        <span className="font-medium text-slate-900">
                          {formData.totalFloors || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Frontage Width</span>
                        <span className="font-medium text-slate-900">
                          {formData.frontageWidth ? `${formData.frontageWidth}m` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Ceiling Height</span>
                        <span className="font-medium text-slate-900">
                          {formData.ceilingHeight ? `${formData.ceilingHeight}m` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Loading Bays</span>
                        <span className="font-medium text-slate-900">
                          {formData.loadingBays || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Foot Traffic Level</span>
                        <span className="font-medium text-slate-900 capitalize">
                          {formData.footTrafficLevel || "-"}
                        </span>
                      </div>
                      <div className="py-3 border-b">
                        <span className="text-slate-500 block mb-2">Features</span>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center">
                            <span className="text-slate-600">3-Phase Power:</span>
                            <span className="ml-2 font-medium">
                              {formData.threePhasePower ? "✓" : "✗"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-600">HVAC:</span>
                            <span className="ml-2 font-medium">
                              {formData.hvacSystem ? "✓" : "✗"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-600">Fire Safety:</span>
                            <span className="ml-2 font-medium">
                              {formData.fireSafety ? "✓" : "✗"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Warehouse-specific display */}
                  {formData.propertyType === "warehouse" && (
                    <>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Clear Height</span>
                        <span className="font-medium text-slate-900">
                          {formData.clearHeight ? `${formData.clearHeight}m` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Loading Docks</span>
                        <span className="font-medium text-slate-900">
                          {formData.loadingDocks || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Floor Load Capacity</span>
                        <span className="font-medium text-slate-900">
                          {formData.floorLoadCapacity ? `${formData.floorLoadCapacity} kg/m²` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Column Spacing</span>
                        <span className="font-medium text-slate-900">
                          {formData.columnSpacing ? `${formData.columnSpacing}m` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Office Area</span>
                        <span className="font-medium text-slate-900">
                          {formData.officeArea ? `${formData.officeArea}m²` : "-"}
                        </span>
                      </div>
                      <div className="py-3 border-b">
                        <span className="text-slate-500 block mb-2">Features</span>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center">
                            <span className="text-slate-600">Drive-in Access:</span>
                            <span className="ml-2 font-medium">
                              {formData.driveInAccess ? "✓" : "✗"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-600">Cold Storage:</span>
                            <span className="ml-2 font-medium">
                              {formData.coldStorage ? "✓" : "✗"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-600">Ramp Access:</span>
                            <span className="ml-2 font-medium">
                              {formData.rampAccess ? "✓" : "✗"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Office-specific display */}
                  {formData.propertyType === "office" && (
                    <>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Workstation Capacity</span>
                        <span className="font-medium text-slate-900">
                          {formData.workstationCapacity || "-"} workstations
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Meeting Rooms</span>
                        <span className="font-medium text-slate-900">
                          {formData.meetingRooms || "-"}
                        </span>
                      </div>
                      <div className="py-3 border-b">
                        <span className="text-slate-500 block mb-2">Amenities</span>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center">
                            <span className="text-slate-600">Reception Area:</span>
                            <span className="ml-2 font-medium">
                              {formData.receptionArea ? "✓" : "✗"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-600">Elevator:</span>
                            <span className="ml-2 font-medium">
                              {formData.elevator ? "✓" : "✗"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-600">Conference Room:</span>
                            <span className="ml-2 font-medium">
                              {formData.conferenceRoom ? "✓" : "✗"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="py-3 border-b">
                        <span className="text-slate-500 block mb-2">Facilities</span>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center">
                            <span className="text-slate-600">Server Room:</span>
                            <span className="ml-2 font-medium">
                              {formData.serverRoom ? "✓" : "✗"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-600">Cafeteria:</span>
                            <span className="ml-2 font-medium">
                              {formData.cafeteria ? "✓" : "✗"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Residential-specific display (House, Apartment, Condo, Villa, Airbnb) */}
                  {["house", "apartment", "condo", "villa", "airbnb"].includes(formData.propertyType) && (
                    <>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Bedrooms</span>
                        <span className="font-medium text-slate-900">
                          {formData.bedrooms || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Bathrooms</span>
                        <span className="font-medium text-slate-900">
                          {formData.bathrooms || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-slate-500">Parking</span>
                        <span className="font-medium text-slate-900">
                          {formData.parking || "-"} spots
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Size</span>
                    <span className="font-medium text-slate-900">
                      {formData.size ? `${formData.size} ${formData.sizeUnit}` : "-"}
                    </span>
                  </div>
                  {formData.propertyType !== "hotel" && (
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-slate-500">Furnished</span>
                      <span className="font-medium text-slate-900">
                        {formData.furnished ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Photos</span>
                    <span className="font-medium text-slate-900">
                      {formData.images.length} images
                    </span>
                  </div>
                  {(formData.amenities.length > 0 || formData.hotelAmenities.length > 0) && (
                    <div className="py-3 border-b">
                      <span className="text-slate-500 block mb-2">
                        {formData.propertyType === "hotel" ? "Hotel Amenities" : "Amenities"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(formData.propertyType === "hotel" 
                          ? formData.hotelAmenities 
                          : formData.amenities
                        ).map((amenity) => (
                          <Badge key={amenity} variant="secondary">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Ready to publish</p>
                      <p className="text-sm text-green-700">
                        Your listing will be reviewed by our team and published within 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button onClick={nextStep}>
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publish Listing
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
