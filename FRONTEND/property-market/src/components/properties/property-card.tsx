"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Square,
  BadgeCheck,
  Eye,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  className?: string;
  variant?: "default" | "compact" | "horizontal";
}

export function PropertyCard({
  property,
  className,
  variant = "default",
}: PropertyCardProps) {
  // Get primary image (marked as primary, or first image, or handle string array)
  const getPrimaryImage = () => {
    if (!property.images || property.images.length === 0) {
      return null;
    }
    
    // Handle case where images might be strings (legacy format)
    if (typeof property.images[0] === 'string') {
      const url = property.images[0];
      return url ? { url, isPrimary: true } : null;
    }
    
    // Find primary image or use first one
    const primary = property.images.find((img) => img.isPrimary) || property.images[0];
    return primary?.url ? primary : null;
  };
  
  const primaryImage = getPrimaryImage();

  const listingTypeColors = {
    sale: "bg-green-500",
    rent: "bg-blue-500",
    lease: "bg-purple-500",
  };

  const listingTypeLabels = {
    sale: "For Sale",
    rent: "For Rent",
    lease: "For Lease",
  };

  if (variant === "horizontal") {
    return (
      <Card
        padding="none"
        className={cn(
          "overflow-hidden hover:shadow-lg transition-shadow group",
          className
        )}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative w-full sm:w-72 h-48 sm:h-auto flex-shrink-0">
            <Image
              src={primaryImage?.url || "/placeholder-property.jpg"}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <span
                className={cn(
                  "text-white text-xs font-medium px-2 py-1 rounded",
                  listingTypeColors[property.listingType]
                )}
              >
                {listingTypeLabels[property.listingType]}
              </span>
              {property.isVerified && (
                <Badge variant="success" className="text-xs">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
              <Heart className="h-4 w-4 text-muted-foreground hover:text-red-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/properties/${property.id}`}
                    className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
                  >
                    {property.title}
                  </Link>
                  <div className="flex items-center text-muted-foreground text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.location?.city || 'Location'}, {property.location?.district || ''}
                  </div>
                </div>
                <p className="text-xl font-bold text-primary whitespace-nowrap">
                  {formatCurrency(property.price, property.currency)}
                  {property.listingType === "rent" && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  )}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {property.description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {property.propertyType === "land" ? (
                  <span className="flex items-center gap-1">
                    <Square className="h-4 w-4" />
                    {(property.features.area / 43560).toFixed(1)} acres
                  </span>
                ) : (
                  <>
                    {property.features.bedrooms && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        {property.features.bedrooms} Beds
                      </span>
                    )}
                    {property.features.bathrooms && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        {property.features.bathrooms} Baths
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      {property.features.area} {property.features.areaUnit}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                {property.views} views
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      padding="none"
      className={cn(
        "overflow-hidden hover:shadow-lg transition-shadow group",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {primaryImage?.url ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized={primaryImage.url.startsWith('blob:') || primaryImage.url.startsWith('http://localhost')}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={cn(
              "text-white text-xs font-medium px-2 py-1 rounded",
              listingTypeColors[property.listingType]
            )}
          >
            {listingTypeLabels[property.listingType]}
          </span>
          {property.isVerified && (
            <Badge variant="success" className="text-xs">
              <BadgeCheck className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
          <Heart className="h-4 w-4 text-muted-foreground hover:text-red-500" />
        </button>
        {property.isFeatured && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="default" className="bg-yellow-500 text-xs">
              Featured
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center text-muted-foreground text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          {property.location?.city || 'Location'}{property.location?.district ? `, ${property.location.district}` : ''}
        </div>

        <Link
          href={`/properties/${property.id}`}
          className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1 block"
        >
          {property.title}
        </Link>

        <p className="text-xl font-bold text-primary mt-2">
          {formatCurrency(property.price, property.currency)}
          {property.listingType === "rent" && (
            <span className="text-sm font-normal text-muted-foreground">
              /month
            </span>
          )}
        </p>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
          {property.features.bedrooms && (
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {property.features.bedrooms}
            </span>
          )}
          {property.features.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.features.bathrooms}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            {property.features.area} {property.features.areaUnit}
          </span>
        </div>
      </div>
    </Card>
  );
}
