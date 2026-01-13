"use client";

import { useState } from "react";
import { History, Trash2 } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { useRecentlyViewed } from "@/hooks";
import { PropertyGrid } from "@/components/properties";

export default function RecentlyViewedPage() {
  const { recentlyViewed, isLoading, clearRecentlyViewed } = useRecentlyViewed();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Recently Viewed Properties</h1>
              <p className="text-slate-600 mt-1">
                Properties you've recently browsed ({recentlyViewed.length})
              </p>
            </div>
          </div>
          {recentlyViewed.length > 0 && (
            <Button
              variant="outline"
              onClick={clearRecentlyViewed}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <PropertyGrid properties={[]} isLoading={true} variant="grid" />
        ) : recentlyViewed.length === 0 ? (
          <Card className="p-12 text-center">
            <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No Recently Viewed Properties
            </h3>
            <p className="text-slate-500 mb-6">
              Properties you view will appear here for easy access.
            </p>
            <Button asChild>
              <a href="/properties">Browse Properties</a>
            </Button>
          </Card>
        ) : (
          <PropertyGrid properties={recentlyViewed} isLoading={false} variant="grid" />
        )}
      </div>
    </div>
  );
}
