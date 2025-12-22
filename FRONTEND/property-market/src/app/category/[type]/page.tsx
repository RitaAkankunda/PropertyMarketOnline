"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PropertyGrid } from "@/components/properties/property-grid";
import { propertyService } from "@/services/property.service";
import { Button } from "@/components/ui";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Property, ListingType } from "@/types";

export default function CategoryPage() {
  const params = useParams();
  const type = (params.type as ListingType) || "rent";
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await propertyService.getProperties({ listingType: type }, 1, 16);
        setProperties(response.data || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err) {
        setError("Failed to load properties. Please try again later.");
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, [type]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Banner */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-600 py-12 text-center text-white">
        <h1 className="text-4xl font-bold mb-2 capitalize">{type} Properties</h1>
        <p className="text-lg">Browse the latest {type} properties in Uganda</p>
      </div>
      {/* Property Grid */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {error && (
          <div className="text-center text-red-500 mb-8">{error}</div>
        )}
        <PropertyGrid
          properties={properties}
          isLoading={isLoading}
          variant="grid"
          className="mb-8"
        />
        <div className="flex justify-center mt-8">
          <Button variant="outline" size="lg">
            View All
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
