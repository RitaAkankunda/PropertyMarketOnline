"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input, Button, Select } from "@/components/ui";
import { PROPERTY_TYPES, LISTING_TYPES, LOCATIONS } from "@/lib/constants";
import type { PropertyFilters } from "@/types";

interface PropertyFiltersProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  showAdvanced?: boolean;
}

export function PropertyFiltersComponent({
  filters,
  onFilterChange,
  showAdvanced = false,
}: PropertyFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced);

  const updateFilter = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by location, property name..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          options={[
            { value: "", label: "All Types" },
            ...LISTING_TYPES.map((type) => ({
              value: type.value,
              label: type.label,
            })),
          ]}
          value={filters.listingType || ""}
          onChange={(value) =>
            updateFilter("listingType", value as PropertyFilters["listingType"])
          }
          placeholder="Listing Type"
          className="w-full sm:w-40"
        />
        <Button
          variant={showAdvancedFilters ? "default" : "outline"}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Property Type */}
            <Select
              label="Property Type"
              options={[
                { value: "", label: "All Types" },
                ...PROPERTY_TYPES.map((type) => ({
                  value: type.value,
                  label: type.label,
                })),
              ]}
              value={filters.propertyType?.[0] || ""}
              onChange={(value) =>
                updateFilter("propertyType", value ? [value as any] : undefined)
              }
              placeholder="Select type"
            />

            {/* Location */}
            <Select
              label="Location"
              options={[
                { value: "", label: "All Locations" },
                ...LOCATIONS.map((loc) => ({
                  value: loc.value,
                  label: loc.label,
                })),
              ]}
              value={filters.location || ""}
              onChange={(value) => updateFilter("location", value || undefined)}
              placeholder="Select location"
            />

            {/* Min Price */}
            <Input
              type="number"
              label="Min Price"
              placeholder="0"
              value={filters.minPrice || ""}
              onChange={(e) =>
                updateFilter(
                  "minPrice",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
            />

            {/* Max Price */}
            <Input
              type="number"
              label="Max Price"
              placeholder="Any"
              value={filters.maxPrice || ""}
              onChange={(e) =>
                updateFilter(
                  "maxPrice",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
            />

            {/* Bedrooms */}
            <Select
              label="Bedrooms"
              options={[
                { value: "", label: "Any" },
                { value: "1", label: "1+" },
                { value: "2", label: "2+" },
                { value: "3", label: "3+" },
                { value: "4", label: "4+" },
                { value: "5", label: "5+" },
              ]}
              value={filters.minBedrooms?.toString() || ""}
              onChange={(value) =>
                updateFilter(
                  "minBedrooms",
                  value ? Number(value) : undefined
                )
              }
              placeholder="Any"
            />

            {/* Min Area */}
            <Input
              type="number"
              label="Min Area (sqm)"
              placeholder="0"
              value={filters.minArea || ""}
              onChange={(e) =>
                updateFilter(
                  "minArea",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
            />

            {/* Verified Only */}
            <div className="flex items-end pb-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isVerified || false}
                  onChange={(e) =>
                    updateFilter(
                      "isVerified",
                      e.target.checked ? true : undefined
                    )
                  }
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">Verified Only</span>
              </label>
            </div>

            {/* Sort By */}
            <Select
              label="Sort By"
              options={[
                { value: "newest", label: "Newest First" },
                { value: "price_asc", label: "Price: Low to High" },
                { value: "price_desc", label: "Price: High to Low" },
                { value: "popular", label: "Most Popular" },
              ]}
              value={filters.sortBy || "newest"}
              onChange={(value) =>
                updateFilter("sortBy", value as PropertyFilters["sortBy"])
              }
              placeholder="Sort by"
            />
          </div>
        </div>
      )}
    </div>
  );
}
