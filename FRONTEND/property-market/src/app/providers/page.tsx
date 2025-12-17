"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  BadgeCheck,
  Phone,
  Filter,
  Grid,
  List,
  Zap,
  Droplet,
  Hammer,
  Paintbrush,
  Sparkles,
  Truck,
  Shield,
  Home,
  Calculator,
  Scale,
  Wrench,
  ChevronRight,
  Users,
} from "lucide-react";
import { Button, Input, Select, Card, Badge } from "@/components/ui";
import { providerService } from "@/services";
import { cn } from "@/lib/utils";
import type { ServiceProvider, ServiceType } from "@/types";
import { SERVICE_PROVIDER_CATEGORIES } from "@/lib/constants";

// Service category icons mapping
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  electrician: Zap,
  plumber: Droplet,
  carpenter: Hammer,
  painter: Paintbrush,
  cleaner: Sparkles,
  mover: Truck,
  security: Shield,
  surveyor: MapPin,
  valuer: Calculator,
  lawyer: Scale,
  mason: Home,
  appliance_repair: Wrench,
  roofing: Home,
  interior_designer: Paintbrush,
  landscaper: Home,
};

// Provider Card Component
function ProviderCard({ provider }: { provider: ServiceProvider }) {
  const IconComponent = categoryIcons[provider.serviceTypes[0]] || Wrench;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-slate-900 truncate">
                {provider.businessName}
              </h3>
              {provider.isKycVerified && (
                <BadgeCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-slate-500 mb-2">
              {provider.user.firstName} {provider.user.lastName}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{provider.rating}</span>
                <span className="text-slate-400">({provider.reviewCount})</span>
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-4 h-4" />
                {provider.location.city}
                {provider.location.district && `, ${provider.location.district}`}
              </span>
            </div>
          </div>
        </div>

        <p className="text-slate-600 text-sm mt-4 line-clamp-2">
          {provider.description}
        </p>

        <div className="flex items-center gap-2 mt-4">
          <Badge variant="secondary" className="text-xs">
            {SERVICE_PROVIDER_CATEGORIES.find((c) => c.value === provider.serviceTypes[0])?.label || provider.serviceTypes[0]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {provider.completedJobs} jobs completed
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm">
            {provider.pricing.type === "hourly" && (
              <span className="font-semibold text-slate-900">
                UGX {provider.pricing.hourlyRate?.toLocaleString()}/hr
              </span>
            )}
            {provider.pricing.type === "fixed" && (
              <span className="font-semibold text-slate-900">
                From UGX {provider.pricing.minimumCharge?.toLocaleString()}
              </span>
            )}
            {provider.pricing.type === "custom" && (
              <span className="font-semibold text-slate-900">Custom Quote</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
            <Link
              href={`/providers/${provider.id}`}
              className="inline-flex items-center justify-center h-9 px-3 text-xs rounded-md font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers from API
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await providerService.getProviders({
          serviceType: (selectedCategory as ServiceType) || undefined,
          location: selectedLocation || undefined,
          search: searchQuery || undefined,
        });
        setProviders(response.data);
      } catch (err) {
        console.error("Failed to fetch providers:", err);
        setError("Failed to load providers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [selectedCategory, selectedLocation, searchQuery]);

  // Filter providers (additional client-side filtering if needed)
  const filteredProviders = providers;

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...SERVICE_PROVIDER_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: cat.label,
    })),
  ];

  const locationOptions = [
    { value: "", label: "All Locations" },
    { value: "kampala", label: "Kampala" },
    { value: "makindye", label: "Makindye" },
    { value: "nakawa", label: "Nakawa" },
    { value: "rubaga", label: "Rubaga" },
    { value: "kawempe", label: "Kawempe" },
    { value: "entebbe", label: "Entebbe" },
    { value: "jinja", label: "Jinja" },
    { value: "wakiso", label: "Wakiso" },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <section className="relative overflow-hidden text-white">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"
              alt="Modern buildings"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-orange-500/85" />
          </div>
          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Trusted Service Providers
              </h1>
              <p className="text-lg text-orange-100">
                Loading providers...
              </p>
            </div>
          </div>
        </section>
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <section className="relative overflow-hidden text-white">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"
              alt="Modern buildings"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-orange-500/85" />
          </div>
          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Trusted Service Providers
              </h1>
            </div>
          </div>
        </section>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Unable to Load Providers
            </h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"
            alt="Modern buildings"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-orange-500/85" />
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Trusted Service Providers
            </h1>
            <p className="text-lg text-orange-100 mb-8">
              Connect with verified professionals for all your property needs.
              Electricians, plumbers, carpenters, and more.
            </p>

            {/* Search Box */}
            <div className="bg-white rounded-2xl p-2 shadow-xl max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by service or provider name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <Button size="xl" className="bg-orange-500 hover:bg-orange-600 md:px-8 rounded-xl">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Quick Links */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-3">
            {SERVICE_PROVIDER_CATEGORIES.slice(0, 8).map((category) => {
              const IconComponent = categoryIcons[category.value] || Wrench;
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(selectedCategory === category.value ? "" : category.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                    selectedCategory === category.value
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-slate-700 border-slate-200 hover:border-orange-500 hover:text-orange-500"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <Select
                options={categoryOptions}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="Category"
                className="w-full md:w-48"
              />
              <Select
                options={locationOptions}
                value={selectedLocation}
                onChange={setSelectedLocation}
                placeholder="Location"
                className="w-full md:w-48"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {filteredProviders.length} providers found
              </span>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Providers Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {filteredProviders.length > 0 ? (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              )}
            >
              {filteredProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No providers found
              </h3>
              <p className="text-slate-500 mb-6">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                  setSelectedLocation("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}

          {filteredProviders.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Providers
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Become a Provider CTA */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Are You a Service Provider?</h2>
            <p className="text-slate-400 mb-8">
              Join our platform and connect with thousands of property owners looking
              for your services. Get more jobs and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/providers/register"
                className="inline-flex items-center justify-center h-12 px-8 text-base rounded-lg font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                Register as Provider
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/providers/how-it-works"
                className="inline-flex items-center justify-center h-12 px-8 text-base rounded-lg font-medium text-white border border-white/20 hover:bg-white/10 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
