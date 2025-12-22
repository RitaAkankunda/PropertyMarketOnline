"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Grid, List, Map, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { PropertyFilters, PropertyGrid } from "@/components/properties";
import { propertyService } from "@/services";
import type { Property, PropertyFilters as PropertyFiltersType } from "@/types";

// Mockup data for houses (36 total = 3 pages of 12)
const HOUSE_MOCKUPS = Array.from({ length: 36 }, (_, i) => ({
  id: `house-${i + 1}`,
  title: `Beautiful House #${i + 1}`,
  description: `Stunning ${3 + (i % 3)} bedroom house with modern amenities and spacious living areas.`,
  price: 400000000 + (i * 50000000),
  currency: "UGX",
  propertyType: "house" as const,
  listingType: "sale" as const,
  status: "active" as const,
  images: [
    {
      id: `img-${i}`,
      url: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b",
      ][i % 6],
      alt: `House ${i + 1}`,
      isPrimary: true,
    },
  ],
  location: {
    address: `${i + 1} Property Street`,
    city: "Kampala",
    district: ["Kampala", "Wakiso", "Entebbe"][i % 3],
    country: "Uganda",
    coordinates: { lat: 0.3476, lng: 32.5825 },
  },
  features: {
    bedrooms: 3 + (i % 3),
    bathrooms: 2 + (i % 2),
    area: 2500 + (i * 100),
    areaUnit: "sqft" as const,
    yearBuilt: 2020 + (i % 5),
  },
  amenities: ["Parking", "Garden", "Security"],
  owner: {
    id: "owner-1",
    email: "owner@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "lister" as const,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  views: 100 + i * 10,
  leads: 5 + i,
  isVerified: true,
  isFeatured: i < 6,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

// Mockup data for apartments (36 total = 3 pages of 12)
const APARTMENT_MOCKUPS = Array.from({ length: 36 }, (_, i) => ({
  id: `apartment-${i + 1}`,
  title: `Modern Apartment #${i + 1}`,
  description: `Luxurious ${2 + (i % 3)} bedroom apartment with stunning city views and premium finishes.`,
  price: 180000000 + (i * 30000000),
  currency: "UGX",
  propertyType: "apartment" as const,
  listingType: "sale" as const,
  status: "active" as const,
  images: [
    {
      id: `img-apt-${i}`,
      url: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
        "https://images.unsplash.com/photo-1502672260066-6bc35f0a1f80",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
      ][i % 6],
      alt: `Apartment ${i + 1}`,
      isPrimary: true,
    },
  ],
  location: {
    address: `${i + 1} Urban Heights`,
    city: "Kampala",
    district: ["Kampala", "Nakawa", "Makindye"][i % 3],
    country: "Uganda",
    coordinates: { lat: 0.3476, lng: 32.5825 },
  },
  features: {
    bedrooms: 2 + (i % 3),
    bathrooms: 2 + (i % 2),
    area: 1200 + (i * 50),
    areaUnit: "sqft" as const,
    yearBuilt: 2018 + (i % 5),
  },
  amenities: ["Parking", "Elevator", "Security", "Gym", "Pool"],
  owner: {
    id: "owner-2",
    email: "owner@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "lister" as const,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  views: 80 + i * 8,
  leads: 4 + i,
  isVerified: true,
  isFeatured: i < 6,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

// Mockup data for land (36 total = 3 pages of 12)
const LAND_MOCKUPS = Array.from({ length: 36 }, (_, i) => ({
  id: `land-${i + 1}`,
  title: `Prime Land Plot #${i + 1}`,
  description: `Excellent ${0.5 + (i % 3) * 0.5} acre land parcel perfect for residential or commercial development. Located in a rapidly developing area with excellent infrastructure, utilities readily available, and easy access to major roads. Ideal for building your dream home or investment opportunity.`,
  price: 80000000 + (i * 20000000),
  currency: "UGX",
  propertyType: "land" as const,
  listingType: "sale" as const,
  status: "active" as const,
  images: [
    {
      id: `img-land-${i}`,
      url: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
        "https://images.unsplash.com/photo-1426604966848-d7adac402bff",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
        "https://images.unsplash.com/photo-1464822759844-d150f39ac1ac",
      ][i % 6],
      alt: `Land Plot ${i + 1}`,
      isPrimary: true,
    },
  ],
  location: {
    address: `${i + 1} Land Avenue`,
    city: "Kampala",
    district: ["Kampala", "Wakiso", "Mukono"][i % 3],
    country: "Uganda",
    coordinates: { lat: 0.3476, lng: 32.5825 },
  },
  features: {
    area: (0.5 + (i % 3) * 0.5) * 43560, // Convert acres to sqft
    areaUnit: "sqft" as const,
  },
  amenities: ["Electricity Available", "Water Available", "Road Access", "Security"],
  owner: {
    id: "owner-3",
    email: "owner@example.com",
    firstName: "David",
    lastName: "Johnson",
    role: "lister" as const,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  views: 60 + i * 6,
  leads: 3 + i,
  isVerified: true,
  isFeatured: i < 6,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

// Mockup data for commercial (36 total = 3 pages of 12)
const COMMERCIAL_MOCKUPS = Array.from({ length: 36 }, (_, i) => ({
  id: `commercial-${i + 1}`,
  title: `Commercial Property #${i + 1}`,
  description: `Prime commercial space perfect for retail, office, or business operations. Located in a high-traffic area with excellent visibility and accessibility. Features modern facilities, ample parking, and proximity to major transportation routes.`,
  price: 500000000 + (i * 500000000),
  currency: "UGX",
  propertyType: "commercial" as const,
  listingType: "sale" as const,
  status: "active" as const,
  images: [
    {
      id: `img-commercial-${i}`,
      url: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
        "https://images.unsplash.com/photo-1497366216548-37526070297c",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
      ][i % 6],
      alt: `Commercial Property ${i + 1}`,
      isPrimary: true,
    },
  ],
  location: {
    address: `${i + 1} Business District`,
    city: "Kampala",
    district: ["Central", "Nakawa", "Kololo"][i % 3],
    country: "Uganda",
    coordinates: { lat: 0.3476, lng: 32.5825 },
  },
  features: {
    area: 2000 + (i * 500),
    areaUnit: "sqft" as const,
    floors: 1 + (i % 3),
  },
  amenities: ["Parking", "Security", "Elevator", "Loading Dock", "High Visibility"],
  owner: {
    id: "owner-4",
    email: "owner@example.com",
    firstName: "Michael",
    lastName: "Thompson",
    role: "lister" as const,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  views: 70 + i * 7,
  leads: 5 + i,
  isVerified: true,
  isFeatured: i < 6,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

function PropertiesPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<PropertyFiltersType>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 12;

  // Get property type from URL
  const propertyType = searchParams.get("type");

  // Initialize filters from URL params
  useEffect(() => {
    const type = searchParams.get("type");
    if (type) {
      setFilters((prev) => ({ ...prev, propertyType: type as any }));
    }
  }, [searchParams]);

  // Fetch or use mockup properties
  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      setError(null);
      
      // For houses, use mockup data
      if (propertyType === "houses" || propertyType === "house") {
        setProperties(HOUSE_MOCKUPS as any);
        setIsLoading(false);
        return;
      }

      // For apartments, use mockup data
      if (propertyType === "apartments" || propertyType === "apartment") {
        setProperties(APARTMENT_MOCKUPS as any);
        setIsLoading(false);
        return;
      }

      // For land, use mockup data
      if (propertyType === "land") {
        setProperties(LAND_MOCKUPS as any);
        setIsLoading(false);
        return;
      }

      // For commercial, use mockup data
      if (propertyType === "commercial") {
        setProperties(COMMERCIAL_MOCKUPS as any);
        setIsLoading(false);
        return;
      }

      // For other types, try to fetch from API
      try {
        const response = await propertyService.getProperties(filters);
        setProperties(response.data || []);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError("Failed to load properties. Please try again later.");
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [filters, propertyType]);

  // Pagination calculations
  const totalPages = Math.ceil(properties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;
  const currentProperties = properties.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2000&q=80"
            alt="Modern properties"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-slate-900/80" />
        </div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2 capitalize">
            {propertyType ? `${propertyType} Properties` : "Find Your Perfect Property"}
          </h1>
          <p className="text-slate-300">
            {propertyType 
              ? `Browse our collection of ${propertyType} available in Uganda`
              : "Browse properties available for sale, rent, and lease in Uganda"
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <PropertyFilters
            filters={filters}
            onFilterChange={setFilters}
            showAdvanced={false}
          />
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600">
            {isLoading ? (
              "Loading properties..."
            ) : (
              <>
                Showing <span className="font-medium">{startIndex + 1}-{Math.min(endIndex, properties.length)}</span> of <span className="font-medium">{properties.length}</span> properties
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && properties.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No Properties Found
            </h3>
            <p className="text-slate-500 mb-6">
              We couldn't find any properties matching your criteria.
              <br />
              Try adjusting your filters or check back later.
            </p>
            <Button onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Property Grid */}
        {(isLoading || currentProperties.length > 0) && (
          <PropertyGrid
            properties={currentProperties}
            isLoading={isLoading}
            variant={viewMode}
          />
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => handlePageChange(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function PropertiesLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading properties...</span>
      </div>
    </div>
  );
}

// Default export with Suspense wrapper
export default function PropertiesPageWrapper() {
  return (
    <Suspense fallback={<PropertiesLoading />}>
      <PropertiesPage />
    </Suspense>
  );
}
