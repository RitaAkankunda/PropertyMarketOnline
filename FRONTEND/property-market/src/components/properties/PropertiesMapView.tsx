"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, MapMarker } from "@/components/maps/google-map";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, UGANDA_BOUNDS } from "@/lib/constants";
import { propertyService } from "@/services";
import type { Property } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui";
import { MapPin, Building2, Bed, Bath, Square } from "lucide-react";
import Link from "next/link";

interface PropertiesMapViewProps {
  filters?: any;
  onPropertiesChange?: (properties: Property[]) => void;
}

export function PropertiesMapView({
  filters = {},
  onPropertiesChange,
}: PropertiesMapViewProps) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);

  // Fetch properties when map bounds change
  const fetchPropertiesInBounds = useCallback(async () => {
    if (!mapBounds) return;

    setIsLoading(true);
    try {
      const response = await propertyService.getProperties({
        ...filters,
        north: mapBounds.north,
        south: mapBounds.south,
        east: mapBounds.east,
        west: mapBounds.west,
        // Don't paginate for map view - show all properties in bounds
        limit: 1000,
      });

      // propertyService.getProperties returns { data: Property[], meta: {...} }
      const allProperties = response.data || [];
      const propertiesWithLocation = allProperties.filter(
        (p: any) => {
          // Backend returns latitude/longitude directly, frontend transforms to location object
          const lat = p.location?.latitude || p.location?.coordinates?.lat || p.latitude;
          const lng = p.location?.longitude || p.location?.coordinates?.lng || p.longitude;
          return lat && lng && lat !== 0 && lng !== 0;
        }
      );

      setProperties(propertiesWithLocation);
      onPropertiesChange?.(propertiesWithLocation);
    } catch (error) {
      console.error("Failed to fetch properties for map:", error);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapBounds, filters, onPropertiesChange]);

  // Initial load - fetch all properties in Uganda
  useEffect(() => {
    const loadInitialProperties = async () => {
      setIsLoading(true);
      try {
        const response = await propertyService.getProperties({
          ...filters,
          north: UGANDA_BOUNDS.north,
          south: UGANDA_BOUNDS.south,
          east: UGANDA_BOUNDS.east,
          west: UGANDA_BOUNDS.west,
          limit: 1000,
        });

        // propertyService.getProperties returns PaginatedResponse with data array
        const allProperties = response.data || [];
        const propertiesWithLocation = allProperties.filter(
          (p: any) => {
            // Backend returns latitude/longitude directly, frontend transforms to location object
            const lat = p.location?.latitude || p.location?.coordinates?.lat || p.latitude;
            const lng = p.location?.longitude || p.location?.coordinates?.lng || p.longitude;
            return lat && lng && lat !== 0 && lng !== 0;
          }
        );

        setProperties(propertiesWithLocation);
        onPropertiesChange?.(propertiesWithLocation);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialProperties();
  }, [filters, onPropertiesChange]);

  // Handle map bounds change
  const handleBoundsChanged = useCallback(
    (bounds: { north: number; south: number; east: number; west: number } | null) => {
      if (bounds) {
        setMapBounds(bounds);
      }
    },
    []
  );

  // Convert properties to map markers (memoized for performance)
  const markers: MapMarker[] = useMemo(() => properties
    .filter((property: any) => {
      // Only include properties with valid coordinates
      const lat = property.location?.latitude || property.location?.coordinates?.lat || property.latitude;
      const lng = property.location?.longitude || property.location?.coordinates?.lng || property.longitude;
      return lat && lng && lat !== 0 && lng !== 0;
    })
    .map((property: any) => {
      // Handle both backend format (direct lat/lng) and frontend format (location object)
      const lat = property.location?.latitude || property.location?.coordinates?.lat || property.latitude || 0;
      const lng = property.location?.longitude || property.location?.coordinates?.lng || property.longitude || 0;
      const primaryImage =
        property.images?.[0]?.url || property.images?.[0] || null;

      return {
        id: property.id,
        position: { lat, lng },
        title: property.title,
        price: formatCurrency(property.price, property.currency),
        image: primaryImage,
        address: `${property.location?.city || ""}, ${property.location?.district || ""}`,
        property: property, // Store full property for details
      };
    }), [properties]);

  // Handle marker click
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    const property = (marker as any).property;
    if (property) {
      setSelectedProperty(property);
    }
  }, []);

  // Handle map click (close property details)
  const handleMapClick = () => {
    setSelectedProperty(null);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div className="w-full h-[calc(100vh-200px)] min-h-[600px]">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          markers={markers}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          onBoundsChanged={handleBoundsChanged}
          className="w-full h-full"
          showInfoWindow={false}
        />
      </div>

      {/* Property Details Card (shown when marker is clicked) */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-10">
          <Card className="p-4 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <Link
                href={`/properties/${selectedProperty.id}`}
                className="flex-1"
                onClick={() => setSelectedProperty(null)}
              >
                <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2">
                  {selectedProperty.title}
                </h3>
              </Link>
              <button
                onClick={() => setSelectedProperty(null)}
                className="ml-2 text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Property Image */}
            {(selectedProperty.images?.[0]?.url || selectedProperty.images?.[0]) && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img
                  src={
                    selectedProperty.images[0]?.url ||
                    selectedProperty.images[0]
                  }
                  alt={selectedProperty.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Location */}
            <div className="flex items-center text-slate-600 text-sm mb-3">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">
                {selectedProperty.location?.city || "Location"}
                {selectedProperty.location?.district &&
                  `, ${selectedProperty.location.district}`}
              </span>
            </div>

            {/* Property Features */}
            {selectedProperty.propertyType !== "land" && (
              <div className="flex items-center gap-4 mb-3 text-sm text-slate-600">
                {selectedProperty.features?.bedrooms && (
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    <span>{selectedProperty.features.bedrooms}</span>
                  </div>
                )}
                {selectedProperty.features?.bathrooms && (
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    <span>{selectedProperty.features.bathrooms}</span>
                  </div>
                )}
                {selectedProperty.features?.area && (
                  <div className="flex items-center gap-1">
                    <Square className="w-4 h-4" />
                    <span>
                      {selectedProperty.features.area}{" "}
                      {selectedProperty.features.areaUnit || "sqft"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(
                    selectedProperty.price,
                    selectedProperty.currency
                  )}
                </p>
                {selectedProperty.listingType === "rent" && (
                  <p className="text-xs text-slate-500">per month</p>
                )}
              </div>
              <Link
                href={`/properties/${selectedProperty.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                onClick={() => setSelectedProperty(null)}
              >
                View Details
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-10">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-600">Loading properties...</span>
        </div>
      )}

      {/* Properties Count */}
      {!isLoading && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg z-10">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">
              {properties.length} {properties.length === 1 ? "property" : "properties"} on map
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
