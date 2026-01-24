// API Configuration
// Set NEXT_PUBLIC_API_URL in your .env.local to connect to your backend
// Backend runs on port 3000 with /api prefix
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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
  { value: "villa", label: "Villa" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "warehouse", label: "Warehouse" },
  { value: "office", label: "Office Space" },
  { value: "airbnb", label: "Airbnb" },
  { value: "hotel", label: "Hotel" },
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
  { value: "mover", label: "Movers / Relocation", icon: "Truck" },
  { value: "cleaner", label: "House Cleaner", icon: "Sparkles" },
  { value: "security", label: "Security Services", icon: "Shield" },
  { value: "surveyor", label: "Land Surveyor", icon: "MapPin" },
  { value: "valuer", label: "Property Valuer", icon: "Calculator" },
  { value: "mason", label: "Mason", icon: "Brick" },
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
export const UGANDA_REGIONS = [
  { value: "central", label: "Central" },
  { value: "eastern", label: "Eastern" },
  { value: "northern", label: "Northern" },
  { value: "western", label: "Western" },
] as const;

// Uganda Cities (11 major cities)
export const UGANDA_CITIES = [
  { value: "kampala", label: "Kampala Capital City" },
  { value: "mbarara", label: "Mbarara" },
  { value: "gulu", label: "Gulu" },
  { value: "masaka", label: "Masaka" },
  { value: "lira", label: "Lira" },
  { value: "fortportal", label: "Fort Portal" },
  { value: "mbale", label: "Mbale" },
  { value: "soroti", label: "Soroti" },
  { value: "arua", label: "Arua" },
  { value: "hoima", label: "Hoima" },
  { value: "jinja", label: "Jinja" },
] as const;

