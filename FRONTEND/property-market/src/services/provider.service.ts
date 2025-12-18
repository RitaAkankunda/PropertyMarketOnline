import api from "./api";
import type {
  ServiceProvider,
  Job,
  ServiceType,
  PaginatedResponse,
  Review,
} from "@/types";

export interface RegisterProviderData {
  businessName: string;
  serviceTypes: ServiceType[];
  description: string;
  pricing: {
    type: "hourly" | "fixed" | "custom";
    hourlyRate?: number;
    minimumCharge?: number;
    currency?: string;
  };
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  location: {
    city: string;
    district?: string;
    serviceRadius: number;
  };
}

export interface CreateJobData {
  providerId?: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  location: {
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  scheduledDate: string;
  scheduledTime: string;
  images?: File[];
}

export interface ProviderFilters {
  serviceType?: ServiceType;
  location?: string;
  search?: string;
  minRating?: number;
  isVerified?: boolean;
  sortBy?: "rating" | "price" | "reviews" | "distance";
}

export const providerService = {
  // Register as a service provider
  async register(data: RegisterProviderData): Promise<ServiceProvider> {
    const response = await api.post<ServiceProvider>("/providers/register", data);
    return response.data;
  },

  // Get all providers with filters
  async getProviders(
    filters?: ProviderFilters,
    page: number = 1,
    pageSize: number = 12
  ): Promise<PaginatedResponse<ServiceProvider>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));

    const response = await api.get<PaginatedResponse<ServiceProvider>>(
      `/providers?${params.toString()}`
    );
    return response.data;
  },

  // Get single provider by ID
  async getProvider(id: string): Promise<ServiceProvider> {
    const response = await api.get<ServiceProvider>(`/providers/${id}`);
    return response.data;
  },

  // Update provider profile
  async updateProfile(data: Partial<RegisterProviderData>): Promise<ServiceProvider> {
    const response = await api.patch<ServiceProvider>("/providers/profile", data);
    return response.data;
  },

  // Upload portfolio images
  async uploadPortfolio(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("portfolio", file);
    });

    const response = await api.post<{ urls: string[] }>(
      "/providers/portfolio",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.urls;
  },

  // Upload certifications
  async uploadCertification(
    name: string,
    issuer: string,
    file: File
  ): Promise<void> {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("issuer", issuer);
    formData.append("document", file);

    await api.post("/providers/certifications", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Request KYC verification
  async requestKycVerification(idDocument: File): Promise<void> {
    const formData = new FormData();
    formData.append("idDocument", idDocument);
    await api.post("/providers/verify", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Update availability
  async updateAvailability(availability: {
    days: string[];
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }): Promise<void> {
    await api.patch("/providers/availability", availability);
  },

  // Get provider reviews
  async getReviews(
    providerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Review>> {
    const response = await api.get<PaginatedResponse<Review>>(
      `/providers/${providerId}/reviews?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // Get provider earnings
  async getEarnings(period?: "week" | "month" | "year"): Promise<{
    total: number;
    pending: number;
    available: number;
    history: { date: string; amount: number; type: string }[];
  }> {
    const response = await api.get(`/providers/earnings?period=${period || "month"}`);
    return response.data;
  },

  // Withdraw earnings
  async withdrawEarnings(
    amount: number,
    method: "mtn_momo" | "airtel_money",
    phoneNumber: string
  ): Promise<void> {
    await api.post("/providers/withdraw", { amount, method, phoneNumber });
  },

  // === Job Management ===

  // Create a new job request
  async createJob(data: CreateJobData): Promise<Job> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === "images" && value) {
        (value as File[]).forEach((file) => formData.append("images", file));
      } else if (key === "location") {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await api.post<Job>("/jobs/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Get job by ID
  async getJob(id: string): Promise<Job> {
    const response = await api.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  // Get user's jobs (as client)
  async getMyJobs(
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Job>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));

    const response = await api.get<PaginatedResponse<Job>>(
      `/jobs/my?${params.toString()}`
    );
    return response.data;
  },

  // Get provider's jobs
  async getProviderJobs(
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Job>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));

    const response = await api.get<PaginatedResponse<Job>>(
      `/jobs/provider?${params.toString()}`
    );
    return response.data;
  },

  // Accept job (provider)
  async acceptJob(jobId: string): Promise<void> {
    await api.patch(`/jobs/${jobId}/status`, { status: "accepted" });
  },

  // Reject job (provider)
  async rejectJob(jobId: string, reason?: string): Promise<void> {
    await api.patch(`/jobs/${jobId}/status`, { status: "cancelled", reason });
  },

  // Update job status
  async updateJobStatus(
    jobId: string,
    status: "in_progress" | "completed"
  ): Promise<void> {
    await api.patch(`/jobs/${jobId}/status`, { status });
  },

  // Rate and review completed job
  async rateJob(jobId: string, rating: number, review: string): Promise<void> {
    await api.post(`/jobs/${jobId}/review`, { rating, review });
  },

  // Cancel job
  async cancelJob(jobId: string, reason: string): Promise<void> {
    await api.patch(`/jobs/${jobId}/status`, { status: "cancelled", reason });
  },

  // Report dispute
  async reportDispute(jobId: string, reason: string): Promise<void> {
    await api.post(`/jobs/${jobId}/dispute`, { reason });
  },

  // Get nearby providers
  async getNearbyProviders(
    serviceType: ServiceType,
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<ServiceProvider[]> {
    const response = await api.get<ServiceProvider[]>(
      `/providers/nearby?serviceType=${serviceType}&lat=${latitude}&lng=${longitude}&radius=${radius}`
    );
    return response.data;
  },
};
