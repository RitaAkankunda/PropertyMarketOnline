"use client";

import { PropertyCard } from "./property-card";
import type { Property } from "@/types";
import { cn } from "@/lib/utils";

interface PropertyGridProps {
  properties: Property[];
  isLoading?: boolean;
  variant?: "grid" | "list";
  className?: string;
}

export function PropertyGrid({
  properties,
  isLoading,
  variant = "grid",
  className,
}: PropertyGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          variant === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4",
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <PropertyCardSkeleton key={i} variant={variant} />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <svg
            className="mx-auto h-16 w-16 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2">No properties found</h3>
          <p className="text-sm">
            Try adjusting your filters or search criteria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        variant === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4",
        className
      )}
    >
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          variant={variant === "list" ? "horizontal" : "default"}
        />
      ))}
    </div>
  );
}

function PropertyCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="flex flex-col sm:flex-row bg-card rounded-xl overflow-hidden border animate-pulse">
        <div className="w-full sm:w-72 h-48 bg-muted" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="flex gap-4 pt-4">
            <div className="h-4 bg-muted rounded w-16" />
            <div className="h-4 bg-muted rounded w-16" />
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden border animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="flex gap-4 pt-4 border-t">
          <div className="h-4 bg-muted rounded w-12" />
          <div className="h-4 bg-muted rounded w-12" />
          <div className="h-4 bg-muted rounded w-12" />
        </div>
      </div>
    </div>
  );
}
