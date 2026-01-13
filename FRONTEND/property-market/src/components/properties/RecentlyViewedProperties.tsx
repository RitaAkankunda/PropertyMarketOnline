"use client";

import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { PropertyGrid } from "./property-grid";
import { Card } from "@/components/ui";
import { History, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";

interface RecentlyViewedPropertiesProps {
  maxItems?: number;
  showTitle?: boolean;
  className?: string;
}

export function RecentlyViewedProperties({
  maxItems = 6,
  showTitle = true,
  className = "",
}: RecentlyViewedPropertiesProps) {
  const { recentlyViewed, isLoading, clearRecentlyViewed } = useRecentlyViewed();

  if (isLoading) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-6 h-6" />
              Recently Viewed
            </h2>
          </div>
        )}
        <PropertyGrid properties={[]} isLoading={true} variant="grid" />
      </div>
    );
  }

  if (recentlyViewed.length === 0) {
    return null; // Don't show section if no recently viewed
  }

  const displayProperties = recentlyViewed.slice(0, maxItems);

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6" />
            Recently Viewed Properties
          </h2>
          {recentlyViewed.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentlyViewed}
              className="text-slate-600 hover:text-slate-900"
            >
              Clear History
            </Button>
          )}
        </div>
      )}

      <PropertyGrid properties={displayProperties} isLoading={false} variant="grid" />

      {recentlyViewed.length > maxItems && (
        <div className="mt-6 text-center">
          <Link
            href="/dashboard/recently-viewed"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Recently Viewed ({recentlyViewed.length})
          </Link>
        </div>
      )}
    </div>
  );
}
