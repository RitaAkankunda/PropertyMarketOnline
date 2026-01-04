import api from "./api";
import type { PaginatedResponse } from "@/types";

export type TicketCategory = "electrical" | "plumbing" | "hvac" | "security" | "structural" | "appliance" | "internet" | "other";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "pending" | "assigned" | "in_progress" | "completed" | "rejected";

export interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  property: string;
  unit: string;
  location: string;
  tenantId?: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  tenantPhone?: string;
  images?: string[];
  assignedProviderId?: string;
  assignedProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    businessName?: string;
  };
  escrowAmount?: number;
  ownerId?: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceTicketData {
  title: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  property: string;
  unit: string;
  location: string;
  tenantPhone?: string;
  images?: string[];
}

export interface UpdateMaintenanceTicketData {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  property?: string;
  unit?: string;
  location?: string;
  images?: string[];
  assignedProviderId?: string;
  escrowAmount?: number;
}

export interface MaintenanceTicketFilters {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  property?: string;
}

export const maintenanceTicketsService = {
  // Create a new maintenance ticket
  async create(data: CreateMaintenanceTicketData): Promise<MaintenanceTicket> {
    const response = await api.post<MaintenanceTicket>("/maintenance-tickets", data);
    return response.data;
  },

  // Get all maintenance tickets with filters
  async getTickets(
    filters?: MaintenanceTicketFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<MaintenanceTicket>> {
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

    const response = await api.get<PaginatedResponse<MaintenanceTicket>>(
      `/maintenance-tickets?${params.toString()}`
    );
    return response.data;
  },

  // Get a single ticket by ID
  async getTicket(id: string): Promise<MaintenanceTicket> {
    const response = await api.get<MaintenanceTicket>(`/maintenance-tickets/${id}`);
    return response.data;
  },

  // Update a ticket
  async updateTicket(
    id: string,
    data: UpdateMaintenanceTicketData
  ): Promise<MaintenanceTicket> {
    const response = await api.patch<MaintenanceTicket>(
      `/maintenance-tickets/${id}`,
      data
    );
    return response.data;
  },

  // Assign a provider to a ticket
  async assignProvider(
    id: string,
    providerId: string
  ): Promise<MaintenanceTicket> {
    const response = await api.patch<MaintenanceTicket>(
      `/maintenance-tickets/${id}/assign`,
      { providerId }
    );
    return response.data;
  },

  // Update ticket status
  async updateStatus(
    id: string,
    status: TicketStatus
  ): Promise<MaintenanceTicket> {
    const response = await api.patch<MaintenanceTicket>(
      `/maintenance-tickets/${id}/status`,
      { status }
    );
    return response.data;
  },

  // Delete a ticket
  async deleteTicket(id: string): Promise<void> {
    await api.delete(`/maintenance-tickets/${id}`);
  },
};

