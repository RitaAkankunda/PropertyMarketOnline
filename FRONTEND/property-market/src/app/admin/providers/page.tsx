"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench, BadgeCheck, Filter, CheckCircle, XCircle, Download, ExternalLink } from "lucide-react";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { useAuthStore } from "@/store";
import { providerService } from "@/services/provider.service";
import Link from "next/link";
import type { ServiceProvider } from "@/types";

export default function AdminProvidersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) {
      return;
    }

    // Check if user is authenticated and is admin
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    loadProviders();
  }, [user, isAuthenticated, authLoading, router]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await providerService.getProviders({}, 1, 100);
      setProviders(response.data || []);
    } catch (error) {
      console.error("Failed to load providers:", error);
    } finally {
      setLoading(false);
    }
  };


  const filteredProviders = providers.filter((provider) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "verified") return provider.isVerified;
    if (statusFilter === "unverified") return !provider.isVerified;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? "Checking authentication..." : "Loading providers..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wrench className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Service Providers</h1>
            </div>
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Providers</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export to CSV functionality
                  const csv = [
                    ['Business Name', 'Email', 'Services', 'Location', 'Status', 'Rating', 'Joined'],
                    ...filteredProviders.map(p => [
                      p.businessName || `${p.user?.firstName} ${p.user?.lastName}`,
                      p.user?.email || '',
                      p.serviceTypes?.join('; ') || '',
                      `${p.location?.city || ''}, ${p.location?.district || ''}`,
                      p.isVerified ? 'Verified' : 'Unverified',
                      p.rating?.toString() || '0',
                      new Date(p.createdAt).toLocaleDateString()
                    ])
                  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `providers-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <div className="text-sm text-gray-500">
                {filteredProviders.length} of {providers.length} providers
              </div>
            </div>
          </div>
          <p className="mt-2 text-gray-600">
            Manage service provider accounts. To verify providers, use the{" "}
            <Link href="/admin/verifications" className="text-blue-600 hover:underline font-medium">
              Verifications tab
            </Link>{" "}
            to review their verification requests.
          </p>
        </div>

        <div className="grid gap-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar
                    name={provider.businessName || `${provider.user?.firstName} ${provider.user?.lastName}`}
                    size="lg"
                    className="h-12 w-12"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {provider.businessName || `${provider.user?.firstName} ${provider.user?.lastName}`}
                    </h3>
                    <p className="text-gray-600">{provider.user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {provider.serviceTypes && provider.serviceTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {provider.serviceTypes.slice(0, 3).map((type, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs">
                              {type}
                            </Badge>
                          ))}
                          {provider.serviceTypes.length > 3 && (
                            <Badge className="bg-gray-100 text-gray-800 text-xs">
                              +{provider.serviceTypes.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {provider.location?.city && `${provider.location.city}, `}
                      {provider.location?.district}
                    </p>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(provider.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end space-y-2">
                    {provider.isVerified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                    
                    {provider.rating > 0 && (
                      <div className="text-sm text-gray-600">
                        ⭐ {provider.rating.toFixed(1)} ({provider.reviewCount} reviews)
                      </div>
                    )}
                    
                    {provider.completedJobs > 0 && (
                      <div className="text-sm text-gray-600">
                        {provider.completedJobs} jobs completed
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Link href="/admin/verifications">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <BadgeCheck className="h-4 w-4 mr-2" />
                        Review Verification
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {providers.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No service providers found</h3>
            <p className="text-gray-600">Service providers will appear here once they register.</p>
          </div>
        )}
      </div>
    </div>
  );
}

