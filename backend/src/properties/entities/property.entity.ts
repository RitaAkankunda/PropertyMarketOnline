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
  checkInTime: string; // HH:mm format

  @Column({ nullable: true })
  checkOutTime: string; // HH:mm format

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
