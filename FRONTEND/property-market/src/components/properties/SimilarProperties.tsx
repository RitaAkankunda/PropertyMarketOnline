"use client";

import { useState, useEffect } from "react";
import { propertyService } from "@/services";
import { PropertyGrid } from "./property-grid";
import type { Property } from "@/types";
import { Sparkles } from "lucide-react";

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

  useEffect(() => {
    loadSimilarProperties();
  }, [property.id, property.propertyType, property.price, property.location]);

  const loadSimilarProperties = async () => {
    try {
      setIsLoading(true);

      // Build filters based on current property
      const filters: any = {
        propertyType: [property.propertyType],
        // Exclude current property
        excludeId: property.id,
      };

      // Add location filter (same city)
      if (property.location?.city) {
        filters.city = property.location.city;
      }

      // Add price range filter (within 30% of current price)
      const priceRange = property.price * 0.3;
      filters.minPrice = Math.max(0, property.price - priceRange);
      filters.maxPrice = property.price + priceRange;

      const response = await propertyService.getProperties(filters, 1, maxItems + 1);
      let similar = response.data || [];

      // Exclude current property
      similar = similar.filter((p) => p.id !== property.id);

      // Limit to maxItems
      similar = similar.slice(0, maxItems);

      setSimilarProperties(similar);
    } catch (error) {
      console.error("Failed to load similar properties:", error);
      setSimilarProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          You Might Also Like
        </h2>
        <PropertyGrid properties={[]} isLoading={true} variant="grid" />
      </div>
    );
  }

  if (similarProperties.length === 0) {
    return null; // Don't show if no similar properties
  }

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Sparkles className="w-6 h-6" />
        You Might Also Like
      </h2>
      <p className="text-slate-600 mb-4 text-sm">
        Properties similar to this one in location, price, and type
      </p>
      <PropertyGrid properties={similarProperties} isLoading={false} variant="grid" />
    </div>
  );
}
