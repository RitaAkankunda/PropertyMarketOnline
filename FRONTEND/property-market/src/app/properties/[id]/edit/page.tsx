"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, X, Upload, Save, Loader2, Check } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { propertyService } from "@/services/property.service";
import { useAuth } from "@/hooks";
import { useToastContext } from "@/components/ui/toast-provider";
import type { Property } from "@/types";

const amenitiesList = [
  "Swimming Pool", "Garden", "Security", "Backup Generator", "Water Tank",
  "Air Conditioning", "Internet Ready", "Balcony", "Garage", "Parking",
  "Gym", "Elevator", "Laundry Room", "Storage", "Servant Quarters",
  "CCTV", "Solar Power", "Borehole",
];

const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be positive"),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface ImageFile {
  id: string;
  url: string;
  file?: File;
  isNew?: boolean;
}

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { success, error: showError } = useToastContext();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    async function fetchProperty() {
      try {
        setIsLoading(true);
        const data = await propertyService.getProperty(id);
        
        // Check if user owns this property
        if (data.owner?.id !== user?.id) {
        showError("You can only edit your own properties.");
          router.push(`/properties/${id}`);
          return;
        }

        setProperty(data);
        reset({
          title: data.title,
          description: data.description,
          price: data.price,
        });

        // Set amenities
        setSelectedAmenities(data.amenities || []);

        // Convert property images to ImageFile format
        const imageFiles: ImageFile[] = (data.images || []).map((img, index) => ({
          id: typeof img === 'string' ? `existing-${index}` : img.id || `existing-${index}`,
          url: typeof img === 'string' ? img : img.url,
          isNew: false,
        }));
        setImages(imageFiles);
      } catch (error: any) {
        console.error("Failed to fetch property:", error);
        showError(error.message || "Failed to load property.");
        router.push(`/properties/${id}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProperty();
  }, [id, isAuthenticated, user, router, reset, showError]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: ImageFile[] = files.map((file) => ({
      id: `new-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
      isNew: true,
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (imageId: string) => {
    setImages(images.filter((img) => img.id !== imageId));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const onSubmit = async (data: PropertyFormData) => {
    if (!property) return;

    setIsSaving(true);
    try {
      // Separate existing and new images
      const existingImages = images.filter(img => !img.isNew || img.url.startsWith('http'));
      const newImagesToUpload = images.filter(img => img.isNew && img.file && !img.url.startsWith('http'));

      // Upload new images first
      let uploadedImageUrls: string[] = [];
      if (newImagesToUpload.length > 0) {
        try {
          const filesToUpload = newImagesToUpload.map(img => img.file!).filter(Boolean);
          uploadedImageUrls = await propertyService.uploadImages(filesToUpload);
          success(`Successfully uploaded ${uploadedImageUrls.length} image(s).`);
        } catch (uploadError: any) {
          console.error("Failed to upload images:", uploadError);
          const uploadErrorMessage = uploadError.response?.data?.message || 
                                    uploadError.message || 
                                    "Failed to upload images. Please try again.";
          showError(uploadErrorMessage);
          setIsSaving(false);
          return;
        }
      }

      // Combine existing image URLs with newly uploaded URLs
      const existingImageUrls = existingImages
        .filter(img => img.url.startsWith('http://') || img.url.startsWith('https://'))
        .map(img => img.url);
      const imageUrls = [...existingImageUrls, ...uploadedImageUrls];

      // Get latitude and longitude - check multiple possible locations in the property object
      // Backend stores them as direct properties, frontend may have them in location object
      const latitude = (property as any).latitude || 
                       property.location?.latitude || 
                       property.location?.coordinates?.lat || 
                       0.3476; // Default to Kampala
      const longitude = (property as any).longitude || 
                        property.location?.longitude || 
                        property.location?.coordinates?.lng || 
                        32.5825; // Default to Kampala

      // Ensure they are numbers
      const latNum = typeof latitude === 'number' ? latitude : parseFloat(String(latitude)) || 0.3476;
      const lngNum = typeof longitude === 'number' ? longitude : parseFloat(String(longitude)) || 32.5825;

      // Update property
      const updatedProperty = await propertyService.updateProperty(id, {
        title: data.title,
        description: data.description,
        price: data.price,
        propertyType: property.propertyType,
        images: imageUrls,
        location: {
          ...property.location,
          latitude: latNum,
          longitude: lngNum,
        },
        features: property.features,
        amenities: selectedAmenities,
      });

      success("Property updated successfully!");

      router.push(`/properties/${id}`);
    } catch (error: any) {
      console.error("Failed to update property:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          error.message || 
                          "Failed to update property. Please try again.";
      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Button onClick={() => router.push("/properties")}>Back to Properties</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/properties/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Property
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Edit Property</h1>
          <p className="text-muted-foreground mt-2">
            Update your property details and images
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Title"
                placeholder="Enter property title"
                error={errors.title?.message}
                {...register("title")}
              />

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  {...register("description")}
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter property description"
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              <Input
                type="number"
                label="Price (UGX)"
                placeholder="0"
                error={errors.price?.message}
                {...register("price", { valueAsNumber: true })}
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Images
                  </Button>
                </label>

                {/* Image Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden border-2 border-slate-200">
                          <img
                            src={image.url}
                            alt={`Property image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <Badge className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs">
                            Cover Photo
                          </Badge>
                        )}
                        {image.isNew && (
                          <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {images.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No images added. Click "Add Images" to upload property photos.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesList.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition",
                      selectedAmenities.includes(amenity)
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-slate-200 hover:border-blue-500"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center",
                        selectedAmenities.includes(amenity)
                          ? "bg-blue-600 border-blue-600"
                          : "border-slate-300"
                      )}
                    >
                      {selectedAmenities.includes(amenity) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span>{amenity}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/properties/${id}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