// Uganda Districts (137 districts in alphabetical order)
export const UGANDA_DISTRICTS = [
  { value: "abim", label: "Abim" },
  { value: "adjumani", label: "Adjumani" },
  { value: "agago", label: "Agago" },
  { value: "alebtong", label: "Alebtong" },
  { value: "amolatar", label: "Amolatar" },
  { value: "amudat", label: "Amudat" },
  { value: "amuria", label: "Amuria" },
  { value: "amuru", label: "Amuru" },
  { value: "apac", label: "Apac" },
  { value: "arua", label: "Arua" },
  { value: "budaka", label: "Budaka" },
  { value: "bududa", label: "Bududa" },
  { value: "bugiri", label: "Bugiri" },
  { value: "bugweri", label: "Bugweri" },
  { value: "buhweju", label: "Buhweju" },
  { value: "buikwe", label: "Buikwe" },
  { value: "bukedea", label: "Bukedea" },
  { value: "bukomansimbi", label: "Bukomansimbi" },
  { value: "bukwo", label: "Bukwo" },
  { value: "bulambuli", label: "Bulambuli" },
  { value: "buliisa", label: "Buliisa" },
  { value: "bundibugyo", label: "Bundibugyo" },
  { value: "bunyangabu", label: "Bunyangabu" },
  { value: "bushenyi", label: "Bushenyi" },
  { value: "busia", label: "Busia" },
  { value: "butaleja", label: "Butaleja" },
  { value: "butambala", label: "Butambala" },
  { value: "butebo", label: "Butebo" },
  { value: "buvuma", label: "Buvuma" },
  { value: "buyende", label: "Buyende" },
  { value: "dokolo", label: "Dokolo" },
  { value: "gomba", label: "Gomba" },
  { value: "gulu", label: "Gulu" },
  { value: "hoima", label: "Hoima" },
  { value: "ibanda", label: "Ibanda" },
  { value: "iganga", label: "Iganga" },
  { value: "isingiro", label: "Isingiro" },
  { value: "jinja", label: "Jinja" },
  { value: "kaabong", label: "Kaabong" },
  { value: "kabale", label: "Kabale" },
  { value: "kabarole", label: "Kabarole" },
  { value: "kaberamaido", label: "Kaberamaido" },
  { value: "kagadi", label: "Kagadi" },
  { value: "kakumiro", label: "Kakumiro" },
  { value: "kalaki", label: "Kalaki" },
  { value: "kalangala", label: "Kalangala" },
  { value: "kaliro", label: "Kaliro" },
  { value: "kalungu", label: "Kalungu" },
  { value: "kampala", label: "Kampala" },
  { value: "kamuli", label: "Kamuli" },
  { value: "kamwenge", label: "Kamwenge" },
  { value: "kanungu", label: "Kanungu" },
  { value: "kapchorwa", label: "Kapchorwa" },
  { value: "kapelebyong", label: "Kapelebyong" },
  { value: "karenga", label: "Karenga" },
  { value: "kasese", label: "Kasese" },
  { value: "kasanda", label: "Kasanda" },
  { value: "katakwi", label: "Katakwi" },
  { value: "kayunga", label: "Kayunga" },
  { value: "kazo", label: "Kazo" },
  { value: "kibaale", label: "Kibaale" },
  { value: "kiboga", label: "Kiboga" },
  { value: "kibuku", label: "Kibuku" },
  { value: "kikuube", label: "Kikuube" },
  { value: "kiruhura", label: "Kiruhura" },
  { value: "kiryandongo", label: "Kiryandongo" },
  { value: "kisoro", label: "Kisoro" },
  { value: "kitagwenda", label: "Kitagwenda" },
  { value: "kitgum", label: "Kitgum" },
  { value: "koboko", label: "Koboko" },
  { value: "kole", label: "Kole" },
  { value: "kotido", label: "Kotido" },
  { value: "kumi", label: "Kumi" },
  { value: "kwania", label: "Kwania" },
  { value: "kween", label: "Kween" },
  { value: "kyankwanzi", label: "Kyankwanzi" },
  { value: "kyegegwa", label: "Kyegegwa" },
  { value: "kyenjojo", label: "Kyenjojo" },
  { value: "kyotera", label: "Kyotera" },
  { value: "lamwo", label: "Lamwo" },
  { value: "lira", label: "Lira" },
  { value: "luuka", label: "Luuka" },
  { value: "luwero", label: "Luwero" },
  { value: "lwengo", label: "Lwengo" },
  { value: "lyantonde", label: "Lyantonde" },
  { value: "madi-okollo", label: "Madi-Okollo" },
  { value: "manafwa", label: "Manafwa" },
  { value: "maracha", label: "Maracha" },
  { value: "masaka", label: "Masaka" },
  { value: "masindi", label: "Masindi" },
  { value: "mayuge", label: "Mayuge" },
  { value: "mbale", label: "Mbale" },
  { value: "mbarara", label: "Mbarara" },
  { value: "mitooma", label: "Mitooma" },
  { value: "mityana", label: "Mityana" },
  { value: "moroto", label: "Moroto" },
  { value: "moyo", label: "Moyo" },
  { value: "mpigi", label: "Mpigi" },
  { value: "mubende", label: "Mubende" },
  { value: "mukono", label: "Mukono" },
  { value: "nabilatuk", label: "Nabilatuk" },
  { value: "nakapiripirit", label: "Nakapiripirit" },
  { value: "nakaseke", label: "Nakaseke" },
  { value: "nakasongola", label: "Nakasongola" },
  { value: "namayingo", label: "Namayingo" },
  { value: "namisindwa", label: "Namisindwa" },
  { value: "namutumba", label: "Namutumba" },
  { value: "napak", label: "Napak" },
  { value: "nebbi", label: "Nebbi" },
  { value: "ngora", label: "Ngora" },
  { value: "ntoroko", label: "Ntoroko" },
  { value: "ntungamo", label: "Ntungamo" },
  { value: "nwoya", label: "Nwoya" },
  { value: "obongi", label: "Obongi" },
  { value: "omoro", label: "Omoro" },
  { value: "otuke", label: "Otuke" },
  { value: "oyam", label: "Oyam" },
  { value: "pader", label: "Pader" },
  { value: "pakwach", label: "Pakwach" },
  { value: "pallisa", label: "Pallisa" },
  { value: "rakai", label: "Rakai" },
  { value: "rubanda", label: "Rubanda" },
  { value: "rubirizi", label: "Rubirizi" },
  { value: "rukiga", label: "Rukiga" },
  { value: "rukungiri", label: "Rukungiri" },
  { value: "rwampara", label: "Rwampara" },
  { value: "sembabule", label: "Sembabule" },
  { value: "serere", label: "Serere" },
  { value: "sheema", label: "Sheema" },
  { value: "sironko", label: "Sironko" },
  { value: "soroti", label: "Soroti" },
  { value: "tororo", label: "Tororo" },
  { value: "wakiso", label: "Wakiso" },
  { value: "yumbe", label: "Yumbe" },
  { value: "zombo", label: "Zombo" },
] as const;

