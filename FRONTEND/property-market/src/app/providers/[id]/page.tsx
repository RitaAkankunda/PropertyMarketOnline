"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  MapPin,
  BadgeCheck,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Calendar,
  Award,
  Briefcase,
  ChevronRight,
  MessageSquare,
  Share2,
  Heart,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { providerService } from "@/services";
import type { ServiceProvider, Review } from "@/types";
import { SERVICE_PROVIDER_CATEGORIES } from "@/lib/constants";

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"about" | "reviews" | "portfolio">("about");

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await providerService.getProvider(params.id as string);
        setProvider(data);
        
        // Fetch reviews
        const reviewsData = await providerService.getReviews(params.id as string);
        setReviews(reviewsData.data);
      } catch (err) {
        console.error("Failed to fetch provider:", err);
        setError("Failed to load provider details");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProvider();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading provider...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Provider Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || "This provider does not exist"}</p>
            <Button onClick={() => router.push("/providers")}>
              Browse All Providers
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const categoryLabel = SERVICE_PROVIDER_CATEGORIES.find(
    (c) => c.value === provider.serviceTypes[0]
  )?.label;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/providers"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Providers
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Provider Header */}
            <Card>
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar
                    src={provider.user.avatar}
                    alt={provider.businessName}
                    name={provider.businessName}
                    size="xl"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-2xl font-bold">{provider.businessName}</h1>
                          {provider.isKycVerified && (
                            <BadgeCheck className="w-6 h-6 text-green-500" />
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {provider.user.firstName} {provider.user.lastName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{provider.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({provider.reviewCount} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {provider.location.city}
                        {provider.location.district && `, ${provider.location.district}`}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4" />
                        {provider.completedJobs} jobs completed
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {provider.isKycVerified && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                      {provider.completedJobs > 50 && (
                        <Badge variant="secondary" className="gap-1">
                          <Award className="w-3 h-3" />
                          Top Rated
                        </Badge>
                      )}
                      {provider.completedJobs > 100 && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="w-3 h-3" />
                          Pro Provider
                        </Badge>
                      )}
                      {provider.serviceTypes.map((service) => (
                        <Badge key={service} variant="outline">
                          {SERVICE_PROVIDER_CATEGORIES.find((c) => c.value === service)?.label || service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Card>
              <div className="border-b">
                <div className="flex">
                  {[
                    { id: "about", label: "About" },
                    { id: "reviews", label: `Reviews (${provider.reviewCount})` },
                    { id: "portfolio", label: "Portfolio" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id as any)}
                      className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                        selectedTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {/* About Tab */}
                {selectedTab === "about" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">About</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {provider.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Services Offered</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {provider.serviceTypes.map((service) => {
                          const category = SERVICE_PROVIDER_CATEGORIES.find(
                            (c) => c.value === service
                          );
                          return (
                            <div
                              key={service}
                              className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg"
                            >
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                              <span className="font-medium">{category?.label || service}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Availability</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {provider.availability.days.join(", ")} • {provider.availability.startTime} - {provider.availability.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {selectedTab === "reviews" && (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No reviews yet
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-start gap-3 mb-2">
                            <Avatar
                              src={review.reviewer?.avatar}
                              alt={review.reviewer?.firstName || "User"}
                              name={review.reviewer?.firstName || "User"}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">
                                  {review.reviewer?.firstName} {review.reviewer?.lastName}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{review.rating}</span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-sm">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Portfolio Tab */}
                {selectedTab === "portfolio" && (
                  <div>
                    {provider.portfolio && provider.portfolio.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {provider.portfolio.map((image: any, index: number) => (
                          <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden bg-slate-100"
                          >
                            <img
                              src={typeof image === 'string' ? image : image.url}
                              alt={`Portfolio ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No portfolio images yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card>
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Pricing</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {provider.pricing.type === "hourly" &&
                      `UGX ${provider.pricing.hourlyRate?.toLocaleString()}/hr`}
                    {provider.pricing.type === "fixed" &&
                      `From UGX ${provider.pricing.minimumCharge?.toLocaleString()}`}
                    {provider.pricing.type === "custom" && "Custom Quote"}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full" size="lg">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Provider
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Service
                  </Button>
                </div>
              </div>
            </Card>

            {/* Contact Info */}
            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{provider.user.phone || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{provider.user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {provider.location.city}
                      {provider.location.district && `, ${provider.location.district}`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Card */}
            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Jobs Completed</span>
                    <span className="font-semibold">{provider.completedJobs}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Average Rating</span>
                    <span className="font-semibold">{provider.rating}/5.0</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response Time</span>
                    <span className="font-semibold">Within 2 hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Service Radius</span>
                    <span className="font-semibold">{provider.location.serviceRadius} km</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
