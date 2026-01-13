"use client";

import { useState, useEffect } from "react";
import { Heart, Building2, MapPin, Bed, Bath, Square, Trash2, Eye } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";
import { favoritesService } from "@/services/favorites.service";
import { propertyService } from "@/services";
import { useRouter } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import type { Property } from "@/types";
import { PropertyWishlistButton } from "@/components/properties/PropertyWishlistButton";
import Link from "next/link";

interface FavoriteWithProperty {
  id: string;
  propertyId: string;
  createdAt: string;
  property: Property;
}

export default function SavedPropertiesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [favorites, setFavorites] = useState<FavoriteWithProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/dashboard/saved");
      return;
    }

    fetchFavorites();
  }, [isAuthenticated, router]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const favoritesData = await favoritesService.getFavorites();
      
      // Fetch full property details for each favorite
      const favoritesWithProperties = await Promise.all(
        favoritesData.map(async (fav) => {
          try {
            const property = await propertyService.getProperty(fav.propertyId);
            return {
              ...fav,
              property,
            };
          } catch (err) {
            console.error(`Failed to fetch property ${fav.propertyId}:`, err);
            return null;
          }
        })
      );

      // Filter out any null values (properties that failed to load)
      setFavorites(favoritesWithProperties.filter((fav): fav is FavoriteWithProperty => fav !== null));
    } catch (err: any) {
      console.error("Failed to fetch favorites:", err);
      setError(err.message || "Failed to load saved properties");
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      await favoritesService.removeFromFavorites(propertyId);
      setFavorites((prev) => prev.filter((fav) => fav.propertyId !== propertyId));
      
      // Trigger wishlist update event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wishlist-updated", {
            detail: { propertyId, added: false },
          })
        );
      }
    } catch (err: any) {
      console.error("Failed to remove favorite:", err);
      setError(err.message || "Failed to remove from favorites");
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">My Favorites</h1>
              <p className="text-slate-600">
                {favorites.length === 0
                  ? "No saved properties yet"
                  : `${favorites.length} ${favorites.length === 1 ? "property" : "properties"} saved`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Building2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFavorites}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading your favorites...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && favorites.length === 0 && !error && (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No Saved Properties Yet
            </h3>
            <p className="text-slate-500 mb-6">
              Start exploring properties and save your favorites to view them here.
            </p>
            <Button onClick={() => router.push("/properties")}>
              Browse Properties
            </Button>
          </Card>
        )}

        {/* Favorites Grid/List */}
        {!isLoading && favorites.length > 0 && (
          <div
            className={cn(
              "grid gap-6",
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            )}
          >
            {favorites.map((favorite) => {
              const property = favorite.property;
              const primaryImage = property.images?.[0]?.url || property.images?.[0] || null;

              if (viewMode === "list") {
                return (
                  <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <PropertyWishlistButton property={property} size="sm" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <Link
                              href={`/properties/${property.id}`}
                              className="text-xl font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                            >
                              {property.title}
                            </Link>
                            <div className="flex items-center text-slate-600 mt-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="text-sm">
                                {property.location?.city || "Location"},{" "}
                                {property.location?.district || ""}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFavorite(property.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Remove from favorites"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                          {property.propertyType !== "land" && (
                            <>
                              {property.features?.bedrooms && (
                                <div className="flex items-center gap-1">
                                  <Bed className="w-4 h-4" />
                                  <span>{property.features.bedrooms} Beds</span>
                                </div>
                              )}
                              {property.features?.bathrooms && (
                                <div className="flex items-center gap-1">
                                  <Bath className="w-4 h-4" />
                                  <span>{property.features.bathrooms} Baths</span>
                                </div>
                              )}
                            </>
                          )}
                          {property.features?.area && (
                            <div className="flex items-center gap-1">
                              <Square className="w-4 h-4" />
                              <span>
                                {property.features.area} {property.features.areaUnit || "sqft"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatCurrency(property.price, property.currency)}
                            </p>
                            {property.listingType === "rent" && (
                              <p className="text-sm text-slate-500">per month</p>
                            )}
                          </div>
                          <Button
                            onClick={() => router.push(`/properties/${property.id}`)}
                            variant="outline"
                          >
                            View Details
                          </Button>
                        </div>

                        <p className="text-xs text-slate-500 mt-4">
                          Saved on {new Date(favorite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              }

              // Grid View
              return (
                <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <PropertyWishlistButton property={property} size="sm" />
                    </div>
                    <Badge className="absolute top-3 left-3 bg-blue-600 text-white">
                      {property.listingType}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <Link
                      href={`/properties/${property.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 mb-2"
                    >
                      {property.title}
                    </Link>
                    <div className="flex items-center text-slate-600 text-sm mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="line-clamp-1">
                        {property.location?.city || "Location"}, {property.location?.district || ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3 text-sm text-slate-600">
                      {property.propertyType !== "land" && (
                        <>
                          {property.features?.bedrooms && (
                            <div className="flex items-center gap-1">
                              <Bed className="w-4 h-4" />
                              <span>{property.features.bedrooms}</span>
                            </div>
                          )}
                          {property.features?.bathrooms && (
                            <div className="flex items-center gap-1">
                              <Bath className="w-4 h-4" />
                              <span>{property.features.bathrooms}</span>
                            </div>
                          )}
                        </>
                      )}
                      {property.features?.area && (
                        <div className="flex items-center gap-1">
                          <Square className="w-4 h-4" />
                          <span>
                            {property.features.area} {property.features.areaUnit || "sqft"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(property.price, property.currency)}
                        </p>
                        {property.listingType === "rent" && (
                          <p className="text-xs text-slate-500">per month</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFavorite(property.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
