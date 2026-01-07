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
