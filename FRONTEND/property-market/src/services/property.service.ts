import api from "./api";
import type {
  Property,
  PropertyFilters,
  PaginatedResponse,
  PropertyAnalytics,
} from "@/types";

export interface CreatePropertyData {
  title: string;
  description: string;
  price: number;
  currency?: string;
  propertyType: string;
  listingType: string;
  location: {
    address: string;
    city: string;
    district?: string;
    province?: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  features: {
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
    area: number;
    areaUnit: string;
    yearBuilt?: number;
    floors?: number;
  };
  amenities?: string[];
}

export const propertyService = {
  // Get all properties with filters
  async getProperties(
    filters?: PropertyFilters,
    page: number = 1,
    pageSize: number = 12
  ): Promise<PaginatedResponse<Property>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));

    const response = await api.get<PaginatedResponse<Property>>(
      `/listings?${params.toString()}`
    );
    return response.data;
  },

  // Get single property by ID
  async getProperty(id: string): Promise<Property> {
    const response = await api.get<Property>(`/listings/${id}`);
    return response.data;
  },

  // Create new property listing
  async createProperty(data: CreatePropertyData): Promise<Property> {
    const response = await api.post<Property>("/listings", data);
    return response.data;
  },

  // Update property listing
  async updateProperty(id: string, data: Partial<CreatePropertyData>): Promise<Property> {
    const response = await api.patch<Property>(`/listings/${id}`, data);
    return response.data;
  },

  // Delete property listing
  async deleteProperty(id: string): Promise<void> {
    await api.delete(`/listings/${id}`);
  },

  // Upload property images
  async uploadImages(propertyId: string, files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await api.post<{ urls: string[] }>(
      `/listings/${propertyId}/images`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.urls;
  },

  // Delete property image
  async deleteImage(propertyId: string, imageId: string): Promise<void> {
    await api.delete(`/listings/${propertyId}/images/${imageId}`);
  },

  // Upload property documents
  async uploadDocuments(propertyId: string, files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });

    await api.post(`/listings/${propertyId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Request property verification
  async requestVerification(propertyId: string): Promise<void> {
    await api.post(`/listings/${propertyId}/verify`);
  },

  // Get property analytics
  async getAnalytics(propertyId: string): Promise<PropertyAnalytics> {
    const response = await api.get<PropertyAnalytics>(
      `/listings/${propertyId}/analytics`
    );
    return response.data;
  },

  // Get user's listings
  async getMyListings(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Property>> {
    const response = await api.get<PaginatedResponse<Property>>(
      `/listings/my?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // Feature/Unfeature property (Admin)
  async toggleFeatured(propertyId: string, featured: boolean): Promise<void> {
    await api.patch(`/listings/${propertyId}/featured`, { featured });
  },

  // Get featured properties
  async getFeaturedProperties(limit: number = 6): Promise<Property[]> {
    const response = await api.get<Property[]>(`/listings/featured?limit=${limit}`);
    return response.data;
  },

  // Search properties by location (map view)
  async searchByLocation(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    filters?: PropertyFilters
  ): Promise<Property[]> {
    const response = await api.post<Property[]>("/listings/search/map", {
      bounds,
      ...filters,
    });
    return response.data;
  },

  // Record property view
  async recordView(propertyId: string): Promise<void> {
    await api.post(`/listings/${propertyId}/view`);
  },

  // Submit lead/inquiry
  async submitInquiry(
    propertyId: string,
    data: { name: string; email: string; phone?: string; message: string }
  ): Promise<void> {
    await api.post(`/listings/${propertyId}/inquiry`, data);
  },
};
