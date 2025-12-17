"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Calendar,
  BadgeCheck,
  Phone,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check,
  Home,
  Building2,
  Eye,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button, Badge, Card, Avatar, Input, Textarea } from "@/components/ui";
import { PropertyMap } from "@/components/maps";
import { propertyService } from "@/services";
import { cn, formatCurrency } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertyWithAgent extends Property {
  agent?: {
    name: string;
    avatar?: string;
    phone: string;
    email: string;
  };
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [property, setProperty] = useState<PropertyWithAgent | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await propertyService.getProperty(params.id);
        setProperty(response);
        
        // Fetch similar properties
        if (response) {
          const similarResponse = await propertyService.getProperties({
            propertyType: [response.propertyType as any],
            limit: 3,
          });
          setSimilarProperties(
            (similarResponse.data || []).filter((p: Property) => p.id !== params.id).slice(0, 3)
          );
        }
      } catch (err) {
        console.error("Failed to fetch property:", err);
        setError("Failed to load property details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [params.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading property details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Property Not Found</h2>
          <p className="text-slate-500 mb-6">{error || "The property you're looking for doesn't exist."}</p>
          <Link href="/properties">
            <Button>Browse Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images || [];

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/properties"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listings
          </Link>
        </div>
      </div>

      {/* Image Gallery */}
      <section className="bg-slate-900">
        <div className="container mx-auto px-4 py-6">
          <div className="relative">
            {/* Main Image */}
            <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden">
              <img
                src={images[currentImageIndex]?.url}
                alt={property.title}
                className="w-full h-full object-cover"
              />

              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={cn(
                    "p-3 rounded-full shadow-lg transition",
                    isFavorite ? "bg-red-500 text-white" : "bg-white/90 hover:bg-white text-slate-700"
                  )}
                >
                  <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                </button>
                <button className="p-3 rounded-full bg-white/90 hover:bg-white shadow-lg transition">
                  <Share2 className="w-5 h-5 text-slate-700" />
                </button>
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {property.isVerified && (
                  <Badge className="bg-green-500 text-white">
                    <BadgeCheck className="w-4 h-4 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge className="bg-blue-600 text-white capitalize">
                  For {property.listingType}
                </Badge>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition",
                    currentImageIndex === index
                      ? "border-blue-500"
                      : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <img
                    src={image.url}
                    alt={`View ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Property Details */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Price */}
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <MapPin className="w-4 h-4" />
                  {property.location.sector}, {property.location.district}, {property.location.city}
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">{property.title}</h1>
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(property.price, property.currency)}
                    {property.listingType === "rent" && (
                      <span className="text-lg font-normal text-slate-500">/month</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Eye className="w-4 h-4" />
                    {property.views} views
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    Listed {new Date(property.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Key Features */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Features</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Bed className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{property.features.bedrooms}</p>
                      <p className="text-sm text-slate-500">Bedrooms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                      <Bath className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{property.features.bathrooms}</p>
                      <p className="text-sm text-slate-500">Bathrooms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Square className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{property.features.size}</p>
                      <p className="text-sm text-slate-500">{property.features.sizeUnit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{property.features.parking || 0}</p>
                      <p className="text-sm text-slate-500">Parking</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Description */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
                <div className="prose prose-slate max-w-none">
                  {property.description.split("\n").map((paragraph, index) => (
                    <p key={index} className="text-slate-600 mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Card>

              {/* Amenities */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.features.amenities?.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-slate-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Property Details */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Property Type</span>
                    <span className="font-medium text-slate-900 capitalize">{property.propertyType}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Listing Type</span>
                    <span className="font-medium text-slate-900 capitalize">For {property.listingType}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Year Built</span>
                    <span className="font-medium text-slate-900">{property.features.yearBuilt || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Furnished</span>
                    <span className="font-medium text-slate-900">{property.features.furnished ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">District</span>
                    <span className="font-medium text-slate-900">{property.location.district}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-slate-500">Sector</span>
                    <span className="font-medium text-slate-900">{property.location.sector}</span>
                  </div>
                </div>
              </Card>

              {/* Map */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Location</h2>
                <PropertyMap
                  coordinates={property.location.coordinates}
                  address={`${property.location.address}, ${property.location.sector}, ${property.location.district}, ${property.location.city}`}
                  title={property.title}
                  price={formatCurrency(property.price, property.currency)}
                  image={property.images?.[0]?.url}
                  className="h-[400px] w-full rounded-lg overflow-hidden"
                />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="p-6 sticky top-24">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                    {property.owner.firstName[0]}{property.owner.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {property.owner.firstName} {property.owner.lastName}
                      </h3>
                      {property.owner.isVerified && (
                        <BadgeCheck className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500">Property Owner</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <a
                    href={`tel:${property.agent?.phone}`}
                    className="flex items-center justify-center w-full h-12 px-8 rounded-lg text-base font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </a>
                  <Button className="w-full" variant="outline" size="lg">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>

                {/* Contact Form */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Request More Info</h4>
                  <form className="space-y-4">
                    <Input placeholder="Your Name" />
                    <Input type="email" placeholder="Email Address" />
                    <Input type="tel" placeholder="Phone Number" />
                    <Textarea
                      placeholder="I'm interested in this property..."
                      rows={4}
                      defaultValue={`Hi, I'm interested in the property "${property.title}". Please contact me with more details.`}
                    />
                    <Button className="w-full" type="submit">
                      Send Inquiry
                    </Button>
                  </form>
                </div>
              </Card>

              {/* Report Property */}
              <div className="text-center">
                <button className="text-sm text-slate-500 hover:text-red-500 transition">
                  Report this listing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <section className="py-12 bg-white border-t">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Similar Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((prop) => (
                <Link
                  key={prop.id}
                  href={`/properties/${prop.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={prop.images?.[0]?.url || "/placeholder-property.jpg"}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition">
                        {prop.title}
                      </h3>
                      <p className="text-sm text-slate-500 mb-2">
                        {prop.location.district}, {prop.location.city}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-blue-600">
                          {formatCurrency(prop.price, prop.currency)}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          {prop.features.bedrooms && (
                            <span className="flex items-center gap-1">
                              <Bed className="w-4 h-4" />
                              {prop.features.bedrooms}
                            </span>
                          )}
                          {prop.features.area && (
                            <span className="flex items-center gap-1">
                              <Square className="w-4 h-4" />
                              {prop.features.area} {prop.features.areaUnit || "sqm"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
