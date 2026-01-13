"use client";

import { BadgeCheck, TrendingUp, Star, Shield, Award } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertyBadgesProps {
  property: Property;
  className?: string;
  showAll?: boolean;
}

export function PropertyBadges({
  property,
  className,
  showAll = false,
}: PropertyBadgesProps) {
  const badges: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    condition: boolean;
  }> = [
    {
      id: "verified",
      label: "Verified",
      icon: <BadgeCheck className="w-3 h-3" />,
      color: "bg-green-100 text-green-700 border-green-200",
      condition: property.isVerified || false,
    },
    {
      id: "featured",
      label: "Featured",
      icon: <Star className="w-3 h-3" />,
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      condition: property.isFeatured || false,
    },
    {
      id: "popular",
      label: "Popular",
      icon: <TrendingUp className="w-3 h-3" />,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      condition: (property.views || 0) > 100,
    },
    {
      id: "best_value",
      label: "Best Value",
      icon: <Award className="w-3 h-3" />,
      color: "bg-purple-100 text-purple-700 border-purple-200",
      condition: showAll || (property.price || 0) < 50000000, // Example condition
    },
    {
      id: "secure",
      label: "Secure Booking",
      icon: <Shield className="w-3 h-3" />,
      color: "bg-slate-100 text-slate-700 border-slate-200",
      condition: showAll || property.isVerified || false,
    },
  ];

  const visibleBadges = badges.filter((badge) => badge.condition);

  if (visibleBadges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visibleBadges.map((badge) => (
        <Badge
          key={badge.id}
          variant="outline"
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs font-medium",
            badge.color
          )}
        >
          {badge.icon}
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
