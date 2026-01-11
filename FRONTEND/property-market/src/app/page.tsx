"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Building2,
  Home,
  MapPin,
  BadgeCheck,
  Wrench,
  CreditCard,
  MessageSquare,
  Shield,
  TrendingUp,
  Star,
  ChevronRight,
  Zap,
  Clock,
  Globe,
  ArrowRight,
  Droplet,
  Hammer,
  Paintbrush,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { APP_NAME } from "@/lib/constants";
import { propertyService, providerService } from "@/services";
import api from "@/services/api";
import type { Property, PropertyType } from "@/types";

// Hero Section Categories
const heroCategories = [
  { id: "buy", label: "Buy", icon: Home, href: "/category/buy" },
  { id: "rent", label: "Rent", icon: Building2, href: "/category/rent" },
  { id: "lease", label: "Lease", icon: MapPin, href: "/category/lease" },
  { id: "list", label: "List Property", icon: TrendingUp, href: "/listings/create" },
];

// Features
const features = [
  {
    icon: Search,
    title: "Smart Property Search",
    description:
      "Find your perfect property with advanced filters, map view, and AI-powered recommendations.",
    href: "/properties",
    color: "bg-blue-500",
  },
  {
    icon: BadgeCheck,
    title: "Verified Listings",
    description:
      "Every listing goes through our verification process to ensure authenticity and reduce fraud.",
    href: "/about#verification",
    color: "bg-green-500",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "Pay with MTN MoMo, Airtel Money, or cards. All transactions are secured and tracked.",
    href: "/payments",
    color: "bg-purple-500",
  },
  {
    icon: Wrench,
    title: "Service Providers",
    description:
      "Connect with verified electricians, plumbers, carpenters, and more for all your property needs.",
    href: "/providers",
    color: "bg-orange-500",
  },
  {
    icon: MessageSquare,
    title: "In-App Messaging",
    description:
      "Communicate directly with property owners, agents, and service providers securely.",
    href: "/messages",
    color: "bg-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Analytics Dashboard",
    description:
      "Track views, leads, and performance of your listings with detailed analytics.",
    href: "/dashboard",
    color: "bg-cyan-500",
  },
];

// Property Types
const propertyTypes = [
  { 
    name: "Houses", 
    type: "house" as PropertyType,
    icon: Home,
  },
  { 
    name: "Apartments", 
    type: "apartment" as PropertyType,
    icon: Building2,
  },
  { 
    name: "Airbnb Stays", 
    type: "airbnb" as PropertyType,
    icon: Home,
  },
  { 
    name: "Hotels", 
    type: "hotel" as PropertyType,
    icon: Building2,
  },
  { 
    name: "Villas", 
    type: "villa" as PropertyType,
    icon: Home,
  },
  { 
    name: "Land", 
    type: "land" as PropertyType,
    icon: MapPin,
  },
  { 
    name: "Commercial", 
    type: "commercial" as PropertyType,
    icon: Building2,
  },
  { 
    name: "Offices", 
    type: "office" as PropertyType,
    icon: Building2,
  },
];

// Service Provider Categories
const serviceCategories = [
  { name: "Electricians", icon: Zap },
  { name: "Plumbers", icon: Droplet },
  { name: "Carpenters", icon: Hammer },
  { name: "Painters", icon: Paintbrush },
  { name: "Cleaners", icon: Sparkles },
  { name: "Movers", icon: Truck },
];

// Testimonials - Empty until real reviews are available
const testimonials: { name: string; role: string; content: string; rating: number }[] = [];

