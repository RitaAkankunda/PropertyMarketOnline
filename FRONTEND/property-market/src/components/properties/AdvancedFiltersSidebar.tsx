"use client";

import { useState } from "react";
import { X, SlidersHorizontal, Check } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { PropertyFilters } from "@/types";

interface AdvancedFiltersSidebarProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  isOpen: boolean;
  onClose: () => void;
  propertyCount?: number;
}

// Common amenities
const AMENITIES = [
  { id: "parking", label: "Parking", icon: "🚗" },
  { id: "wifi", label: "WiFi", icon: "📶" },
  { id: "pool", label: "Swimming Pool", icon: "🏊" },
  { id: "gym", label: "Gym", icon: "💪" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "garden", label: "Garden", icon: "🌳" },
  { id: "elevator", label: "Elevator", icon: "🛗" },
  { id: "balcony", label: "Balcony", icon: "🏡" },
  { id: "air_conditioning", label: "Air Conditioning", icon: "❄️" },
  { id: "furnished", label: "Furnished", icon: "🛋️" },
];

// Property types
const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condominium" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "warehouse", label: "Warehouse" },
  { value: "office", label: "Office Space" },
  { value: "airbnb", label: "Airbnb" },
  { value: "hotel", label: "Hotel" },
];

// Rating options
const RATINGS = [
  { value: 4, label: "4+ Excellent" },
  { value: 3, label: "3+ Very Good" },
  { value: 2, label: "2+ Good" },
  { value: 1, label: "1+ Fair" },
];

export function AdvancedFiltersSidebar({
  filters,
  onFilterChange,
  isOpen,
  onClose,
  propertyCount = 0,
}: AdvancedFiltersSidebarProps) {
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || 0,
    max: filters.maxPrice || 1000000000,
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    filters.amenities || []
  );

  const updateFilter = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handlePriceChange = (type: "min" | "max", value: number) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
    updateFilter("minPrice", newRange.min > 0 ? newRange.min : undefined);
    updateFilter("maxPrice", newRange.max < 1000000000 ? newRange.max : undefined);
  };

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter((id) => id !== amenityId)
      : [...selectedAmenities, amenityId];
    setSelectedAmenities(newAmenities);
    updateFilter("amenities", newAmenities.length > 0 ? newAmenities : undefined);
  };

  const clearAllFilters = () => {
    setPriceRange({ min: 0, max: 1000000000 });
    setSelectedAmenities([]);
    onFilterChange({});
  };

  const activeFilterCount = [
    filters.minPrice,
    filters.maxPrice,
    filters.amenities?.length,
    filters.propertyType?.length,
    filters.minBedrooms,
    filters.isVerified,
  ].filter(Boolean).length;

  return (
    <>
      {/* Overlay - Only on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto",
          "lg:relative lg:z-auto lg:shadow-none lg:max-w-xs lg:translate-x-0",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Results Count */}
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{propertyCount}</span> properties found
          </div>

          {/* Price Range */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Price Range</h3>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="1000000000"
                  step="1000000"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange("min", Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>UGX 0</span>
                  <span>UGX 1B+</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Min Price</label>
                  <input
                    type="number"
                    value={priceRange.min || ""}
                    onChange={(e) => handlePriceChange("min", Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Max Price</label>
                  <input
                    type="number"
                    value={priceRange.max === 1000000000 ? "" : priceRange.max}
                    onChange={(e) => handlePriceChange("max", Number(e.target.value) || 1000000000)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Any"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Property Type */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Property Type</h3>
            <div className="space-y-2">
              {PROPERTY_TYPES.map((type) => {
                const isSelected = filters.propertyType?.includes(type.value as any);
                return (
                  <label
                    key={type.value}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                      isSelected
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const currentTypes = filters.propertyType || [];
                        const newTypes = e.target.checked
                          ? [...currentTypes, type.value as any]
                          : currentTypes.filter((t) => t !== type.value);
                        updateFilter(
                          "propertyType",
                          newTypes.length > 0 ? newTypes : undefined
                        );
                      }}
                      className="rounded border-input"
                    />
                    <span className="text-sm text-slate-700">{type.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                  </label>
                );
              })}
            </div>
          </Card>

          {/* Bedrooms */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Bedrooms</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((beds) => {
                const isSelected = filters.minBedrooms === beds;
                return (
                  <button
                    key={beds}
                    onClick={() =>
                      updateFilter("minBedrooms", isSelected ? undefined : beds)
                    }
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {beds}+
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Amenities */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Amenities</h3>
            <div className="space-y-2">
              {AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity.id);
                return (
                  <label
                    key={amenity.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                      isSelected
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAmenity(amenity.id)}
                      className="rounded border-input"
                    />
                    <span className="text-lg">{amenity.icon}</span>
                    <span className="text-sm text-slate-700 flex-1">{amenity.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </label>
                );
              })}
            </div>
          </Card>

          {/* Verified Only */}
          <Card className="p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isVerified || false}
                onChange={(e) =>
                  updateFilter("isVerified", e.target.checked ? true : undefined)
                }
                className="rounded border-input"
              />
              <div>
                <span className="text-sm font-medium text-slate-900 block">
                  Verified Properties Only
                </span>
                <span className="text-xs text-slate-500">
                  Show only verified listings
                </span>
              </div>
            </label>
          </Card>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
