"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Eye, Edit, Trash2, Search, Filter, AlertTriangle, Loader2 } from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { useAuthStore } from "@/store";
import { propertyService } from "@/services";
import type { Property } from "@/types";

export default function AdminPropertiesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    loadProperties();
  }, [user, isAuthenticated, authLoading, router]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyService.getProperties({}, 1, 100);
      setProperties(response.data || []);
    } catch (error) {
      console.error("Failed to load properties:", error);
    } finally {
      setLoading(false);
    }
  };

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
      await loadProperties();
      setShowDeleteConfirm(false);
      setPropertyToDelete(null);
      // You can add a toast notification here if you have a toast system
    } catch (error) {
      console.error("Failed to delete property:", error);
      alert("Failed to delete property. Check console for details.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || property.propertyType === filterType;
    return matchesSearch && matchesType;
  });

  const getPropertyTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      house: "bg-blue-100 text-blue-800",
      apartment: "bg-purple-100 text-purple-800",
      condo: "bg-green-100 text-green-800",
      villa: "bg-pink-100 text-pink-800",
      land: "bg-gray-100 text-gray-800",
      commercial: "bg-indigo-100 text-indigo-800",
      warehouse: "bg-orange-100 text-orange-800",
      office: "bg-cyan-100 text-cyan-800",
      airbnb: "bg-teal-100 text-teal-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">
            {authLoading ? "Checking authentication..." : "Loading properties..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="w-8 h-8 text-primary" />
                Property Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage all property listings on the platform
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">Back to Admin Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="villa">Villa</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
                <option value="warehouse">Warehouse</option>
                <option value="office">Office</option>
                <option value="airbnb">Airbnb</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Properties List */}
        <div className="grid gap-6">
          {filteredProperties.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Properties will appear here once they are created"}
              </p>
            </Card>
          ) : (
            filteredProperties.map((property) => (
              <Card key={property.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Property Image */}
                  {property.images && property.images.length > 0 && (
                    <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={property.images[0]?.url}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Property Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{property.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getPropertyTypeBadge(property.propertyType)}>
                            {property.propertyType}
                          </Badge>
                          <Badge variant="outline">{property.listingType}</Badge>
                          {property.features.bedrooms && (
                            <span className="text-sm text-muted-foreground">
                              {property.features.bedrooms} bedrooms
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          UGX {property.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {property.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {property.location?.city && (
                        <span>{property.location.city}</span>
                      )}
                      {property.location?.district && (
                        <span>{property.location.district}</span>
                      )}
                      <span>
                        Created {new Date(property.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <Link href={`/properties/${property.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/properties/${property.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(property)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        <Card className="mt-6 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {filteredProperties.length} of {properties.length} properties
            </span>
          </div>
        </Card>

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
                        src={typeof propertyToDelete.images[0] === 'string' ? propertyToDelete.images[0] : propertyToDelete.images[0]?.url}
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
                      UGX {propertyToDelete.price.toLocaleString()}
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

