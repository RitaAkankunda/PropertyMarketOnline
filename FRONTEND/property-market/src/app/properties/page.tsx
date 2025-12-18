"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Grid, List, Map, Building2 } from "lucide-react";
import { Button } from "@/components/ui";
import { PropertyFilters, PropertyGrid } from "@/components/properties";
import { propertyService } from "@/services";
import type { Property, PropertyFilters as PropertyFiltersType } from "@/types";

function PropertiesPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<PropertyFiltersType>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from URL params
  useEffect(() => {
    const type = searchParams.get("type");
    if (type) {
      setFilters((prev) => ({ ...prev, listingType: type as any }));
    }
  }, [searchParams]);

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
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

    fetchProperties();
  }, [filters]);

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
          <h1 className="text-3xl font-bold text-white mb-2">
            Find Your Perfect Property
          </h1>
          <p className="text-slate-300">
            Browse properties available for sale, rent, and lease in Uganda
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
                Showing <span className="font-medium">{properties.length}</span> properties
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
        {(isLoading || properties.length > 0) && (
          <PropertyGrid
            properties={properties}
            isLoading={isLoading}
            variant={viewMode}
          />
        )}

        {/* Load More */}
        {properties.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Properties
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
