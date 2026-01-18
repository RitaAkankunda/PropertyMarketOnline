import api from "./api";

export interface AvailabilityBlock {
  id: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  createdAt: string;
}

export interface BookedRange {
  bookingId: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface AvailabilityResponse {
  blocked: AvailabilityBlock[];
  booked: BookedRange[];
}

class AvailabilityService {
  async getAvailability(propertyId: string, from: string, to: string): Promise<AvailabilityResponse> {
    const params = new URLSearchParams({ from, to });
    const response = await api.get<AvailabilityResponse>(
      `/properties/${propertyId}/availability?${params.toString()}`
    );
    return response.data;
  }

  async blockDates(propertyId: string, data: { startDate: string; endDate: string; reason?: string }) {
    const response = await api.post<AvailabilityBlock>(
      `/properties/${propertyId}/availability/blocks`,
      data
    );
    return response.data;
  }

  async unblockDates(propertyId: string, blockId: string) {
    const response = await api.delete<{ message: string }>(
      `/properties/${propertyId}/availability/blocks/${blockId}`
    );
    return response.data;
  }
}

export const availabilityService = new AvailabilityService();
