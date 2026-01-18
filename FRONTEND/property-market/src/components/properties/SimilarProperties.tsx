"use client";

import { useState, useEffect, useCallback } from "react";
import { propertyService } from "@/services";
import { PropertyGrid } from "./property-grid";
import type { Property } from "@/types";
import { Sparkles, MapPin } from "lucide-react";

interface SimilarPropertiesProps {
  property: Property;
  maxItems?: number;
  className?: string;
}

export function SimilarProperties({
  property,
  maxItems = 4,
  className = "",
}: SimilarPropertiesProps) {
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get city from property (could be at root level or in location object)
  const propertyCity = (property as any).city || property.location?.city;

  const loadSimilarProperties = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build filters based on current property
      const filters: any = {
        // Exclude current property
        excludeId: property.id,
      };

      // First priority: same property type
      if (property.propertyType) {
        filters.propertyType = [property.propertyType];
      }

      // Add location filter (same city)
      if (propertyCity) {
        filters.city = propertyCity;
      }

      // Add price range filter (within 50% of current price for more results)
      if (property.price > 0) {
        const priceRange = property.price * 0.5;
        filters.minPrice = Math.max(0, property.price - priceRange);
        filters.maxPrice = property.price + priceRange;
      }

      // Try to get similar properties with all filters
      let response = await propertyService.getProperties(filters, 1, maxItems + 5);
      let similar = response.data || [];

      // Exclude current property
      similar = similar.filter((p) => p.id !== property.id);

      // If not enough results, try without price filter
      if (similar.length < maxItems) {
        const relaxedFilters: any = {
          excludeId: property.id,
          propertyType: filters.propertyType,
        };
        if (propertyCity) {
          relaxedFilters.city = propertyCity;
        }
        
        response = await propertyService.getProperties(relaxedFilters, 1, maxItems + 5);
        const moreSimilar = (response.data || []).filter((p) => p.id !== property.id);
        
        // Merge and dedupe
        const existingIds = new Set(similar.map(p => p.id));
        moreSimilar.forEach(p => {
          if (!existingIds.has(p.id)) {
            similar.push(p);
          }
        });
      }

      // If still not enough, try just same property type (any location)
      if (similar.length < maxItems) {
        const typeOnlyFilters: any = {
          excludeId: property.id,
          propertyType: filters.propertyType,
        };
        
        response = await propertyService.getProperties(typeOnlyFilters, 1, maxItems + 5);
        const moreSimilar = (response.data || []).filter((p) => p.id !== property.id);
        
        // Merge and dedupe
        const existingIds = new Set(similar.map(p => p.id));
        moreSimilar.forEach(p => {
          if (!existingIds.has(p.id)) {
            similar.push(p);
          }
        });
      }

      // Limit to maxItems
      similar = similar.slice(0, maxItems);

      setSimilarProperties(similar);
    } catch (error) {
      console.error("Failed to load similar properties:", error);
      setSimilarProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [property.id, property.propertyType, property.price, propertyCity, maxItems]);

  useEffect(() => {
    loadSimilarProperties();
  }, [loadSimilarProperties]);

  if (isLoading) {
    return (
      <div className={`${className} bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">You Might Also Like</h2>
            <p className="text-sm text-slate-500">Finding similar properties...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="w-full h-40 bg-slate-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (similarProperties.length === 0) {
    return null; // Don't show if no similar properties
  }

  return (
    <div className={`${className} bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">You Might Also Like</h2>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {propertyCity ? `Similar ${property.propertyType}s in ${propertyCity}` : `Similar ${property.propertyType} properties`}
            </p>
          </div>
        </div>
        <span className="text-sm text-blue-600 font-medium bg-blue-100 px-3 py-1 rounded-full">
          {similarProperties.length} found
        </span>
      </div>
      <PropertyGrid properties={similarProperties} isLoading={false} variant="grid" />
    </div>
  );
}
