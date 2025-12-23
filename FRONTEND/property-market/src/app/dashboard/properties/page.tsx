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
  MoreVertical,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { propertyService } from "@/services/property.service";
import { useAuth } from "@/hooks";
import { useRequireRole } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import type { Property } from "@/types";
import Image from "next/image";

export default function MyPropertiesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Protect route: Only LISTER, PROPERTY_MANAGER, ADMIN can access
  const { hasAccess } = useRequireRole(
    ['lister', 'property_manager', 'admin'],
    '/'
  );
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2">Access Denied</h2>
          <p className="text-slate-600 text-center mb-6">
            You need to be a property lister to view your properties.
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    async function fetchMyProperties() {
      try {
        setIsLoading(true);
        const response = await propertyService.getMyListings();
        setProperties(response.data || []);
      } catch (error: any) {
        console.error("Failed to fetch properties:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load your properties.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyProperties();
  }, [isAuthenticated, router, toast]);

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || property.propertyType === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      await propertyService.deleteProperty(id);
      setProperties(properties.filter((p) => p.id !== id));
      toast({
        title: "Success",
        description: "Property deleted successfully.",
      });
    } catch (error: any) {
      console.error("Failed to delete property:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete property.",
        variant: "destructive",
      });
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

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 px-10 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
                <option value="office">Office</option>
              </select>
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
                      {property.features?.bedrooms && (
                        <span>{property.features.bedrooms} Beds</span>
                      )}
                      {property.features?.bathrooms && (
                        <span>{property.features.bathrooms} Baths</span>
                      )}
                      {property.features?.area && (
                        <span>{property.features.area} {property.features.areaUnit || "sqft"}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(property.price, property.currency)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>{property.views || 0}</span>
                      </div>
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
                        onClick={() => handleDelete(property.id)}
                        className="text-destructive hover:text-destructive"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">
                  {properties.reduce((sum, p) => sum + (p.leads || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

