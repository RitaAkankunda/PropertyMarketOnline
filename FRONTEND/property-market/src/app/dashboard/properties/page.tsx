"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Search,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { propertyService } from "@/services/property.service";
import { useAuth } from "@/hooks";
import { useRequireRole } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Property } from "@/types";
import Image from "next/image";

export default function MyPropertiesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { error, success } = useToast();
  
  // Protect route: Only LISTER, PROPERTY_MANAGER, ADMIN can access
  const { hasAccess } = useRequireRole(
    ['lister', 'property_manager', 'admin'],
    '/'
  );
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (!hasAccess) {
      return;
    }

    async function fetchMyProperties() {
      try {
        setIsLoading(true);
        const response = await propertyService.getMyListings();
        setProperties(response.data || []);
      } catch (error: any) {
        console.error("Failed to fetch properties:", error);
        error(error.message || "Failed to load your properties.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyProperties();
  }, [isAuthenticated, authLoading, hasAccess, router, error]);

  // Show loading or redirect if user doesn't have access
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPropertyToDelete(null);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      setIsDeleting(true);
      await propertyService.deleteProperty(propertyToDelete.id);
      setProperties(properties.filter((p) => p.id !== propertyToDelete.id));
      success("Property deleted successfully.");
      setShowDeleteConfirm(false);
      setPropertyToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete property:", error);
      error(error.message || "Failed to delete property.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-slate-900">My Properties</h1>
              <p className="text-muted-foreground mt-2">
                Manage your property listings
              </p>
            </div>
            <Link href="/listings/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {properties.length === 0 ? "No Properties Yet" : "No Properties Found"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {properties.length === 0
                ? "Start by creating your first property listing."
                : "Try adjusting your search or filter criteria."}
            </p>
            {properties.length === 0 && (
              <Link href="/listings/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Listing
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => {
              const primaryImage =
                property.images.find((img) => img.isPrimary) || property.images[0];
              const imageUrl = primaryImage
                ? typeof primaryImage === "string"
                  ? primaryImage
                  : primaryImage.url
                : null;

              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition">
                  {/* Image */}
                  <div className="relative aspect-video bg-slate-200">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Building2 className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge
                        className={cn(
                          property.status === "active"
                            ? "bg-green-500"
                            : property.status === "pending"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        )}
                      >
                        {property.status}
                      </Badge>
                    </div>
                    {/* Photo count badge */}
                    {property.images && property.images.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {property.images.length}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Link
                          href={`/properties/${property.id}`}
                          className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1 block"
                        >
                          {property.title}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {property.propertyType} • {property.listingType}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      {property.features?.bedrooms && property.features?.bathrooms && (
                        <span>{property.features.bedrooms} bed • {property.features.bathrooms} bath</span>
                      )}
                      {property.features?.area && (
                        <span>{property.features.area} {property.features.areaUnit || "sqft"}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(property.price, property.currency)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/properties/${property.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link
                        href={`/properties/${property.id}/edit`}
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteClick(property)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {properties.length > 0 && (
          <Card className="mt-6 p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Properties</p>
                <p className="text-2xl font-bold">{properties.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {properties.filter((p) => p.status === "active").length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">
                  {properties.reduce((sum, p) => sum + (p.views || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && propertyToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95 duration-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    Delete Property
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone. All property data, images, and related information will be permanently deleted.
                  </p>
                </div>
              </div>

              {/* Property Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex items-start gap-3">
                  {propertyToDelete.images && propertyToDelete.images.length > 0 && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={typeof propertyToDelete.images[0] === 'string' 
                          ? propertyToDelete.images[0] 
                          : propertyToDelete.images[0]?.url}
                        alt={propertyToDelete.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {propertyToDelete.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {propertyToDelete.location?.city && propertyToDelete.location?.district
                        ? `${propertyToDelete.location.district}, ${propertyToDelete.location.city}`
                        : propertyToDelete.location?.city || propertyToDelete.location?.district || 'Location not specified'}
                    </p>
                    <p className="text-sm font-medium text-primary mt-1">
                      {formatCurrency(propertyToDelete.price, propertyToDelete.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={cancelDelete}
                  variant="outline"
                  className="flex-1"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  variant="destructive"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Property
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

