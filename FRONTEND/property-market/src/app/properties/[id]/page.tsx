"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";

// Mockup property data
const getMockProperty = (id: string) => {
  // Check if it's a house or apartment
  if (id.startsWith("house-")) {
    const houseNumber = parseInt(id.replace("house-", "")) || 1;
    
    return {
      id,
      title: `Beautiful House #${houseNumber}`,
      description: `This stunning ${3 + (houseNumber % 3)} bedroom house offers modern living at its finest. Features include spacious living areas, contemporary kitchen with high-end appliances, elegant bathrooms, and a beautiful outdoor space perfect for entertaining. Located in a prime neighborhood with easy access to schools, shopping centers, and major highways. The property boasts excellent natural lighting throughout, premium finishes, and thoughtful design details that make it truly special.`,
      price: 400000000 + (houseNumber * 50000000),
      currency: "UGX",
      propertyType: "house",
      listingType: "sale",
      backLink: "/properties?type=houses",
      backText: "Back to Houses",
      images: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b",
      ],
      location: {
        address: `${houseNumber} Property Street`,
        city: "Kampala",
        district: ["Kampala", "Wakiso", "Entebbe"][houseNumber % 3],
        country: "Uganda",
      },
      features: {
        bedrooms: 3 + (houseNumber % 3),
        bathrooms: 2 + (houseNumber % 2),
        area: 2500 + (houseNumber * 100),
        yearBuilt: 2020 + (houseNumber % 5),
        parking: 2,
      },
      amenities: ["Parking", "Garden", "Security", "Swimming Pool", "Gym", "Modern Kitchen"],
    };
  } else if (id.startsWith("apartment-")) {
    const apartmentNumber = parseInt(id.replace("apartment-", "")) || 1;
    
    return {
      id,
      title: `Modern Apartment #${apartmentNumber}`,
      description: `Experience luxurious ${2 + (apartmentNumber % 3)} bedroom apartment living with breathtaking city views. This premium residence features an open-concept layout, floor-to-ceiling windows, gourmet kitchen with stainless steel appliances, spa-like bathrooms, and private balcony. Residents enjoy access to world-class amenities including a fitness center, swimming pool, and 24/7 concierge service. Perfect for those seeking urban sophistication and convenience.`,
      price: 180000000 + (apartmentNumber * 30000000),
      currency: "UGX",
      propertyType: "apartment",
      listingType: "sale",
      backLink: "/properties?type=apartments",
      backText: "Back to Apartments",
      images: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
      ],
      location: {
        address: `${apartmentNumber} Urban Heights`,
        city: "Kampala",
        district: ["Kampala", "Nakawa", "Makindye"][apartmentNumber % 3],
        country: "Uganda",
      },
      features: {
        bedrooms: 2 + (apartmentNumber % 3),
        bathrooms: 2 + (apartmentNumber % 2),
        area: 1200 + (apartmentNumber * 50),
        yearBuilt: 2018 + (apartmentNumber % 5),
        parking: 1,
      },
      amenities: ["Parking", "Elevator", "Security", "Gym", "Pool", "Balcony"],
    };
  } else if (id.startsWith("land-")) {
    const landNumber = parseInt(id.replace("land-", "")) || 1;
    
    return {
      id,
      title: `Prime Land Plot #${landNumber}`,
      description: `This exceptional ${0.5 + (landNumber % 3) * 0.5} acre land parcel offers tremendous potential for residential or commercial development. Situated in a prime location with excellent accessibility, the property features level terrain, established infrastructure, and proximity to essential amenities. Whether you're planning to build your dream home, start a business, or invest for the future, this land provides the perfect foundation for your vision. All utilities are readily available, and the area is experiencing rapid growth and development.`,
      price: 80000000 + (landNumber * 20000000),
      currency: "UGX",
      propertyType: "land",
      listingType: "sale",
      backLink: "/properties?type=land",
      backText: "Back to Land",
      images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
        "https://images.unsplash.com/photo-1426604966848-d7adac402bff",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      ],
      location: {
        address: `${landNumber} Land Avenue`,
        city: "Kampala",
        district: ["Kampala", "Wakiso", "Mukono"][landNumber % 3],
        country: "Uganda",
      },
      features: {
        area: (0.5 + (landNumber % 3) * 0.5) * 43560, // Convert acres to sqft
        areaUnit: "sqft",
      },
      amenities: ["Electricity Available", "Water Available", "Road Access", "Security", "Level Terrain", "Infrastructure"],
    };
  } else if (id.startsWith("commercial-")) {
    const commercialNumber = parseInt(id.replace("commercial-", "")) || 1;
    
    return {
      id,
      title: `Commercial Property #${commercialNumber}`,
      description: `This exceptional commercial property offers prime business location with high visibility and foot traffic. Perfect for retail, office space, or any commercial venture. Features modern facilities, ample parking, and excellent accessibility. The property is strategically located in a thriving business district with proximity to major transportation routes and urban amenities.`,
      price: 500000000 + (commercialNumber * 500000000),
      currency: "UGX",
      propertyType: "commercial",
      listingType: "sale",
      backLink: "/properties?type=commercial",
      backText: "Back to Commercial",
      images: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
        "https://images.unsplash.com/photo-1497366216548-37526070297c",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
      ],
      location: {
        address: `${commercialNumber} Business District`,
        city: "Kampala",
        district: ["Central", "Nakawa", "Kololo"][commercialNumber % 3],
        country: "Uganda",
      },
      features: {
        area: 2000 + (commercialNumber * 500),
        areaUnit: "sqft",
        floors: 1 + (commercialNumber % 3),
      },
      amenities: ["Parking", "Security", "Elevator", "Loading Dock", "High Visibility", "Prime Location"],
    };
  }
  
  // Default fallback
  return {
    id,
    title: "Property Not Found",
    description: "This property could not be found.",
    price: 0,
    currency: "UGX",
    propertyType: "house",
    listingType: "sale",
    backLink: "/properties",
    backText: "Back to Properties",
    images: [],
    location: { address: "", city: "", district: "", country: "" },
    features: { bedrooms: 0, bathrooms: 0, area: 0, yearBuilt: 0, parking: 0 },
    amenities: [],
  };
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const property = getMockProperty(id);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const paymentMethods = [
    { id: "mtn", name: "MTN Mobile Money", icon: "📱", color: "bg-yellow-500" },
    { id: "airtel", name: "Airtel Money", icon: "📱", color: "bg-red-500" },
    { id: "visa", name: "Visa Card", icon: "💳", color: "bg-blue-500" },
    { id: "paypal", name: "PayPal", icon: "💰", color: "bg-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={property.backLink}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {property.backText}
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Image Slideshow */}
        <Card className="mb-8 overflow-hidden">
          <div className="relative aspect-video bg-slate-900">
            <img
              src={property.images[currentImageIndex]}
              alt={`${property.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Navigation Arrows */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
              {currentImageIndex + 1} / {property.images.length}
            </div>

            {/* Favorite Button */}
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn(
                "absolute top-4 right-4 p-3 rounded-full shadow-lg transition",
                isFavorite ? "bg-red-500 text-white" : "bg-white/90 hover:bg-white text-slate-700"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </button>
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex gap-2 p-4 bg-white overflow-x-auto">
            {property.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition",
                  currentImageIndex === index
                    ? "border-blue-500 scale-105"
                    : "border-slate-200 opacity-70 hover:opacity-100 hover:border-blue-300"
                )}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </Card>

        {/* About Card */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{property.title}</h1>
                <div className="flex items-center text-slate-600 mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{property.location.address}, {property.location.district}, {property.location.city}</span>
                </div>
              </div>
              <Badge className="bg-blue-600 text-white text-lg px-4 py-2 capitalize">
                For {property.listingType}
              </Badge>
            </div>

            {/* Price */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 mb-1">Price</p>
              <p className="text-4xl font-bold text-blue-600">
                {formatCurrency(property.price, property.currency)}
              </p>
            </div>

            {/* Features Grid */}
            {property.propertyType === "land" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Square className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Land Area</p>
                    <p className="font-semibold text-slate-900">{(property.features.area / 43560).toFixed(1)} acres</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Location</p>
                    <p className="font-semibold text-slate-900">{property.location.district}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Bed className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Bedrooms</p>
                    <p className="font-semibold text-slate-900">{property.features.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Bath className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Bathrooms</p>
                    <p className="font-semibold text-slate-900">{property.features.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Square className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Area</p>
                    <p className="font-semibold text-slate-900">{property.features.area} sqft</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Car className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Parking</p>
                    <p className="font-semibold text-slate-900">{property.features.parking} Cars</p>
                  </div>
                </div>
              </div>
            )}

            {/* About Section */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">About This Property</h2>
              <p className="text-slate-600 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-700">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Card */}
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Payment Methods</h2>
            <p className="text-slate-600 mb-6">Choose your preferred payment method to proceed with this property</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
                    selectedPaymentMethod === method.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 bg-white"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-2xl", method.color, "text-white")}>
                    {method.icon}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-slate-900">{method.name}</p>
                    <p className="text-sm text-slate-500">Fast & Secure</p>
                  </div>
                  {selectedPaymentMethod === method.id && (
                    <Check className="w-6 h-6 text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            <Button 
              className="w-full py-6 text-lg"
              disabled={!selectedPaymentMethod}
            >
              {selectedPaymentMethod 
                ? `Proceed with ${paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}`
                : "Select a payment method"
              }
            </Button>

            <p className="text-center text-sm text-slate-500 mt-4">
              🔒 Your payment information is secure and encrypted
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
