"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { propertyReviewsService } from "@/services/property-reviews.service";
import { cn } from "@/lib/utils";

interface PropertyRatingProps {
  propertyId: string;
  showReviewCount?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PropertyRating({
  propertyId,
  showReviewCount = true,
  size = "md",
  className,
}: PropertyRatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRating();
  }, [propertyId]);

  const loadRating = async () => {
    try {
      const response = await propertyReviewsService.getPropertyReviews(propertyId, 1, 1);
      if (response.statistics) {
        setRating(response.statistics.averageRating);
        setReviewCount(response.statistics.totalReviews);
      }
    } catch (error) {
      // Property might not have reviews yet - that's okay
      console.debug("No reviews found for property:", propertyId);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !rating) {
    return null; // Don't show anything if no rating
  }

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Star className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} />
      <span className={cn("font-semibold text-slate-900", textSizeClasses[size])}>
        {rating.toFixed(1)}
      </span>
      {showReviewCount && reviewCount > 0 && (
        <span className={cn("text-slate-600", textSizeClasses[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
