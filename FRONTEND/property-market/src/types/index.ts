// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "buyer" | "renter" | "lister" | "property_manager" | "admin" | "service_provider";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Property Types
export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  images: PropertyImage[];
  location: PropertyLocation;
  features: PropertyFeatures;
  amenities: string[];
  documents?: PropertyDocument[];
  owner: User;
  views: number;
  leads: number;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType =
  | "house"
  | "apartment"
  | "condo"
  | "villa"
  | "land"
  | "commercial"
  | "warehouse"
  | "office"
  | "airbnb";

export type ListingType = "sale" | "rent" | "lease";

export type PropertyStatus = "active" | "pending" | "sold" | "rented" | "inactive";

export interface PropertyImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface PropertyLocation {
  address: string;
  city: string;
  district?: string;
  province?: string;
  sector?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  parking?: number;
  area: number;
  areaUnit: "sqm" | "sqft" | "acres" | "hectares";
  size?: number;
  sizeUnit?: string;
  yearBuilt?: number;
  floors?: number;
  furnished?: boolean;
  amenities?: string[];
}

export interface PropertyDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  isVerified: boolean;
}

// Search & Filter Types
export interface PropertyFilters {
  search?: string;
  propertyType?: PropertyType[];
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minArea?: number;
  maxArea?: number;
  location?: string;
  amenities?: string[];
  isVerified?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular";
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Service Provider Types
export interface ServiceProvider {
  id: string;
  user: User;
  businessName: string;
  serviceTypes: ServiceType[];
  description: string;
  portfolio: PortfolioImage[];
  certifications: Certification[];
  pricing: ProviderPricing;
  availability: ProviderAvailability;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  isVerified: boolean;
  isKycVerified: boolean;
  location: ProviderLocation;
  createdAt: string;
}

export type ServiceType =
  | "electrician"
  | "plumber"
  | "carpenter"
  | "mason"
  | "cleaner"
  | "security"
  | "surveyor"
  | "valuer"
  | "mover"
  | "painter"
  | "appliance_repair"
  | "roofing"
  | "interior_designer"
  | "landscaper"
  | "lawyer";

export interface PortfolioImage {
  id: string;
  url: string;
  caption?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  documentUrl?: string;
  isVerified: boolean;
}

export interface ProviderPricing {
  type: "hourly" | "fixed" | "custom";
  hourlyRate?: number;
  minimumCharge?: number;
  currency: string;
}

export interface ProviderAvailability {
  days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface ProviderLocation {
  city: string;
  district?: string;
  serviceRadius: number; // in km
}

// Job Types
export interface Job {
  id: string;
  client: User;
  provider: ServiceProvider;
  serviceType: ServiceType;
  title: string;
  description: string;
  images?: string[];
  location: JobLocation;
  scheduledDate: string;
  scheduledTime: string;
  status: JobStatus;
  price: number;
  currency: string;
  depositPaid: boolean;
  completedAt?: string;
  rating?: number;
  review?: string;
  createdAt: string;
}

export type JobStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export interface JobLocation {
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  attachments?: MessageAttachment[];
  isRead: boolean;
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  url: string;
  type: "image" | "document";
  name: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  property?: Property;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  description: string;
  payer: User;
  payee?: User;
  propertyId?: string;
  jobId?: string;
  createdAt: string;
}

export type PaymentMethod = "mtn_momo" | "airtel_money" | "card" | "bank_transfer";

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

// Review Types
export interface Review {
  id: string;
  providerId: string;
  reviewerId: string;
  rating: number; // 1.0 to 5.0
  comment?: string;
  reviewer: User;
  provider?: ServiceProvider;
  isVerified: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | "new_message"
  | "job_request"
  | "job_accepted"
  | "job_completed"
  | "payment_received"
  | "verification_approved"
  | "new_lead"
  | "property_view";

// Analytics Types
export interface PropertyAnalytics {
  totalViews: number;
  totalLeads: number;
  viewsThisWeek: number;
  leadsThisWeek: number;
  viewsByDate: { date: string; count: number }[];
  leadsByDate: { date: string; count: number }[];
}

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalLeads: number;
  totalRevenue: number;
  pendingPayments: number;
}
