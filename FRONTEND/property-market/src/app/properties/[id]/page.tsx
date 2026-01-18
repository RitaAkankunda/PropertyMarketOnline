"use client";

import { useState, use, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit,
  Loader2,
  Calendar,
  MessageSquare,
  ZoomIn,
} from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { propertyService } from "@/services/property.service";
import { useAuth } from "@/hooks";
import { PropertyViewingModal, PropertyInquiryModal, PropertyPaymentModal, ImageLightbox, PropertyWishlistButton, PropertyBadges, PropertyReviews, PropertyRating, SimilarProperties, PriceBreakdown, AvailabilityCalendar } from "@/components/properties";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import type { Property } from "@/types";

// Mockup property data
const getMockProperty = (id: string) => {
  // Check if it's a house, villa, or apartment
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
  } else if (id.startsWith("villa-")) {
    const villaNumber = parseInt(id.replace("villa-", "")) || 1;
    return {
      id,
      title: `Luxury Villa #${villaNumber}`,
      description: `Exquisite ${4 + (villaNumber % 3)} bedroom villa with premium amenities, lush gardens, and modern architecture. Perfect for luxury living and entertaining guests.`,
      price: 1200000000 + (villaNumber * 50000000),
      currency: "UGX",
      propertyType: "villa",
      listingType: "sale",
      backLink: "/properties?type=villas",
      backText: "Back to Villas",
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b",
      ],
      location: {
        address: `${villaNumber} Villa Lane`,
        city: "Kampala",
        district: ["Kampala", "Wakiso", "Entebbe"][villaNumber % 3],
        country: "Uganda",
      },
      features: {
        bedrooms: 4 + (villaNumber % 3),
        bathrooms: 3 + (villaNumber % 2),
        area: 3500 + (villaNumber * 100),
        yearBuilt: 2021 + (villaNumber % 5),
        parking: 3,
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
  } else if (id.startsWith("office-")) {
    const officeNumber = parseInt(id.replace("office-", "")) || 1;
    return {
      id,
      title: `Executive Office #${officeNumber}`,
      description: `Modern ${2 + (officeNumber % 3)}-room office suite with premium amenities, high-speed internet, and city views. Ideal for startups and established businesses alike.`,
      price: 350000000 + (officeNumber * 25000000),
      currency: "UGX",
      propertyType: "office",
      listingType: "sale",
      backLink: "/properties?type=offices",
      backText: "Back to Offices",
      images: [
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
        "https://images.unsplash.com/photo-1497366412874-3415097a27e7",
        "https://images.unsplash.com/photo-1497366216548-37526070297c",
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174",
      ],
      location: {
        address: `${officeNumber} Office Park`,
        city: "Kampala",
        district: ["Kampala", "Wakiso", "Entebbe"][officeNumber % 3],
        country: "Uganda",
      },
      features: {
        bedrooms: 0,
        bathrooms: 2 + (officeNumber % 2),
        area: 1200 + (officeNumber * 100),
        yearBuilt: 2019 + (officeNumber % 5),
        parking: 2 + (officeNumber % 3),
      },
      amenities: ["Parking", "High-Speed Internet", "Security", "Conference Room", "Reception"],
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

function PropertyDetailPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewingModalOpen, setIsViewingModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Booking dates for airbnb/hotel
  const [bookingDates, setBookingDates] = useState<{
    checkIn: Date | null;
    checkOut: Date | null;
    nights: number;
    totalPrice: number;
  }>({ checkIn: null, checkOut: null, nights: 0, totalPrice: 0 });
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Restore viewing modal after login/registration
  useEffect(() => {
    const shouldRestore = searchParams.get("restoreViewing") === "true";
    if (shouldRestore && isAuthenticated && property) {
      console.log('[PROPERTY DETAIL] Restoring viewing modal for property:', property.title);
      setIsViewingModalOpen(true);
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('restoreViewing');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, isAuthenticated, property]);

  useEffect(() => {
    async function fetchProperty() {
      try {
        setIsLoading(true);
        const data = await propertyService.getProperty(id);
        console.log('Fetched property data:', data);
        console.log('Property images:', data.images);
        console.log('Property image URLs:', data.images?.map(img => typeof img === 'string' ? img : img.url));
        console.log('Property owner:', data.owner);
        console.log('Property ownerId:', (data as any).ownerId);
        setProperty(data);
        // Add to recently viewed
        if (data) {
          addToRecentlyViewed(data);
        }
        
        // Record view (don't wait for it, fire and forget)
        try {
          await propertyService.recordView(id);
        } catch (viewError) {
          // Silently fail - view recording shouldn't break the page
          console.warn('Failed to record view:', viewError);
        }
      } catch (err: any) {
        console.error("Failed to fetch property:", err);
        setError(err.message || "Failed to load property");
        // Fallback to mock data if API fails
        const mockData = getMockProperty(id) as any;
        console.log('Using mock data (no owner):', mockData);
        setProperty(mockData);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-4">{error || "This property could not be found."}</p>
          <Link href="/properties">
            <Button>Back to Properties</Button>
          </Link>
      </div>
    </div>
  );
  }

  // Check if user is the owner - check both owner.id and ownerId
  const propertyOwnerId = property.owner?.id || (property as any).ownerId;
  const isOwner = isAuthenticated && user && propertyOwnerId === user.id;
  
  // Debug logging
  console.log('Property owner check:', {
    isAuthenticated,
    userId: user?.id,
    propertyOwnerId,
    propertyOwner: property.owner,
    propertyOwnerIdField: (property as any).ownerId,
    isOwner,
    fullProperty: property,
  });

  const nextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const propertyImages = property.images && property.images.length > 0 
    ? property.images.map(img => typeof img === 'string' ? img : img.url)
    : [];

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/properties"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Link>
          {isOwner && (
            <Button
              onClick={() => router.push(`/properties/${id}/edit`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Property
            </Button>
          )}
          {/* Debug: Show owner info if authenticated */}
          {isAuthenticated && !isOwner && (
            <div className="text-xs text-muted-foreground">
              Not owner (User: {user?.id?.substring(0, 8)}..., Owner: {property.owner?.id?.substring(0, 8) || (property as any).ownerId?.substring(0, 8) || 'N/A'}...)
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Image Slideshow */}
        <Card className="mb-8 overflow-hidden">
          <div className="relative aspect-video bg-slate-900 cursor-pointer group" onClick={() => setIsLightboxOpen(true)}>
            {propertyImages.length > 0 ? (
              <img
                src={propertyImages[currentImageIndex]}
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                onError={(e) => {
                  console.error('Image failed to load:', propertyImages[currentImageIndex]);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // Show error message
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'w-full h-full flex items-center justify-center text-white bg-red-500/20';
                  errorDiv.innerHTML = '<p>Image failed to load</p>';
                  target.parentElement?.appendChild(errorDiv);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', propertyImages[currentImageIndex]);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>No images available</p>
              </div>
            )}

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
            {propertyImages.length > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                {currentImageIndex + 1} / {propertyImages.length}
              </div>
            )}

            {/* View Fullscreen Button */}
            {propertyImages.length > 0 && (
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-4 right-20 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg transition text-slate-700"
                aria-label="View fullscreen"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            )}

            {/* Wishlist Button */}
            {property && (
              <div className="absolute top-4 right-4">
                <PropertyWishlistButton property={property} size="md" />
              </div>
            )}
          </div>

          {/* Thumbnail Navigation */}
          {propertyImages.length > 0 && (
            <div className="flex gap-2 p-4 bg-white overflow-x-auto">
              {propertyImages.map((image, index) => (
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
                    onError={(e) => {
                      console.error('Thumbnail failed to load:', image);
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* About Card */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{property.title}</h1>
                  <PropertyBadges property={property} />
                </div>
                <div className="flex items-center text-slate-600 mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{property.location.address}, {property.location.district}, {property.location.city}</span>
                </div>
                {/* Quick Navigation */}
                <div className="flex items-center gap-4 text-sm mt-4">
                  <a 
                    href="#reviews" 
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    ⭐ View Reviews
                  </a>
                  <span className="text-slate-300">|</span>
                  <a 
                    href="#amenities" 
                    className="text-slate-600 hover:text-slate-700 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('amenities-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Amenities
                  </a>
                </div>
              </div>
              <Badge className="bg-blue-600 text-white text-lg px-4 py-2 capitalize flex-shrink-0">
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

            {/* Price Breakdown */}
            <div className="mb-6">
              <PriceBreakdown property={property} />
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
              {property.amenities && property.amenities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 text-slate-700">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No amenities listed for this property</p>
              )}
            </div>
          </div>
        </Card>

        {(property.propertyType === "airbnb" || property.propertyType === "hotel") && (
          <Card className="mb-8">
            <div className="p-6">
              <AvailabilityCalendar 
                propertyId={property.id} 
                isOwner={isOwner}
                pricePerNight={
                  property.propertyType === "hotel" 
                    ? ((property as any).standardRoomRate || property.price || 0)
                    : ((property as any).nightlyRate || property.price || 0)
                }
                cleaningFee={(property as any).cleaningFee || 0}
                serviceFee={(property as any).serviceFee || 0}
                currency={property.currency || "UGX"}
                onBookingRequest={(checkIn, checkOut, nights, totalPrice) => {
                  console.log("Booking requested:", { checkIn, checkOut, nights, totalPrice });
                  // Store the booking dates and open payment modal
                  setBookingDates({ checkIn, checkOut, nights, totalPrice });
                  setIsPaymentModalOpen(true);
                }}
              />
            </div>
          </Card>
        )}

        {/* Contact/Inquiry Card */}
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {property.listingType === "sale" 
                ? "Interested in this property?" 
                : property.propertyType === "airbnb"
                ? "Book Your Stay"
                : "Apply for This Property"}
            </h2>
            <p className="text-slate-600 mb-6">
              {property.listingType === "sale" 
                ? "Schedule a viewing or make an inquiry about this property" 
                : property.propertyType === "airbnb"
                ? "Check availability and book your dates"
                : "Submit your rental application and we'll get back to you"}
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-slate-700">
                <Check className="w-5 h-5 text-green-500" />
                <span>Quick response from property owner</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Check className="w-5 h-5 text-green-500" />
                <span>Flexible viewing schedule</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Check className="w-5 h-5 text-green-500" />
                <span>Secure and verified listings</span>
              </div>
            </div>

            {/* Three Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Schedule Viewing Button */}
              <Button
                onClick={() => setIsViewingModalOpen(true)}
                className="w-full py-6 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Viewing
              </Button>

              {/* Send Inquiry Button */}
              <Button
                onClick={() => setIsInquiryModalOpen(true)}
                className="w-full py-6 text-base bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Send Inquiry
              </Button>

              {/* Buy Now / Make Offer Button */}
              <Button
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full py-6 text-base bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Check className="w-5 h-5 mr-2" />
                {property.listingType === "sale" ? "Make Offer" : "Proceed to Payment"}
              </Button>
            </div>

            <p className="text-center text-sm text-slate-500 mt-4">
              📞 Questions? Contact us at +256 700 000 000
            </p>
          </div>
        </Card>
      </div>

      {/* Property Viewing Modal */}
      <PropertyViewingModal
        property={property}
        isOpen={isViewingModalOpen}
        onClose={() => setIsViewingModalOpen(false)}
      />

      {/* Property Inquiry Modal */}
      <PropertyInquiryModal
        property={property}
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
      />

      {/* Property Payment Modal */}
      <PropertyPaymentModal
        property={property}
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setBookingDates({ checkIn: null, checkOut: null, nights: 0, totalPrice: 0 });
        }}
        bookingDates={bookingDates}
      />

      {/* Image Lightbox */}
      {property && propertyImages.length > 0 && (
        <ImageLightbox
          images={propertyImages}
          initialIndex={currentImageIndex}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          propertyTitle={property.title}
        />
      )}

      {/* Reviews Section */}
      {property && (
        <div id="reviews-section" className="mt-12 scroll-mt-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Reviews & Ratings</h2>
            <PropertyRating propertyId={property.id} size="md" showReviewCount={true} />
          </div>
          <PropertyReviews 
            propertyId={property.id} 
            propertyOwnerId={(property as any).ownerId || (property as any).owner?.id}
          />
        </div>
      )}

      {/* Similar Properties Section */}
      {property && (
        <div className="mt-12">
          <SimilarProperties property={property} maxItems={4} />
        </div>
      )}
    </div>
  );
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PropertyDetailPageContent params={params} />
    </Suspense>
  );
}
