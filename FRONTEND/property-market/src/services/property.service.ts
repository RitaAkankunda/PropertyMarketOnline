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
    area?: number;
    areaUnit: string;
    yearBuilt?: number;
    floors?: number;
  };
  amenities?: string[];
  images?: string[];
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
    params.append("limit", String(pageSize)); // Backend uses 'limit' not 'pageSize'

    const response = await api.get<{
      items: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/properties?${params.toString()}`);
    
    // Transform backend response to frontend expected format
    // Backend returns properties with latitude/longitude, but frontend expects location object
    const transformedItems: Property[] = response.data.items.map((item: any) => ({
      ...item,
      location: item.location || {
        city: 'Kampala', // Default city
        district: '',
        country: 'Uganda',
        address: '',
        latitude: item.latitude,
        longitude: item.longitude,
        coordinates: item.latitude && item.longitude ? {
          lat: item.latitude,
          lng: item.longitude,
        } : undefined,
      },
      features: item.features || {
        bedrooms: item.bedrooms,
        area: 0,
        areaUnit: 'sqft',
      },
      images: item.images ? (Array.isArray(item.images) && item.images.length > 0 ? item.images
        .filter((url: any) => {
          // Filter out empty, null, or invalid URLs
          if (!url) return false;
          const urlStr = typeof url === 'string' ? url.trim() : (url?.url || String(url));
          return urlStr.length > 0 && (urlStr.startsWith('http') || urlStr.startsWith('https') || urlStr.startsWith('blob:'));
        })
        .map((url: any, index: number) => {
          const imageUrl = typeof url === 'string' ? url.trim() : (url?.url || String(url));
          return {
            id: `img-${index}`,
            url: imageUrl,
            alt: item.title,
            isPrimary: index === 0, // First image is the cover/primary
          };
        }) : []) : [],
      currency: item.currency || 'UGX',
      listingType: item.listingType || 'sale', // Default to 'sale' if not provided
      status: item.status || 'active',
      views: item.views || 0,
      leads: item.leads || 0,
      isVerified: item.isVerified || false,
      isFeatured: item.isFeatured || false,
      amenities: item.amenities || [],
    }));
    
    return {
      data: transformedItems,
      meta: {
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.limit,
        totalPages: response.data.totalPages,
      },
    };
  },

  // Get single property by ID
  async getProperty(id: string): Promise<Property> {
    const response = await api.get<any>(`/properties/${id}`);
    const item = response.data;
    
    // Transform backend response to frontend expected format
    return {
      ...item,
      owner: item.owner || (item.ownerId ? { id: item.ownerId } : undefined),
      location: item.location || {
        city: 'Kampala',
        district: '',
        country: 'Uganda',
        address: '',
        latitude: item.latitude,
        longitude: item.longitude,
        coordinates: item.latitude && item.longitude ? {
          lat: item.latitude,
          lng: item.longitude,
        } : undefined,
      },
      features: item.features || {
        bedrooms: item.bedrooms,
        area: 0,
        areaUnit: 'sqft',
      },
      images: item.images ? (Array.isArray(item.images) && item.images.length > 0 ? item.images
        .filter((url: any) => {
          // Filter out empty, null, or invalid URLs
          if (!url) return false;
          const urlStr = typeof url === 'string' ? url.trim() : (url?.url || String(url));
          return urlStr.length > 0 && (urlStr.startsWith('http') || urlStr.startsWith('https') || urlStr.startsWith('blob:'));
        })
        .map((url: any, index: number) => {
          const imageUrl = typeof url === 'string' ? url.trim() : (url?.url || String(url));
          return {
            id: `img-${index}`,
            url: imageUrl,
            alt: item.title,
            isPrimary: index === 0, // First image is the cover/primary
          };
        }) : []) : [],
      currency: item.currency || 'UGX',
      listingType: item.listingType || 'sale', // Default to 'sale' if not provided
      status: item.status || 'active',
      views: item.views || 0,
      leads: item.leads || 0,
      isVerified: item.isVerified || false,
      isFeatured: item.isFeatured || false,
      amenities: item.amenities || [],
    };
  },

  // Create new property listing
  async createProperty(data: CreatePropertyData): Promise<Property> {
    // Transform data to match backend DTO structure
    const backendData = {
      title: data.title,
      description: data.description,
      price: data.price,
      propertyType: data.propertyType,
      listingType: data.listingType || 'sale', // Default to 'sale' if not provided
      bedrooms: data.features?.bedrooms,
      latitude: data.location?.latitude || 0.3476, // Default to Kampala coordinates
      longitude: data.location?.longitude || 32.5825,
      images: (data as any).images || [], // Include images if provided
    };
    
    console.log("Sending property data to backend:", backendData);
    
    const response = await api.post<Property>("/properties", backendData);
    
    console.log("Backend response:", response.data);
    
    return response.data;
  },

  // Update property listing
  async updateProperty(id: string, data: Partial<CreatePropertyData>): Promise<Property> {
    // Transform frontend data format to backend format
    // Only include fields that are in CreatePropertyDto to avoid validation errors
    const backendData: any = {};
    
    if (data.title !== undefined) backendData.title = data.title;
    if (data.description !== undefined) backendData.description = data.description;
    if (data.price !== undefined) backendData.price = data.price;
    if (data.propertyType !== undefined) backendData.propertyType = data.propertyType;
    if (data.listingType !== undefined) backendData.listingType = data.listingType;
    if (data.features?.bedrooms !== undefined) backendData.bedrooms = data.features.bedrooms;
    
    // Get latitude and longitude - required by backend
    // Check multiple possible locations and ensure they are numbers
    const locationAny = data.location as any;
    const latitude = data.location?.latitude || 
                     locationAny?.coordinates?.lat || 
                     (data as any).latitude || 
                     0.3476; // Default to Kampala
    const longitude = data.location?.longitude || 
                      locationAny?.coordinates?.lng || 
                      (data as any).longitude || 
                      32.5825; // Default to Kampala
    
    // Ensure they are valid numbers
    const latNum = typeof latitude === 'number' ? latitude : parseFloat(String(latitude)) || 0.3476;
    const lngNum = typeof longitude === 'number' ? longitude : parseFloat(String(longitude)) || 32.5825;
    
    backendData.latitude = latNum;
    backendData.longitude = lngNum;
    
    // Only include images if provided (must be valid URLs)
    if ((data as any).images !== undefined) {
      backendData.images = (data as any).images.filter((url: string) => 
        typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
      );
    }

    console.log("Updating property with data:", backendData);
    
    try {
      const response = await api.patch<any>(`/properties/${id}`, backendData);
      const item = response.data;
    
    // Transform backend response to frontend expected format
    return {
      ...item,
      location: item.location || {
        city: 'Kampala',
        district: '',
        country: 'Uganda',
        address: '',
        latitude: item.latitude,
        longitude: item.longitude,
        coordinates: item.latitude && item.longitude ? {
          lat: item.latitude,
          lng: item.longitude,
        } : undefined,
      },
      features: item.features || {
        bedrooms: item.bedrooms,
        area: 0,
        areaUnit: 'sqft',
      },
      images: item.images ? (Array.isArray(item.images) && item.images.length > 0 ? item.images
        .filter((url: any) => {
          // Filter out empty, null, or invalid URLs
          if (!url) return false;
          const urlStr = typeof url === 'string' ? url.trim() : (url?.url || String(url));
          return urlStr.length > 0 && (urlStr.startsWith('http') || urlStr.startsWith('https') || urlStr.startsWith('blob:'));
        })
        .map((url: any, index: number) => {
          const imageUrl = typeof url === 'string' ? url.trim() : (url?.url || String(url));
          return {
            id: `img-${index}`,
            url: imageUrl,
            alt: item.title,
            isPrimary: index === 0, // First image is the cover/primary
          };
        }) : []) : [],
      currency: item.currency || 'UGX',
      listingType: item.listingType || 'sale', // Default to 'sale' if not provided
      status: item.status || 'active',
      views: item.views || 0,
      leads: item.leads || 0,
      isVerified: item.isVerified || false,
      isFeatured: item.isFeatured || false,
      amenities: item.amenities || [],
    };
    } catch (error: any) {
      console.error("Property update error:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      
      // Re-throw with more details
      if (error.response?.data) {
        const errorMessage = error.response.data.message || 
                            (Array.isArray(error.response.data.message) 
                              ? error.response.data.message.join(', ')
                              : JSON.stringify(error.response.data));
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  // Upload property images
  async uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post<{ urls: string[] }>(
      "/properties/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.urls;
  },

  // Delete property listing
  async deleteProperty(id: string): Promise<void> {
    await api.delete(`/properties/${id}`);
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
    const response = await api.get<any[]>(
      `/properties/my/properties`
    );
    // Backend returns array directly, ensure it's always an array
    const rawProperties = Array.isArray(response.data) ? response.data : [];
    
    // Transform backend response to frontend expected format
    const properties: Property[] = rawProperties.map((item: any) => ({
      ...item,
      location: item.location || {
        city: 'Kampala',
        district: '',
        country: 'Uganda',
        address: '',
        latitude: item.latitude,
        longitude: item.longitude,
        coordinates: item.latitude && item.longitude ? {
          lat: item.latitude,
          lng: item.longitude,
        } : undefined,
      },
      features: item.features || {
        bedrooms: item.bedrooms,
        area: 0,
        areaUnit: 'sqft',
      },
      images: item.images ? (Array.isArray(item.images) && item.images.length > 0 ? item.images
        .filter((url: any) => {
          // Filter out empty, null, or invalid URLs
          if (!url) return false;
          const urlStr = typeof url === 'string' ? url.trim() : (url?.url || String(url));
          return urlStr.length > 0 && (urlStr.startsWith('http') || urlStr.startsWith('https') || urlStr.startsWith('blob:'));
        })
        .map((url: any, index: number) => {
          const imageUrl = typeof url === 'string' ? url.trim() : (url?.url || String(url));
          return {
            id: `img-${index}`,
            url: imageUrl,
            alt: item.title,
            isPrimary: index === 0, // First image is the cover/primary
          };
        }) : []) : [],
      currency: item.currency || 'UGX',
      listingType: item.listingType || 'sale', // Default to 'sale' if not provided
      status: item.status || 'active',
      views: item.views || 0,
      leads: item.leads || 0,
      isVerified: item.isVerified || false,
      isFeatured: item.isFeatured || false,
      amenities: item.amenities || [],
    }));
    
    // Transform to paginated response format
    return {
      data: properties,
      meta: {
        total: properties.length,
        page: 1,
        pageSize: properties.length,
        totalPages: 1,
      },
    };
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
