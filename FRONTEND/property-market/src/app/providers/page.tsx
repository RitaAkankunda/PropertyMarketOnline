"use client";

import { useState } from "react";
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
  appliance: [
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
  interior: [
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
  { id: "appliance", name: "Appliance Repair", icon: Wrench },
  { id: "roofing", name: "Roofing Expert", icon: Home },
  { id: "interior", name: "Interior Designer", icon: Palette },
  { id: "landscaper", name: "Landscaper", icon: TreePine },
  { id: "lawyer", name: "Lawyer/Conveyancing", icon: Scale },
];

// =============================================
// DUMMY DATA - Service Providers
// =============================================
const PROVIDERS = [
  {
    id: 1,
    name: "ElectroPro Services",
    category: "electrician",
    rating: 4.9,
    reviews: 89,
    jobs: 320,
    location: "Kampala, Makindye",
    price: "UGX 50,000/hr",
    verified: true,
  },
  {
    id: 2,
    name: "PowerFix Electricals",
    category: "electrician",
    rating: 4.7,
    reviews: 56,
    jobs: 180,
    location: "Wakiso",
    price: "UGX 40,000/hr",
    verified: true,
  },
  {
    id: 3,
    name: "Master Plumbers Ltd",
    category: "plumber",
    rating: 4.8,
    reviews: 67,
    jobs: 280,
    location: "Kampala, Rubaga",
    price: "UGX 45,000/hr",
    verified: true,
  },
  {
    id: 4,
    name: "Quick Flow Plumbing",
    category: "plumber",
    rating: 4.6,
    reviews: 45,
    jobs: 150,
    location: "Entebbe",
    price: "UGX 35,000/hr",
    verified: false,
  },
  {
    id: 5,
    name: "Quality Carpentry Works",
    category: "carpenter",
    rating: 4.5,
    reviews: 78,
    jobs: 195,
    location: "Wakiso",
    price: "Custom Quote",
    verified: true,
  },
  {
    id: 6,
    name: "StrongBuild Masonry",
    category: "mason",
    rating: 4.8,
    reviews: 92,
    jobs: 156,
    location: "Kampala, Nakawa",
    price: "Custom Quote",
    verified: true,
  },
  {
    id: 7,
    name: "Spotless Cleaning",
    category: "cleaner",
    rating: 4.6,
    reviews: 156,
    jobs: 520,
    location: "Entebbe",
    price: "UGX 120,000",
    verified: true,
  },
  {
    id: 8,
    name: "Secure Guard Services",
    category: "security",
    rating: 4.9,
    reviews: 45,
    jobs: 89,
    location: "Kampala",
    price: "Custom Quote",
    verified: true,
  },
  {
    id: 9,
    name: "Precision Surveyors",
    category: "surveyor",
    rating: 4.9,
    reviews: 34,
    jobs: 145,
    location: "Kampala",
    price: "UGX 500,000+",
    verified: true,
  },
  {
    id: 10,
    name: "TrueValue Valuers",
    category: "valuer",
    rating: 4.8,
    reviews: 41,
    jobs: 210,
    location: "Kampala, Nakawa",
    price: "UGX 350,000+",
    verified: true,
  },
  {
    id: 11,
    name: "Quick Movers Uganda",
    category: "mover",
    rating: 4.8,
    reviews: 124,
    jobs: 450,
    location: "Kampala",
    price: "UGX 150,000+",
    verified: true,
  },
  {
    id: 12,
    name: "SafeHands Relocations",
    category: "mover",
    rating: 4.9,
    reviews: 87,
    jobs: 312,
    location: "Kampala, Makindye",
    price: "UGX 200,000+",
    verified: true,
  },
  {
    id: 13,
    name: "ColorMaster Painters",
    category: "painter",
    rating: 4.7,
    reviews: 63,
    jobs: 178,
    location: "Kampala",
    price: "Custom Quote",
    verified: true,
  },
  {
    id: 14,
    name: "FixIt Appliance Repair",
    category: "appliance",
    rating: 4.5,
    reviews: 76,
    jobs: 289,
    location: "Kampala, Rubaga",
    price: "UGX 30,000/hr",
    verified: true,
  },
  {
    id: 15,
    name: "TopRoof Solutions",
    category: "roofing",
    rating: 4.7,
    reviews: 49,
    jobs: 134,
    location: "Kampala",
    price: "Custom Quote",
    verified: true,
  },
  {
    id: 16,
    name: "Elegant Interiors",
    category: "interior",
    rating: 4.8,
    reviews: 52,
    jobs: 87,
    location: "Kampala",
    price: "UGX 500,000+",
    verified: true,
  },
  {
    id: 17,
    name: "GreenScape Gardens",
    category: "landscaper",
    rating: 4.6,
    reviews: 38,
    jobs: 112,
    location: "Entebbe",
    price: "Custom Quote",
    verified: false,
  },
  {
    id: 18,
    name: "PropertyLaw Associates",
    category: "lawyer",
    rating: 4.9,
    reviews: 28,
    jobs: 95,
    location: "Kampala",
    price: "UGX 800,000+",
    verified: true,
  },
];

// =============================================
// REQUEST FORM MODAL COMPONENT
// =============================================
function RequestFormModal({ 
  provider, 
  onClose 
}: { 
  provider: typeof PROVIDERS[0]; 
  onClose: () => void;
}) {
  const [step, setStep] = useState(1); // 1: Details, 2: Schedule, 3: Payment
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const category = CATEGORIES.find((c) => c.id === provider.category);
  const Icon = category?.icon || Users;
  const formFields = SERVICE_FORM_FIELDS[provider.category] || [];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  // Success Screen
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-600 mb-6">
            Your service request has been sent to <strong>{provider.name}</strong>. 
            They will contact you within 24 hours.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500">Reference Number</p>
            <p className="font-mono font-bold text-lg">REQ-{Date.now().toString().slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{provider.name}</h2>
                <p className="text-orange-100 text-sm">{category?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? "bg-white text-orange-600" : "bg-white/30"
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-12 h-1 mx-1 ${step > s ? "bg-white" : "bg-white/30"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-2 text-xs text-orange-100">
            <span>Details</span>
            <span>Schedule</span>
            <span>Payment</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Step 1: Service Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Service Details</h3>
              
              {/* Dynamic Fields Based on Service Type */}
              {formFields.map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={formData[field.label] || ""}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.label] || ""}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData["notes"] || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any special requirements or details..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attach Photos (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag photos here</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Schedule Service</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={formData["date"] || ""}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Preferred Time
                </label>
                <select
                  value={formData["time"] || ""}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select time slot</option>
                  <option value="morning">Morning (8AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 4PM)</option>
                  <option value="evening">Evening (4PM - 7PM)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Service Location
                </label>
                <input
                  type="text"
                  value={formData["address"] || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter full address"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData["phone"] || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+256 7XX XXX XXX"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
              
              {/* Estimated Cost */}
              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Cost</span>
                  <span className="text-xl font-bold text-orange-600">{provider.price}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Final cost may vary based on actual work</p>
              </div>

              {/* Payment Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Payment Method
                </label>
                
                {/* Mobile Money */}
                <div 
                  onClick={() => setPaymentMethod("mtn")}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "mtn" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">MTN Mobile Money</p>
                    <p className="text-sm text-gray-500">Pay via MTN MoMo</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === "mtn" ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  }`}>
                    {paymentMethod === "mtn" && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Airtel Money */}
                <div 
                  onClick={() => setPaymentMethod("airtel")}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "airtel" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Airtel Money</p>
                    <p className="text-sm text-gray-500">Pay via Airtel Money</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === "airtel" ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  }`}>
                    {paymentMethod === "airtel" && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Card Payment */}
                <div 
                  onClick={() => setPaymentMethod("card")}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "card" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === "card" ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  }`}>
                    {paymentMethod === "card" && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Bank Transfer */}
                <div 
                  onClick={() => setPaymentMethod("bank")}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "bank" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-sm text-gray-500">Direct bank transfer</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === "bank" ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  }`}>
                    {paymentMethod === "bank" && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Pay Later */}
                <div 
                  onClick={() => setPaymentMethod("later")}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "later" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Pay After Service</p>
                    <p className="text-sm text-gray-500">Pay when job is completed</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === "later" ? "border-orange-500 bg-orange-500" : "border-gray-300"
                  }`}>
                    {paymentMethod === "later" && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2 mt-4">
                <input type="checkbox" id="terms" className="mt-1" />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the <a href="#" className="text-orange-600">Terms of Service</a> and understand that 
                  final pricing may vary based on the actual scope of work.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t p-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!paymentMethod || isSubmitting}
              className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
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
  provider: typeof PROVIDERS[0];
  onRequest: () => void;
}) {
  const category = CATEGORIES.find((c) => c.id === provider.category);
  const Icon = category?.icon || Users;

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
          <p className="text-sm text-gray-500">{category?.name}</p>
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
  const [selectedProvider, setSelectedProvider] = useState<typeof PROVIDERS[0] | null>(null);

  //  FILTER LOGIC - Very Simple!
  const filteredProviders = PROVIDERS.filter((provider) => {
    // Filter by category
    const matchesCategory =
      selectedCategory === "all" || provider.category === selectedCategory;
    
    // Filter by search
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
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
            {CATEGORIES.length - 1} categories  {PROVIDERS.length} verified professionals
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
                  const count =
                    category.id === "all"
                      ? PROVIDERS.length
                      : PROVIDERS.filter((p) => p.category === category.id).length;

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
            {filteredProviders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProviders.map((provider) => (
                  <ProviderCard 
                    key={provider.id} 
                    provider={provider} 
                    onRequest={() => setSelectedProvider(provider)}
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
          <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Register as Provider
          </button>
        </div>
      </div>
    </div>
  );
}
