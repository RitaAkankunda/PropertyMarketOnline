"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Grid, List, Map, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { PropertyFilters, PropertyGrid } from "@/components/properties";
import { propertyService } from "@/services";
import type { Property, PropertyFilters as PropertyFiltersType } from "@/types";

// Property type labels
const propertyTypeLabels: Record<string, string> = {
  house: "Houses",
  apartment: "Apartments",
  villa: "Villas",
  land: "Land",
  commercial: "Commercial",
  office: "Offices",
  warehouse: "Warehouses",
  hotel: "Hotels",
};

function PropertiesPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<PropertyFiltersType>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesByType, setPropertiesByType] = useState<Record<string, Property[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerCategoryPerPage = 4; // Show 4 properties per category per page

  // Get property type from URL
  const propertyType = searchParams.get("type");

  // Initialize filters from URL params
  useEffect(() => {
    const type = searchParams.get("type");
    if (type) {
      // Map plural forms to singular (apartments -> apartment, houses -> house, etc.)
      const propertyTypeMap: Record<string, string> = {
        apartments: "apartment",
        houses: "house",
        villas: "villa",
        offices: "office",
      };
      const normalizedType = propertyTypeMap[type.toLowerCase()] || type.toLowerCase();
      setFilters((prev) => ({ ...prev, propertyType: normalizedType as any }));
    }
  }, [searchParams]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fetch properties from API
  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await propertyService.getProperties(filters);
        const allProperties = response.data || [];
        setProperties(allProperties);
        
        // Group properties by type
        const grouped: Record<string, Property[]> = {};
        allProperties.forEach((property) => {
          const type = property.propertyType;
          if (!grouped[type]) {
            grouped[type] = [];
          }
          grouped[type].push(property);
        });
        setPropertiesByType(grouped);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError("Failed to load properties. Please try again later.");
        setProperties([]);
        setPropertiesByType({});
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [filters, propertyType]);

  // Check if a specific property type filter is applied
  const isFilteredByType = !!filters.propertyType;
  const filteredType = filters.propertyType;
  
  // Get all property types that have properties
  // If filtered by type, only show that type
  const propertyTypesWithProperties = isFilteredByType
    ? [filteredType].filter(type => propertiesByType[type] && propertiesByType[type].length > 0)
    : Object.keys(propertiesByType).filter(
        (type) => propertiesByType[type].length > 0
      );
  
  const totalProperties = properties.length;
  
  // Calculate pagination for each category
  const getPaginatedPropertiesForCategory = (type: string) => {
    const categoryProperties = propertiesByType[type] || [];
    const startIndex = (currentPage - 1) * propertiesPerCategoryPerPage;
    const endIndex = startIndex + propertiesPerCategoryPerPage;
    return categoryProperties.slice(startIndex, endIndex);
  };
  
  // Calculate total pages (based on the category with most properties, or current filtered category)
  const propertiesToPaginate = isFilteredByType && propertiesByType[filteredType]
    ? propertiesByType[filteredType]
    : Object.values(propertiesByType).flat();
  const maxPropertiesInCategory = isFilteredByType && propertiesByType[filteredType]
    ? propertiesByType[filteredType].length
    : Math.max(
        ...Object.values(propertiesByType).map(props => props.length),
        0
      );
  const totalPages = Math.ceil(maxPropertiesInCategory / propertiesPerCategoryPerPage);
  
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
            {filters.propertyType 
              ? `${propertyTypeLabels[filters.propertyType] || filters.propertyType} Properties`
              : propertyType 
                ? `${propertyType} Properties` 
                : "Find Your Perfect Property"}
          </h1>
          <p className="text-slate-300">
            {filters.propertyType
              ? `Browse our collection of ${propertyTypeLabels[filters.propertyType] || filters.propertyType} available in Uganda`
              : propertyType 
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
                Showing <span className="font-medium">{totalProperties}</span> properties across <span className="font-medium">{propertyTypesWithProperties.length}</span> categories
                {totalPages > 1 && (
                  <> • Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></>
                )}
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

        {/* Properties Grouped by Category */}
        {!isLoading && propertyTypesWithProperties.length > 0 && (
          <div className="space-y-12">
            {propertyTypesWithProperties.map((type) => {
              const typeProperties = propertiesByType[type];
              const paginatedProperties = getPaginatedPropertiesForCategory(type);
              const typeLabel = propertyTypeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
              const categoryTotalPages = Math.ceil(typeProperties.length / propertiesPerCategoryPerPage);
              const startIndex = (currentPage - 1) * propertiesPerCategoryPerPage;
              const endIndex = Math.min(startIndex + propertiesPerCategoryPerPage, typeProperties.length);
              
              return (
                <div key={type} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{typeLabel}</h2>
                      <p className="text-slate-600 mt-1">
                        {typeProperties.length} {typeProperties.length === 1 ? 'property' : 'properties'} available
                        {categoryTotalPages > 1 && (
                          <> • Showing {startIndex + 1}-{endIndex} of {typeProperties.length}</>
                        )}
                      </p>
                    </div>
                    {typeProperties.length > propertiesPerCategoryPerPage && (
                      <Button
                        variant="outline"
                        onClick={() => setFilters({ ...filters, propertyType: type as any })}
                      >
                        View All {typeLabel}
                      </Button>
                    )}
                  </div>
                  {paginatedProperties.length > 0 ? (
                    <PropertyGrid
                      properties={paginatedProperties}
                      isLoading={false}
                      variant={viewMode}
                    />
                  ) : (
                    <p className="text-slate-500 text-center py-8">No more properties in this category.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <PropertyGrid
            properties={[]}
            isLoading={true}
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
