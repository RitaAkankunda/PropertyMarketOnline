import api from './api';

export interface PropertyReview {
  id: string;
  propertyId: string;
  reviewerId: string;
  bookingId?: string;
  rating: number;
  comment?: string;
  cleanlinessRating?: number;
  locationRating?: number;
  valueRating?: number;
  communicationRating?: number;
  ownerResponse?: string;
  respondedAt?: string;
  isVerified: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export interface ReviewStatistics {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categoryAverages: {
    cleanliness: number;
    location: number;
    value: number;
    communication: number;
  };
}

export interface CreatePropertyReviewData {
  propertyId: string;
  rating: number;
  comment?: string;
  cleanlinessRating?: number;
  locationRating?: number;
  valueRating?: number;
  communicationRating?: number;
  bookingId?: string;
}

export interface PaginatedReviewsResponse {
  data: PropertyReview[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  statistics?: ReviewStatistics;
}

export const propertyReviewsService = {
  // Get reviews for a property
  async getPropertyReviews(
    propertyId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedReviewsResponse> {
    const response = await api.get<PaginatedReviewsResponse>(
      `/property-reviews/property/${propertyId}`,
      {
        params: { page, pageSize },
      },
    );
    return response.data;
  },

  // Get all reviews (with filters)
  async getReviews(params?: {
    propertyId?: string;
    reviewerId?: string;
    page?: number;
    pageSize?: number;
    minRating?: number;
  }): Promise<PaginatedReviewsResponse> {
    const response = await api.get<PaginatedReviewsResponse>('/property-reviews', {
      params,
    });
    return response.data;
  },

  // Get single review
  async getReview(id: string): Promise<PropertyReview> {
    const response = await api.get<PropertyReview>(`/property-reviews/${id}`);
    return response.data;
  },

  // Create review
  async createReview(data: CreatePropertyReviewData): Promise<PropertyReview> {
    const response = await api.post<PropertyReview>('/property-reviews', data);
    return response.data;
  },

  // Update review
  async updateReview(
    id: string,
    data: Partial<CreatePropertyReviewData>,
  ): Promise<PropertyReview> {
    const response = await api.patch<PropertyReview>(`/property-reviews/${id}`, data);
    return response.data;
  },

  // Delete review
  async deleteReview(id: string): Promise<void> {
    await api.delete(`/property-reviews/${id}`);
  },

  // Add owner response
  async addOwnerResponse(reviewId: string, response: string): Promise<PropertyReview> {
    const result = await api.post<PropertyReview>(
      `/property-reviews/${reviewId}/owner-response`,
      { response },
    );
    return result.data;
  },
};
