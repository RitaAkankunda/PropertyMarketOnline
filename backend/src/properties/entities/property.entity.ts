import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

export enum PropertyType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  CONDO = 'condo',
  VILLA = 'villa',
  LAND = 'land',
  COMMERCIAL = 'commercial',
  WAREHOUSE = 'warehouse',
  OFFICE = 'office',
  AIRBNB = 'airbnb',
  HOTEL = 'hotel',
}

export enum ListingType {
  SALE = 'sale',
  RENT = 'rent',
  LEASE = 'lease',
}

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 18, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: PropertyType,
  })
  propertyType: PropertyType;

  @Column({
    type: 'enum',
    enum: ListingType,
    default: ListingType.SALE,
  })
  listingType: ListingType;

  @Column({ nullable: true })
  bedrooms: number;

  @Column({ nullable: true })
  bathrooms: number;

  @Column({ nullable: true })
  parking: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  area: number;

  @Column({ nullable: true })
  areaUnit: string; // sqm, sqft, acres, hectares

  @Column({ nullable: true })
  yearBuilt: number;

  @Column({ nullable: true })
  furnished: boolean;

  @Column('simple-array', { nullable: true })
  amenities: string[];

  // Hotel-specific fields
  @Column({ nullable: true })
  totalRooms: number;

  @Column({ nullable: true })
  starRating: number;

  @Column({ nullable: true })
  checkInTime: string;

  @Column({ nullable: true })
  checkOutTime: string;

  // Land-specific fields
  @Column({ nullable: true })
  landUseType: string; // agricultural, residential, commercial, industrial, mixed

  @Column({ nullable: true })
  topography: string; // flat, sloped, hilly, valley

  @Column({ nullable: true })
  roadAccess: boolean;

  @Column({ nullable: true })
  waterAvailability: boolean;

  @Column({ nullable: true })
  electricityAvailability: boolean;

  @Column({ nullable: true })
  titleType: string; // freehold, leasehold, mailo

  @Column({ nullable: true })
  soilQuality: string;

  // Commercial-specific fields
  @Column({ nullable: true })
  totalFloors: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  frontageWidth: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  ceilingHeight: number;

  @Column({ nullable: true })
  loadingBays: number;

  @Column({ nullable: true })
  footTrafficLevel: string; // low, medium, high, very_high

  @Column({ nullable: true })
  threePhasePower: boolean;

  @Column({ nullable: true })
  hvacSystem: boolean;

  @Column({ nullable: true })
  fireSafety: boolean;

  // Warehouse-specific fields
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  clearHeight: number;

  @Column({ nullable: true })
  loadingDocks: number;

  @Column({ nullable: true })
  driveInAccess: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  floorLoadCapacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  columnSpacing: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  officeArea: number;

  @Column({ nullable: true })
  coldStorage: boolean;

  @Column({ nullable: true })
  rampAccess: boolean;

  // Office-specific fields
  @Column({ nullable: true })
  workstationCapacity: number;

  @Column({ nullable: true })
  meetingRooms: number;

  @Column({ nullable: true })
  receptionArea: boolean;

  @Column({ nullable: true })
  elevator: boolean;

  @Column({ nullable: true })
  conferenceRoom: boolean;

  @Column({ nullable: true })
  serverRoom: boolean;

  @Column({ nullable: true })
  cafeteria: boolean;

  // Pricing fields - Hotel specific
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  standardRoomRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  peakSeasonRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  offPeakSeasonRate: number;

  // Pricing fields - Airbnb specific
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  nightlyRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  weeklyRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  monthlyRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  cleaningFee: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  securityDeposit: number;

  // Pricing fields - Land specific
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  pricePerAcre: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  pricePerHectare: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalLandPrice: number;

  // Pricing fields - Commercial specific
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  pricePerSqm: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  serviceCharge: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  commercialDeposit: number;

  // Pricing fields - Warehouse specific
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  warehouseLeaseRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  warehousePricePerSqm: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  warehouseDeposit: number;

  @Column({ nullable: true })
  utilitiesIncluded: boolean;

  // Pricing fields - Office specific
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  pricePerWorkstation: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  officePricePerSqm: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  sharedFacilitiesCost: number;

  @Column({ nullable: true })
  officeUtilitiesIncluded: boolean;

  // General pricing fields
  @Column({ nullable: true })
  currency: string; // UGX, USD, etc.

  @Column({ nullable: true })
  negotiable: boolean;

  // Location fields
  @Column({ nullable: true })
  region: string; // Central, Eastern, Northern, Western

  @Column({ nullable: true })
  city: string; // One of 11 major cities

  @Column({ nullable: true })
  district: string; // One of 137 districts

  @Column({ nullable: true })
  county: string; // County/Municipality

  @Column({ nullable: true })
  subcounty: string; // Subcounty/Division

  @Column({ nullable: true })
  parish: string; // Parish/Ward

  @Column({ nullable: true })
  village: string; // Village/Zone

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column('simple-array', { nullable: true })
  images: string[];

  @ManyToOne(() => User, (user) => user.properties)
  owner: User;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
