"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Button, Input, Select, Textarea, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES, LISTING_TYPES, LOCATIONS } from "@/lib/constants";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    title: "",
    propertyType: "",
    listingType: "",
    description: "",

    // Location
    city: "",
    district: "",
    sector: "",
    address: "",

    // Features
    bedrooms: "",
    bathrooms: "",
    size: "",
    sizeUnit: "sqm",
    parking: "",
    yearBuilt: "",
    furnished: false,
    amenities: [] as string[],

    // Photos
    images: [] as { id: string; url: string; file?: File }[],

    // Pricing
    price: "",
    currency: "UGX",
    negotiable: false,
  });

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
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
    // TODO: Submit to API
    console.log("Submitting:", formData);
    alert("Listing submitted successfully! (Demo)");
  };

  const propertyTypeOptions = [
    { value: "", label: "Select Property Type" },
    ...PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label })),
  ];

  const listingTypeOptions = [
    { value: "", label: "Select Listing Type" },
    ...LISTING_TYPES.map((t) => ({ value: t.value, label: t.label })),
  ];

  const cityOptions = [
    { value: "", label: "Select City" },
    ...LOCATIONS.map((loc) => ({ value: loc.value, label: loc.label })),
  ];

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
                      City/Province *
                    </label>
                    <Select
                      options={cityOptions}
                      value={formData.city}
                      onChange={(value) => updateFormData("city", value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      District *
                    </label>
                    <Input
                      placeholder="e.g., Gasabo"
                      value={formData.district}
                      onChange={(e) => updateFormData("district", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sector *
                  </label>
                  <Input
                    placeholder="e.g., Remera"
                    value={formData.sector}
                    onChange={(e) => updateFormData("sector", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Street Address
                  </label>
                  <Input
                    placeholder="e.g., KG 123 Street, House 45"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Features</h2>
              <p className="text-slate-500 mb-6">Add details about your property</p>

              <div className="space-y-6">
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
              <p className="text-slate-500 mb-6">How much do you want for your property?</p>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Price *
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
                      {[formData.sector, formData.district, formData.city]
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
                    <span className="text-slate-500">Size</span>
                    <span className="font-medium text-slate-900">
                      {formData.size ? `${formData.size} ${formData.sizeUnit}` : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Furnished</span>
                    <span className="font-medium text-slate-900">
                      {formData.furnished ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Photos</span>
                    <span className="font-medium text-slate-900">
                      {formData.images.length} images
                    </span>
                  </div>
                  {formData.amenities.length > 0 && (
                    <div className="py-3 border-b">
                      <span className="text-slate-500 block mb-2">Amenities</span>
                      <div className="flex flex-wrap gap-2">
                        {formData.amenities.map((amenity) => (
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
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Publish Listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
