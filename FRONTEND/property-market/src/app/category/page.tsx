"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { propertyService } from "@/services/property.service";
import { Button } from "@/components/ui";
import Link from "next/link";
import type { Property, PropertyType, ListingType, User } from "@/types";

const PROPERTY_TYPES: { type: PropertyType; label: string; icon: string }[] = [
  { type: "house", label: "Houses", icon: "🏠" },
  { type: "apartment", label: "Apartments", icon: "🏢" },
  { type: "land", label: "Land", icon: "📍" },
  { type: "commercial", label: "Commercial", icon: "🏬" },
  { type: "villa", label: "Villas", icon: "🏡" },
  { type: "office", label: "Offices", icon: "🏛️" },
];

const MOCKUP_IMAGES = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1570129477492-45a003537e67?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
];

interface PropertyWithMockup extends Partial<Property> {
  mockupImage: string;
  title: string;
  price: number;
  currency: string;
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoryPageContent />
    </Suspense>
  );
}

function CategoryPageContent() {
  const searchParams = useSearchParams();
  const [propertiesByType, setPropertiesByType] = useState<
    Record<PropertyType, PropertyWithMockup[]>
  >({} as Record<PropertyType, PropertyWithMockup[]>);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const type = (searchParams.get("type") as ListingType) || "sale";

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await propertyService.getProperties(
          { listingType: type as ListingType },
          1,
          100
        );

        const properties = response.data || [];
        const grouped: Record<PropertyType, PropertyWithMockup[]> = {} as Record<PropertyType, PropertyWithMockup[]>;

        // Initialize grouped object with empty arrays for all property types
        PROPERTY_TYPES.forEach((pt) => {
          grouped[pt.type] = [];

          const typeProperties = properties
            .filter((p) => p.propertyType === pt.type)
            .slice(0, 4)
            .map((p, index) => ({
              ...p,
              mockupImage: MOCKUP_IMAGES[index % MOCKUP_IMAGES.length],
            }));

          grouped[pt.type] = typeProperties;
        });

        setPropertiesByType(grouped);
      } catch (err) {
        setError("Failed to load properties. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, [type]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-600 py-12 text-center text-white">
        <h1 className="text-4xl font-bold mb-2 capitalize">{type} Properties</h1>
        <p className="text-lg">Browse the latest {type} properties in Uganda</p>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        {error && <div className="text-center text-red-500 mb-8">{error}</div>}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading properties...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {PROPERTY_TYPES.map((propertyType) => (
              <section key={propertyType.type}>
                {/* Category Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{propertyType.icon}</span>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {propertyType.label}
                      </h2>
                      <p className="text-gray-600">
                        Explore our {propertyType.label.toLowerCase()} listings
                      </p>
                    </div>
                  </div>
                </div>

                {/* Property Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {(propertiesByType[propertyType.type] || []).map(
                    (property, index) => (
                      <Link
                        key={`${propertyType.type}-${index}`}
                        href={property.id ? `/properties/${property.id}` : "#"}
                      >
                        <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer h-full">
                          {/* Image */}
                          <div className="relative h-48 overflow-hidden bg-gray-200">
                            <img
                              src={property.mockupImage}
                              alt={property.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                              {property.title}
                            </h3>
                            <p className="text-2xl font-bold text-blue-600 mb-3">
                              {property.currency} {property.price?.toLocaleString()}
                            </p>
                            <Button
                              className="w-full"
                              size="sm"
                              variant="outline"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </Link>
                    )
                  )}
                </div>

                {/* Browse All Button */}
                <div className="flex justify-center mb-12">
                  <Link
                    href={`/listings?type=${propertyType.type}&listing=${type}`}
                  >
                    <Button variant="outline" size="lg">
                      View All {propertyType.label} →
                    </Button>
                  </Link>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