// Old LOCATIONS - kept for backward compatibility but deprecated
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

// Hotel-Specific Amenities
export const HOTEL_AMENITIES = [
  { id: "24/7 Front Desk", label: "24/7 Front Desk", icon: "🛎️" },
  { id: "Concierge Service", label: "Concierge Service", icon: "🎩" },
  { id: "Room Service", label: "Room Service", icon: "🍽️" },
  { id: "Housekeeping", label: "Housekeeping", icon: "🧹" },
  { id: "Laundry Service", label: "Laundry Service", icon: "🧺" },
  { id: "Restaurant", label: "Restaurant", icon: "🍴" },
  { id: "Bar/Lounge", label: "Bar/Lounge", icon: "🍸" },
  { id: "Spa & Wellness", label: "Spa & Wellness", icon: "💆" },
  { id: "Fitness Center", label: "Fitness Center", icon: "💪" },
  { id: "Swimming Pool", label: "Swimming Pool", icon: "🏊" },
  { id: "Business Center", label: "Business Center", icon: "💼" },
  { id: "Conference Rooms", label: "Conference Rooms", icon: "📊" },
  { id: "Free WiFi", label: "Free WiFi", icon: "📶" },
  { id: "Parking", label: "Parking", icon: "🅿️" },
  { id: "Airport Shuttle", label: "Airport Shuttle", icon: "🚐" },
  { id: "Valet Parking", label: "Valet Parking", icon: "🚗" },
  { id: "Elevator", label: "Elevator", icon: "🛗" },
  { id: "Air Conditioning", label: "Air Conditioning", icon: "❄️" },
  { id: "Safe Deposit Box", label: "Safe Deposit Box", icon: "🔐" },
  { id: "Currency Exchange", label: "Currency Exchange", icon: "💱" },
] as const;

// Hotel Room Types
export const HOTEL_ROOM_TYPES = [
  { value: "single", label: "Single Room" },
  { value: "double", label: "Double Room" },
  { value: "twin", label: "Twin Room" },
  { value: "suite", label: "Suite" },
  { value: "deluxe", label: "Deluxe Room" },
  { value: "executive", label: "Executive Room" },
  { value: "presidential", label: "Presidential Suite" },
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
export const DEFAULT_MAP_CENTER = { lat: 1.3733, lng: 32.2903 }; // Center of Uganda
export const DEFAULT_MAP_ZOOM = 7; // Zoom level to show all of Uganda
export const UGANDA_BOUNDS = {
  north: 4.2144, // Northern border
  south: -1.4823, // Southern border
  east: 35.0000, // Eastern border
  west: 29.5734, // Western border
};

// Country Configuration
export const COUNTRY = {
  name: "Uganda",
  code: "UG",
  phoneCode: "+256",
  currency: "UGX",
  currencySymbol: "USh",
};
