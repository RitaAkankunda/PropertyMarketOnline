"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { providerService } from "@/services";
import type { ServiceProvider } from "@/types";
import {
  Search,
  MapPin,
  Star,
  Phone,
  MessageCircle,
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
  CheckCircle,
  Users,
  X,
  Calendar,
  Clock,
  CreditCard,
  Smartphone,
  Building,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// =============================================
// SERVICE-SPECIFIC FORM FIELDS
// =============================================
const SERVICE_FORM_FIELDS: Record<string, { label: string; type: string; placeholder: string; options?: string[] }[]> = {
  electrician: [
    { label: "Type of Work", type: "select", placeholder: "Select work type", options: ["New Installation", "Repair", "Maintenance", "Inspection", "Wiring", "Solar Installation"] },
    { label: "Property Type", type: "select", placeholder: "Select property", options: ["Residential", "Commercial", "Industrial"] },
    { label: "Number of Rooms/Areas", type: "number", placeholder: "e.g., 5" },
    { label: "Urgency", type: "select", placeholder: "How urgent?", options: ["Emergency (Today)", "Within 2-3 days", "This week", "Flexible"] },
  ],
  plumber: [
    { label: "Type of Work", type: "select", placeholder: "Select work type", options: ["Leak Repair", "Pipe Installation", "Drain Cleaning", "Water Heater", "Bathroom Fitting", "Septic Tank"] },
    { label: "Property Type", type: "select", placeholder: "Select property", options: ["Residential", "Commercial"] },
    { label: "Number of Fixtures", type: "number", placeholder: "e.g., 3" },
    { label: "Urgency", type: "select", placeholder: "How urgent?", options: ["Emergency (Today)", "Within 2-3 days", "This week", "Flexible"] },
  ],
  carpenter: [
    { label: "Type of Work", type: "select", placeholder: "Select work type", options: ["Furniture Making", "Door/Window Installation", "Cabinet Making", "Repairs", "Roofing", "Flooring"] },
    { label: "Material Preference", type: "select", placeholder: "Select material", options: ["Hardwood", "Softwood", "MDF", "Plywood", "Not Sure"] },
    { label: "Provide Measurements", type: "textarea", placeholder: "Length x Width x Height or attach photo" },
  ],
  mason: [
    { label: "Type of Work", type: "select", placeholder: "Select work type", options: ["New Construction", "Renovation", "Wall Building", "Plastering", "Tiling", "Paving"] },
    { label: "Area Size (sq meters)", type: "number", placeholder: "e.g., 50" },
    { label: "Material", type: "select", placeholder: "Select material", options: ["Bricks", "Blocks", "Stone", "Concrete"] },
  ],
  cleaner: [
    { label: "Type of Cleaning", type: "select", placeholder: "Select type", options: ["Regular Cleaning", "Deep Cleaning", "Move-in/Move-out", "Post-Construction", "Office Cleaning", "Carpet Cleaning"] },
    { label: "Property Size", type: "select", placeholder: "Select size", options: ["Studio/1 Bedroom", "2-3 Bedrooms", "4+ Bedrooms", "Office Space", "Commercial"] },
    { label: "Frequency", type: "select", placeholder: "How often?", options: ["One-time", "Weekly", "Bi-weekly", "Monthly"] },
  ],
  security: [
    { label: "Service Type", type: "select", placeholder: "Select service", options: ["Guard Services", "CCTV Installation", "Alarm Systems", "Access Control", "Event Security", "Consultation"] },
    { label: "Property Type", type: "select", placeholder: "Select property", options: ["Residential", "Commercial", "Event Venue", "Construction Site"] },
    { label: "Duration", type: "select", placeholder: "Contract length", options: ["One-time", "Monthly", "6 Months", "1 Year"] },
  ],
  surveyor: [
    { label: "Survey Type", type: "select", placeholder: "Select type", options: ["Boundary Survey", "Topographic Survey", "Land Subdivision", "Construction Survey", "Title Survey"] },
    { label: "Land Size (acres)", type: "number", placeholder: "e.g., 2" },
    { label: "Location/District", type: "text", placeholder: "Enter location" },
    { label: "Purpose", type: "select", placeholder: "Survey purpose", options: ["Sale/Purchase", "Construction", "Legal Dispute", "Subdivision", "Other"] },
  ],
  valuer: [
    { label: "Valuation Type", type: "select", placeholder: "Select type", options: ["Market Valuation", "Bank Valuation", "Insurance Valuation", "Rental Valuation", "Probate Valuation"] },
    { label: "Property Type", type: "select", placeholder: "Select property", options: ["Residential", "Commercial", "Land", "Industrial", "Agricultural"] },
    { label: "Property Location", type: "text", placeholder: "Enter address" },
    { label: "Purpose", type: "select", placeholder: "Valuation purpose", options: ["Bank Loan", "Sale", "Insurance", "Legal", "Other"] },
  ],
  mover: [
    { label: "Move Type", type: "select", placeholder: "Select type", options: ["Local Move", "Long Distance", "Office Relocation", "Single Items", "Storage"] },
    { label: "From Location", type: "text", placeholder: "Pickup address" },
    { label: "To Location", type: "text", placeholder: "Destination address" },
    { label: "Property Size", type: "select", placeholder: "How much stuff?", options: ["Studio/1 Bedroom", "2-3 Bedrooms", "4+ Bedrooms", "Office", "Few Items Only"] },
    { label: "Need Packing Service?", type: "select", placeholder: "Select", options: ["Yes, full packing", "Partial packing", "No, I'll pack myself"] },
  ],
  painter: [
    { label: "Paint Type", type: "select", placeholder: "Select type", options: ["Interior", "Exterior", "Both", "Touch-up Only"] },
    { label: "Number of Rooms", type: "number", placeholder: "e.g., 4" },
    { label: "Paint Quality", type: "select", placeholder: "Select quality", options: ["Standard", "Premium", "I'll provide paint"] },
    { label: "Surface Prep Needed?", type: "select", placeholder: "Select", options: ["Yes", "No", "Not Sure"] },
  ],
  appliance_repair: [
    { label: "Appliance Type", type: "select", placeholder: "Select appliance", options: ["Refrigerator", "Washing Machine", "TV/Electronics", "Air Conditioner", "Microwave/Oven", "Other"] },
    { label: "Brand", type: "text", placeholder: "e.g., Samsung, LG" },
    { label: "Issue Description", type: "textarea", placeholder: "Describe the problem" },
    { label: "Urgency", type: "select", placeholder: "How urgent?", options: ["Emergency", "Within 2-3 days", "This week", "Flexible"] },
  ],
  roofing: [
    { label: "Service Type", type: "select", placeholder: "Select service", options: ["New Roof", "Repair", "Replacement", "Inspection", "Waterproofing", "Gutter Installation"] },
    { label: "Roof Type", type: "select", placeholder: "Select type", options: ["Iron Sheets", "Tiles", "Concrete", "Thatch", "Not Sure"] },
    { label: "Roof Size (sq meters)", type: "number", placeholder: "e.g., 100" },
  ],
  interior_designer: [
    { label: "Service Type", type: "select", placeholder: "Select service", options: ["Full Design", "Consultation Only", "Room Makeover", "Furniture Selection", "Color Consultation"] },
    { label: "Property Type", type: "select", placeholder: "Select property", options: ["Residential", "Office", "Restaurant/Hotel", "Retail"] },
    { label: "Rooms to Design", type: "text", placeholder: "e.g., Living room, bedroom" },
    { label: "Style Preference", type: "select", placeholder: "Select style", options: ["Modern", "Traditional", "Minimalist", "Luxury", "Not Sure"] },
    { label: "Budget Range", type: "select", placeholder: "Select budget", options: ["Under 5M UGX", "5-10M UGX", "10-20M UGX", "20M+ UGX"] },
  ],
  landscaper: [
    { label: "Service Type", type: "select", placeholder: "Select service", options: ["Garden Design", "Lawn Care", "Tree Planting", "Hardscaping", "Irrigation", "Maintenance"] },
    { label: "Area Size (sq meters)", type: "number", placeholder: "e.g., 200" },
    { label: "Current State", type: "select", placeholder: "Current condition", options: ["Empty Land", "Overgrown", "Needs Refresh", "New Construction"] },
  ],
  lawyer: [
    { label: "Service Type", type: "select", placeholder: "Select service", options: ["Title Transfer", "Land Search", "Contract Review", "Property Dispute", "Lease Agreement", "Due Diligence"] },
    { label: "Property Type", type: "select", placeholder: "Select property", options: ["Land", "House", "Apartment", "Commercial"] },
    { label: "Transaction Value (UGX)", type: "text", placeholder: "e.g., 500,000,000" },
    { label: "Urgency", type: "select", placeholder: "How urgent?", options: ["Urgent (within days)", "Within 2 weeks", "Within a month", "Flexible"] },
  ],
};

// =============================================
// CATEGORIES - All service types in one place
// =============================================
const CATEGORIES = [
  { id: "all", name: "All Services", icon: Users },
  { id: "electrician", name: "Electrician", icon: Zap },
  { id: "plumber", name: "Plumber", icon: Droplet },
  { id: "carpenter", name: "Carpenter", icon: Hammer },
  { id: "mason", name: "Mason", icon: Home },
  { id: "cleaner", name: "House Cleaner", icon: Sparkles },
  { id: "security", name: "Security", icon: Shield },
  { id: "surveyor", name: "Land Surveyor", icon: MapPin },
  { id: "valuer", name: "Property Valuer", icon: Calculator },
  { id: "mover", name: "Movers/Transport", icon: Truck },
  { id: "painter", name: "Painter", icon: Paintbrush },
  { id: "appliance_repair", name: "Appliance Repair", icon: Wrench },
  { id: "roofing", name: "Roofing Expert", icon: Home },
  { id: "interior_designer", name: "Interior Designer", icon: Palette },
  { id: "landscaper", name: "Landscaper", icon: TreePine },
  { id: "lawyer", name: "Lawyer/Conveyancing", icon: Scale },
];

// Helper function to format provider data for display
function formatProviderForDisplay(provider: ServiceProvider) {
  // Map database service type values back to category IDs for display
  // This handles cases where registration mapped IDs to database values
  const serviceTypeToCategoryMap: Record<string, string> = {
    'security_services': 'security',
    'appliance_repair': 'appliance_repair',
    'interior_designer': 'interior_designer',
    // Add other mappings as needed
  };
  
  const rawServiceType = provider.serviceTypes && provider.serviceTypes.length > 0 
    ? provider.serviceTypes[0] 
    : "other";
  
  const primaryService = serviceTypeToCategoryMap[rawServiceType] || rawServiceType;
  
  // Debug logging for missing service types
  if (rawServiceType === "other" || !CATEGORIES.find(c => c.id === primaryService)) {
    console.warn('[PROVIDERS] Provider missing or unmapped service type:', {
      businessName: provider.businessName,
      serviceTypes: provider.serviceTypes,
      rawServiceType,
      primaryService,
      hasCategory: !!CATEGORIES.find(c => c.id === primaryService),
    });
  }
  
  const locationStr = provider.location.district 
    ? `${provider.location.city}, ${provider.location.district}`
    : provider.location.city;
  
  let priceStr = "Custom Quote";
  if (provider.pricing.type === "hourly" && provider.pricing.hourlyRate) {
    priceStr = `UGX ${provider.pricing.hourlyRate.toLocaleString()}/hr`;
  } else if (provider.pricing.type === "fixed" && provider.pricing.minimumCharge) {
    priceStr = `UGX ${provider.pricing.minimumCharge.toLocaleString()}`;
  }

  return {
    id: provider.id,
    name: provider.businessName,
    category: primaryService,
    rating: provider.rating || 0,
    reviews: provider.reviewCount || 0,
    jobs: provider.completedJobs || 0,
    location: locationStr,
    price: priceStr,
    verified: provider.isVerified || false,
    provider: provider, // Keep full provider object for modal
  };
}

// =============================================
// REQUEST FORM MODAL COMPONENT
// =============================================
function RequestFormModal({ 
  provider, 
  onClose 
}: { 
  provider: ServiceProvider; 
  onClose: () => void;
}) {
  const [step, setStep] = useState(1); // 1: Details, 2: Schedule, 3: Payment
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  // Get primary service type for form fields
  const primaryServiceType = provider.serviceTypes[0] || "electrician";
  const category = CATEGORIES.find((c) => c.id === primaryServiceType);
  const Icon = category?.icon || Users;
  const formFields = SERVICE_FORM_FIELDS[primaryServiceType] || [];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Clear any previous errors
    setError(null);

    const newFiles = Array.from(files).filter(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload only image files (PNG, JPG, JPEG)');
        return false;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image "${file.name}" is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (newFiles.length === 0) return;

    // Limit to 10 images
    const filesToAdd = newFiles.slice(0, 10 - images.length);
    if (filesToAdd.length < newFiles.length) {
      setError(`Only ${filesToAdd.length} image(s) added. Maximum 10 images allowed.`);
    }

    const updatedImages = [...images, ...filesToAdd];
    setImages(updatedImages);

    // Create previews
    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(updatedImages);
    setImagePreviews(updatedPreviews);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      const scheduledDate = formData["Preferred Date"] || formData["date"];
      const scheduledTime = formData["Preferred Time"] || formData["time"];
      const serviceAddress = formData["Service Address"] || formData["Location"] || formData["address"];

      if (!scheduledDate || !scheduledTime) {
        setError("Please select a date and time for the service");
        setIsSubmitting(false);
        return;
      }

      if (!serviceAddress) {
        setError("Please provide a service location address");
        setIsSubmitting(false);
        return;
      }

      // Ensure description is not empty
      const description = formData["Additional Notes"] || formData["notes"] || "Service request";
      if (!description || description.trim() === "") {
        setError("Please provide a description for the service request");
        setIsSubmitting(false);
        return;
      }

      // Create job request using real API with images
      await providerService.createJob({
        providerId: provider.id,
        serviceType: primaryServiceType,
        title: formData["Type of Work"] || `Service request for ${provider.businessName}`,
        description: description,
        location: {
          address: serviceAddress,
          city: provider.location.city,
          latitude: undefined,
          longitude: undefined,
        },
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        images: images, // Include uploaded images
      });

      setIsSuccess(true);
    } catch (err) {
      console.error("Error creating job request:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send request. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: "Details", icon: FileText },
    { num: 2, title: "Schedule", icon: Calendar },
    { num: 3, title: "Payment", icon: CreditCard },
  ];

  // Success Screen
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Request Sent Successfully!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your service request has been sent to <strong className="text-gray-900">{provider.businessName}</strong>. 
            They will contact you within 24 hours.
          </p>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-5 mb-6 border border-orange-200">
            <p className="text-xs font-medium text-gray-500 mb-1">Reference Number</p>
            <p className="font-mono font-bold text-xl text-orange-700">REQ-{Date.now().toString().slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-bold text-xl mb-1">{provider.businessName}</h2>
              <p className="text-orange-100 text-sm flex items-center gap-2">
                {category?.name}
                {provider.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((s, index) => {
              const StepIcon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all ${
                      isActive
                        ? "bg-white text-orange-600 shadow-lg scale-110"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-white/30 text-white/70"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-colors ${
                      isActive ? "text-white" : "text-orange-100"
                    }`}>
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 transition-colors ${
                      isCompleted ? "bg-green-500" : step > s.num ? "bg-white" : "bg-white/30"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Step 1: Service Details */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Service Details</h3>
                <p className="text-sm text-gray-500">Tell us about the service you need</p>
              </div>
              
              {/* Dynamic Fields Based on Service Type */}
              {formFields.map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={formData[field.label] || ""}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={formData[field.label] || ""}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.label] || ""}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  )}
                </div>
              ))}

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData["notes"] || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any special requirements or details..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Attach Photos (Optional)
                </label>
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                {images.length < 10 && (
                  <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-500 hover:bg-orange-50/50 cursor-pointer transition-all">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload or drag photos here</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB (Max 10 images)</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
                
                {images.length >= 10 && (
                  <p className="text-sm text-orange-600 text-center py-2">
                    Maximum 10 images reached. Remove some to add more.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Service</h3>
                <p className="text-sm text-gray-500">When and where do you need the service?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={formData["date"] || ""}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Preferred Time *
                  </label>
                  <select
                    value={formData["time"] || ""}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  >
                    <option value="">Select time slot</option>
                    <option value="morning">Morning (8AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 4PM)</option>
                    <option value="evening">Evening (4PM - 7PM)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Service Location *
                </label>
                <input
                  type="text"
                  value={formData["address"] || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter full address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={formData["phone"] || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+256 7XX XXX XXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Method</h3>
                <p className="text-sm text-gray-500">Choose how you'd like to pay</p>
              </div>
              
              {/* Estimated Cost */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-5 mb-5 border border-orange-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Estimated Cost</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {provider.pricing.type === "hourly" && provider.pricing.hourlyRate
                      ? `UGX ${provider.pricing.hourlyRate.toLocaleString()}/hr`
                      : provider.pricing.type === "fixed" && provider.pricing.minimumCharge
                      ? `UGX ${provider.pricing.minimumCharge.toLocaleString()}`
                      : "Custom Quote"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Final cost may vary based on actual work</p>
              </div>

              {/* Payment Options */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Payment Method *
                </label>
                
                {/* Mobile Money */}
                <div 
                  onClick={() => setPaymentMethod("mtn")}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "mtn" 
                      ? "border-orange-500 bg-orange-50 shadow-md scale-[1.02]" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Smartphone className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">MTN Mobile Money</p>
                    <p className="text-sm text-gray-500">Pay via MTN MoMo</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    paymentMethod === "mtn" ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  }`}>
                    {paymentMethod === "mtn" && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Airtel Money */}
                <div 
                  onClick={() => setPaymentMethod("airtel")}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "airtel" 
                      ? "border-orange-500 bg-orange-50 shadow-md scale-[1.02]" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Airtel Money</p>
                    <p className="text-sm text-gray-500">Pay via Airtel Money</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    paymentMethod === "airtel" ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  }`}>
                    {paymentMethod === "airtel" && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Card Payment */}
                <div 
                  onClick={() => setPaymentMethod("card")}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "card" 
                      ? "border-orange-500 bg-orange-50 shadow-md scale-[1.02]" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    paymentMethod === "card" ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  }`}>
                    {paymentMethod === "card" && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Pay After Service */}
                <div 
                  onClick={() => setPaymentMethod("later")}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "later" 
                      ? "border-orange-500 bg-orange-50 shadow-md scale-[1.02]" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Pay After Service</p>
                    <p className="text-sm text-gray-500">Pay when job is completed</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    paymentMethod === "later" ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  }`}>
                    {paymentMethod === "later" && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <input 
                  type="checkbox" 
                  id="terms" 
                  className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" 
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  I agree to the <a href="#" className="text-orange-600 hover:underline font-medium">Terms of Service</a> and understand that 
                  final pricing may vary based on the actual scope of work.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 transition-all"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!paymentMethod || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// PROVIDER CARD COMPONENT
// =============================================
function ProviderCard({ 
  provider,
  onRequest 
}: { 
  provider: ReturnType<typeof formatProviderForDisplay>;
  onRequest: () => void;
}) {
  const category = CATEGORIES.find((c) => c.id === provider.category);
  const Icon = category?.icon || Users;
  const categoryName = category?.name || provider.category || "Service Provider";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
            {provider.verified && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
          <p className="text-sm text-gray-500">{categoryName}</p>
        </div>
      </div>

      {/* Rating & Location */}
      <div className="flex items-center gap-4 mt-3 text-sm">
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{provider.rating}</span>
          <span className="text-gray-400">({provider.reviews})</span>
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          <MapPin className="w-4 h-4" />
          {provider.location}
        </span>
      </div>

      {/* Jobs & Price */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div>
          <p className="text-xs text-gray-500">{provider.jobs} jobs done</p>
          <p className="font-semibold text-orange-600">{provider.price}</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 border rounded-lg hover:bg-gray-50">
            <Phone className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 border rounded-lg hover:bg-gray-50">
            <MessageCircle className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={onRequest}
            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
          >
            Request
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN PAGE COMPONENT
// =============================================
export default function ServiceProvidersPage() {
  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState("all");
  // State for search query
  const [searchQuery, setSearchQuery] = useState("");
  // State for selected provider (for modal)
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  // State for providers data
  const [allProviders, setAllProviders] = useState<ServiceProvider[]>([]); // All providers for category counts
  const [providers, setProviders] = useState<ServiceProvider[]>([]); // Filtered providers for display
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ALL providers for category counts (no filters)
  // This should run every time the component mounts to ensure fresh data
  useEffect(() => {
    let isMounted = true;
    
    const fetchAllProviders = async () => {
      try {
        console.log('[PROVIDERS PAGE] Fetching all providers for category counts...');
        const response = await providerService.getProviders({}, 1, 1000); // Get all providers
        console.log('[PROVIDERS PAGE] All providers fetched:', response.data?.length || 0, 'providers');
        
        if (isMounted) {
          setAllProviders(response.data || []);
        }
      } catch (err) {
        console.error("Error fetching all providers:", err);
        if (isMounted) {
          setAllProviders([]); // Reset to empty array on error
        }
      }
    };

    fetchAllProviders();
    
    // Also refresh when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        console.log('[PROVIDERS PAGE] Page became visible, refreshing all providers...');
        fetchAllProviders();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false; // Cleanup to prevent state updates on unmounted component
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Fetch on mount

  // Fetch filtered providers based on selected category and search
  useEffect(() => {
    let isMounted = true;
    
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const filters: any = {};
        if (selectedCategory !== "all") {
          filters.serviceType = selectedCategory;
        }
        if (searchQuery) {
          filters.search = searchQuery;
        }

        console.log('[PROVIDERS PAGE] Fetching filtered providers:', { selectedCategory, searchQuery, filters });
        const response = await providerService.getProviders(filters, 1, 100);
        console.log('[PROVIDERS PAGE] Filtered providers fetched:', response.data?.length || 0, 'providers');
        console.log('[PROVIDERS PAGE] Provider names:', response.data?.map(p => p.businessName || p.user?.firstName) || []);
        
        if (isMounted) {
          setProviders(response.data || []);
        }
      } catch (err) {
        console.error("Error fetching providers:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load providers");
          setProviders([]); // Fallback to empty array
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProviders();
    
    // Also refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        console.log('[PROVIDERS PAGE] Page became visible, refreshing filtered providers...');
        fetchProviders();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false; // Cleanup to prevent state updates on unmounted component
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedCategory, searchQuery]);

  // Format all providers for category counts
  const allFormattedProviders = allProviders.map(formatProviderForDisplay);
  
  // Format filtered providers for display
  const formattedProviders = providers.map(formatProviderForDisplay);

  // Filter logic (now mostly handled by backend, but keeping for client-side search refinement)
  const filteredProviders = formattedProviders.filter((provider) => {
    // Additional client-side filtering if needed
    const matchesSearch =
      !searchQuery ||
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* REQUEST FORM MODAL */}
      {selectedProvider && (
        <RequestFormModal 
          provider={selectedProvider} 
          onClose={() => setSelectedProvider(null)} 
        />
      )}

      {/* =========================================== */}
      {/* HEADER SECTION */}
      {/* =========================================== */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
            Find Service Providers
          </h1>
          <p className="text-center text-orange-100 mb-8">
            {CATEGORIES.length - 1} categories  {providers.length} verified professionals
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================== */}
      {/* MAIN CONTENT */}
      {/* =========================================== */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* =========================================== */}
          {/* LEFT SIDEBAR - Category Filter */}
          {/* =========================================== */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-4 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-4">Categories</h2>
              <div className="space-y-1">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  // Use allFormattedProviders for accurate category counts
                  const count =
                    category.id === "all"
                      ? allFormattedProviders.length
                      : allFormattedProviders.filter((p) => p.category === category.id).length;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id
                          ? "bg-orange-500 text-white"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-sm">{category.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          selectedCategory === category.id
                            ? "bg-orange-400"
                            : "bg-gray-100"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =========================================== */}
          {/* RIGHT SIDE - Provider Cards */}
          {/* =========================================== */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedCategory === "all"
                    ? "All Service Providers"
                    : CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-gray-500 text-sm">
                  {filteredProviders.length} provider
                  {filteredProviders.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>

            {/* Provider Cards Grid */}
            {isLoading ? (
              <div className="text-center py-16 bg-white rounded-xl">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading providers...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-xl">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Retry
                </button>
              </div>
            ) : filteredProviders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProviders.map((provider) => (
                  <ProviderCard 
                    key={provider.id} 
                    provider={provider} 
                    onRequest={() => setSelectedProvider(provider.provider)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No providers found
                </h3>
                <p className="text-gray-500 mb-4">
                  Try selecting a different category or search term
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================== */}
      {/* BECOME A PROVIDER CTA */}
      {/* =========================================== */}
      <div className="container mx-auto px-4 pb-12">
        <div className="bg-gray-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Are You a Service Provider?</h2>
          <p className="text-gray-400 mb-6">
            Join our platform and connect with property owners
          </p>
          <Link href="/auth/register/provider">
            <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Register as Provider
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
