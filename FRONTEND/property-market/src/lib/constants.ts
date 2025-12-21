// API Configuration
// Set NEXT_PUBLIC_API_URL in your .env.local to connect to your backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// App Configuration
export const APP_NAME = "PropertyMarket Online";
export const APP_DESCRIPTION = "Your trusted real estate marketplace for buying, renting, leasing, and selling property";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

// Image Upload
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGES_PER_LISTING = 20;

// Property Types
export const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "warehouse", label: "Warehouse" },
  { value: "office", label: "Office Space" },
] as const;

// Listing Types
export const LISTING_TYPES = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "lease", label: "For Lease" },
] as const;

// User Roles
export const USER_ROLES = {
  BUYER: "buyer",
  RENTER: "renter",
  LISTER: "lister",
  PROPERTY_MANAGER: "property_manager",
  ADMIN: "admin",
} as const;

// Service Provider Categories
export const SERVICE_PROVIDER_CATEGORIES = [
  { value: "electrician", label: "Electrician", icon: "Zap" },
  { value: "plumber", label: "Plumber", icon: "Droplet" },
  { value: "carpenter", label: "Carpenter", icon: "Hammer" },
  { value: "mason", label: "Mason", icon: "Brick" },
  { value: "cleaner", label: "House Cleaner", icon: "Sparkles" },
  { value: "security", label: "Security Services", icon: "Shield" },
  { value: "surveyor", label: "Land Surveyor", icon: "MapPin" },
  { value: "valuer", label: "Property Valuer", icon: "Calculator" },
  { value: "mover", label: "Movers / Transport", icon: "Truck" },
  { value: "painter", label: "Painter", icon: "Paintbrush" },
  { value: "appliance_repair", label: "Appliance Repair", icon: "Wrench" },
  { value: "roofing", label: "Roofing Expert", icon: "Home" },
  { value: "interior_designer", label: "Interior Designer", icon: "Palette" },
  { value: "landscaper", label: "Landscaper", icon: "Trees" },
  { value: "lawyer", label: "Lawyer / Conveyancing", icon: "Scale" },
] as const;

// Payment Methods
export const PAYMENT_METHODS = [
  { value: "mtn_momo", label: "MTN Mobile Money", icon: "Smartphone" },
  { value: "airtel_money", label: "Airtel Money", icon: "Smartphone" },
  { value: "card", label: "Credit/Debit Card", icon: "CreditCard" },
  { value: "bank_transfer", label: "Bank Transfer", icon: "Building" },
] as const;

// Verification Status
export const VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

// Job Status
export const JOB_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
} as const;

// Regions/Locations (Uganda)
export const LOCATIONS = [
  { value: "kampala", label: "Kampala" },
  { value: "wakiso", label: "Wakiso" },
  { value: "mukono", label: "Mukono" },
  { value: "jinja", label: "Jinja" },
  { value: "entebbe", label: "Entebbe" },
  { value: "mbarara", label: "Mbarara" },
  { value: "gulu", label: "Gulu" },
  { value: "lira", label: "Lira" },
  { value: "mbale", label: "Mbale" },
  { value: "fortportal", label: "Fort Portal" },
  { value: "masaka", label: "Masaka" },
  { value: "arua", label: "Arua" },
] as const;

// Districts in Kampala
export const KAMPALA_DIVISIONS = [
  { value: "central", label: "Central Division" },
  { value: "kawempe", label: "Kawempe Division" },
  { value: "makindye", label: "Makindye Division" },
  { value: "nakawa", label: "Nakawa Division" },
  { value: "rubaga", label: "Rubaga Division" },
] as const;

// Popular Areas/Neighborhoods in Kampala
export const KAMPALA_AREAS = [
  "Kololo", "Nakasero", "Bugolobi", "Muyenga", "Naguru", "Ntinda", 
  "Bukoto", "Kamwokya", "Wandegeya", "Makerere", "Kisaasi", "Kyanja",
  "Namugongo", "Naalya", "Kira", "Bweyogerere", "Najjera", "Kungu",
  "Buziga", "Munyonyo", "Lubowa", "Kajjansi", "Bwebajja", "Seguku"
] as const;

// Currency
export const DEFAULT_CURRENCY = "UGX";
export const SUPPORTED_CURRENCIES = ["UGX", "USD", "EUR"] as const;

// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
export const DEFAULT_MAP_CENTER = { lat: 0.3476, lng: 32.5825 }; // Kampala, Uganda
export const DEFAULT_MAP_ZOOM = 12;

// Country Configuration
export const COUNTRY = {
  name: "Uganda",
  code: "UG",
  phoneCode: "+256",
  currency: "UGX",
  currencySymbol: "USh",
};