// Why Choose Us
const whyChooseUs = [
  {
    icon: Shield,
    title: "Trusted & Secure",
    description: "All properties and providers are verified for your safety.",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Find properties 10x faster with our smart search.",
  },
  {
    icon: Globe,
    title: "Access Anywhere",
    description: "Use on any device, anytime, anywhere in Uganda.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const hasFetchedStats = useRef(false);
  const hasFetchedProperties = useRef(false);
  const [propertiesByType, setPropertiesByType] = useState<Record<PropertyType, Property[]>>({} as Record<PropertyType, Property[]>);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { value: "-", label: "Properties Listed" },
    { value: "-", label: "Total Bookings" },
    { value: "-", label: "Service Providers" },
    { value: "-", label: "Active Listings" },
  ]);

  // Build ranked list of property types with counts and pick top 4 for display
  const propertyTypesWithCount = propertyTypes.map((pt) => ({
    ...pt,
    count: (propertiesByType[pt.type] || []).length,
  }));

  const displayedPropertyTypes = [...propertyTypesWithCount]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 4);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedStats.current) return;
    hasFetchedStats.current = true;

    const fetchStats = async () => {
      try {
        // Fetch properties count
        const propertiesResponse = await propertyService.getProperties({}, 1, 1);
        const totalProperties = propertiesResponse.meta?.total || 0;
        
        // Fetch providers count
        const providersResponse = await providerService.getProviders({}, 1, 1);
        const totalProviders = providersResponse.meta?.total || 0;
        
        // Fetch bookings count (using verify endpoint which returns total)
        let totalBookings = 0;
        try {
          const bookingsResponse = await api.get('/bookings/verify');
          totalBookings = bookingsResponse.data?.total || 0;
        } catch (error) {
          // Silently handle - bookings count will show "-"
          if (process.env.NODE_ENV === 'development') {
            console.warn('[HOME PAGE] Failed to fetch bookings count:', error);
          }
        }
        
        // Note: Jobs endpoint requires authentication, so we skip it for public homepage
        // If you want to show completed jobs, create a public stats endpoint on the backend
        
        setStats([
          { value: totalProperties.toLocaleString(), label: "Properties Listed" },
          { value: totalBookings > 0 ? totalBookings.toLocaleString() : "-", label: "Total Bookings" },
          { value: totalProviders.toLocaleString(), label: "Service Providers" },
          { value: "-", label: "Active Listings" },
        ]);
      } catch (error) {
        // Silently handle errors - stats will show "-"
        if (process.env.NODE_ENV === 'development') {
          console.error('[HOME PAGE] Failed to fetch stats:', error);
        }
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedProperties.current) return;
    hasFetchedProperties.current = true;

    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        // Fetch ALL properties without category filter to get all available properties
        const allPropertiesResponse = await propertyService.getProperties(
          undefined, // No filters - get all properties
          1,
          100 // Get more properties to ensure we see all of them
        );
        
        const allProperties = allPropertiesResponse.data || [];

        // Group properties by type
        const grouped = {} as Record<PropertyType, Property[]>;
        
        // Initialize all property types with empty arrays
        propertyTypes.forEach((pt) => {
          grouped[pt.type] = [];
        });

        // Group properties by their propertyType
        allProperties.forEach((property) => {
          if (property.propertyType) {
            const normalizedType = property.propertyType.toLowerCase();
            // Find matching property type
            const matchingType = propertyTypes.find(pt => pt.type.toLowerCase() === normalizedType);
            if (matchingType && grouped[matchingType.type]) {
              grouped[matchingType.type].push(property);
            }
          }
        });

        setPropertiesByType(grouped);
      } catch (err) {
        // Silently handle errors - properties will just be empty
        if (process.env.NODE_ENV === 'development') {
          console.error("[HOME PAGE] Failed to fetch properties:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2000&q=80"
            alt="Modern apartments"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/85 to-slate-900/90" />
        </div>

        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 pb-32 md:pb-40 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center mb-6 bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
              <Star className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" />
              Your Trusted Property Platform in Uganda
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your Dream Property is{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                One Click Away
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Buy, rent, lease, or sell property with confidence. Connect with
              verified listings and trusted service providers all in one place.
            </p>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {heroCategories.map((category) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 border border-white/10 hover:border-white/30"
                >
                  <category.icon className="w-5 h-5" />
                  <span className="font-medium">{category.label}</span>
                </Link>
              ))}
            </div>

            {/* Search Box */}
            <form 
              className="bg-white rounded-2xl p-2 shadow-2xl max-w-3xl mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get('search') as string;
                if (query?.trim()) {
                  router.push(`/properties?search=${encodeURIComponent(query.trim())}`);
                } else {
                  router.push('/properties');
                }
              }}
            >
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Search by location, property type..."
                    className="w-full pl-12 pr-4 py-4 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button type="submit" size="xl" className="md:px-8 rounded-xl">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-12 mb-16 md:mb-20 max-w-3xl mx-auto px-2 md:px-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center flex flex-col items-center justify-center py-3 md:py-4">
                  <div className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-1.5 md:mb-2 leading-none">
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-slate-200 md:text-slate-300 font-medium leading-snug px-1 break-words hyphens-auto">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-20 md:h-28 lg:h-32 pointer-events-none">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block mb-4 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
              POWERFUL FEATURES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Find Your Perfect Property
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From searching to paying, we&apos;ve got you covered with the most
              comprehensive property platform in the region.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md"
              >
                <div className="p-6">
                  <div
                    className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 mb-4">{feature.description}</p>
                  <Link
                    href={feature.href}
                    className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700"
                  >
                    Learn more
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Property Types Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block mb-4 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
              BROWSE BY TYPE
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Explore Properties by Category
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-16">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-slate-200 rounded-2xl"></div>
                    <div>
                      <div className="h-7 w-48 bg-slate-200 rounded mb-2"></div>
                      <div className="h-5 w-32 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="bg-white rounded-xl overflow-hidden shadow-md">
                        <div className="h-48 bg-slate-200"></div>
                        <div className="p-4">
                          <div className="h-5 bg-slate-200 rounded mb-2"></div>
                          <div className="h-6 w-24 bg-slate-200 rounded mb-3"></div>
                          <div className="h-4 w-20 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {displayedPropertyTypes.map((type) => {
                const properties = propertiesByType[type.type] || [];

                return (
                  <div key={type.name}>
                    {/* Category Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center">
                        <type.icon className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                          {type.name}
                          <span className="text-sm font-medium text-slate-500">{type.count} listings</span>
                        </h3>
                        <p className="text-slate-600">Explore our {type.name.toLowerCase()} listings</p>
                      </div>
                    </div>

                    {/* Property Cards */}
                    {properties.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {properties.slice(0, 4).map((property) => (
                          <Link
                            key={property.id}
                            href={`/properties/${property.id}`}
                            className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                          >
                            <div className="relative h-48 overflow-hidden bg-gray-200">
                              {property.images && property.images.length > 0 ? (
                                <Image
                                  src={property.images[0].url}
                                  alt={property.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                  <type.icon className="w-12 h-12 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-slate-900 mb-2 line-clamp-1">
                                {property.title}
                              </h4>
                              <p className="text-xl font-bold text-blue-600 mb-3">
                                {property.currency} {property.price?.toLocaleString()}
                              </p>
                              <div className="flex items-center justify-between text-sm text-slate-500">
                                <span>View Details</span>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-6 p-6 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
                        No listings yet for this category. Be the first to list!
                      </div>
                    )}

                    {/* Browse All Button */}
                    <div className="text-center">
                      <Link
                        href={`/properties?type=${type.type}`}
                        className="inline-flex items-center justify-center h-12 px-8 text-base rounded-lg font-medium border border-input bg-white shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        View All {type.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Global view all CTA */}
              <div className="text-center pt-4">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center h-12 px-8 text-base rounded-lg font-semibold bg-blue-600 text-white shadow hover:bg-blue-700 transition-colors"
                >
                  View All Properties
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Service Providers Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block mb-4 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium">
                SERVICE PROVIDERS
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Find Trusted Service Providers for Your Property
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Connect with verified electricians, plumbers, carpenters,
                cleaners, and more. All providers are KYC verified with ratings
                and reviews from real customers.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {serviceCategories.map((category) => {
                  const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <Link
                      key={category.name}
                      href={`/providers?category=${encodeURIComponent(categorySlug)}`}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <category.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Find providers
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/providers"
                  className="inline-flex items-center justify-center h-12 px-8 text-base rounded-lg font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  Find a Provider
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  href="/auth/register/provider"
                  className="inline-flex items-center justify-center h-12 px-8 text-base rounded-lg font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Become a Provider
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-8 text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Wrench className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Service Provider Portal
                    </h3>
                    <p className="text-white/80">
                      Manage jobs, earnings & reviews
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <span>Active Jobs</span>
                    <span className="font-bold">-</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <span>This Month&apos;s Earnings</span>
                    <span className="font-bold">Track your income</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <span>Average Rating</span>
                    <span className="flex items-center gap-1 font-bold">
                      -{" "}
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full font-medium shadow-lg">
                <BadgeCheck className="w-4 h-4 inline mr-1" />
                KYC Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose {APP_NAME}?
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              We&apos;re building the most trusted property platform in the
              region.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {whyChooseUs.map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-blue-100">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center h-14 px-10 text-lg rounded-xl font-medium bg-white text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Hidden until real reviews are available */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block mb-4 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium">
                TESTIMONIALS
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                What Our Users Say
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="shadow-lg border-0">
                  <div className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-slate-600 mb-6 italic">
                      &quot;{testimonial.content}&quot;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Dream Property?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Start your property journey with us today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/properties"
                className="inline-flex items-center justify-center h-14 px-10 text-lg rounded-xl font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Properties
              </Link>
              <Link
                href="/listings/create"
                className="inline-flex items-center justify-center h-14 px-10 text-lg rounded-xl font-medium border border-white/20 hover:bg-white/10 text-white transition-colors"
              >
                <Building2 className="w-5 h-5 mr-2" />
                List Your Property
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
