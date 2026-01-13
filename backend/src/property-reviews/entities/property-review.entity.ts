import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Property } from 'src/properties/entities/property.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

@Entity('property_reviews')
@Index(['propertyId', 'reviewerId'], { unique: true }) // One review per user per property
@Index(['bookingId'], { unique: true }) // One review per booking (optional)
export class PropertyReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  propertyId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column()
  reviewerId: string;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ nullable: true })
  bookingId: string; // Link review to booking (for verified reviews)

  @Column('decimal', { precision: 3, scale: 2 })
  rating: number; // 1.0 to 5.0

  @Column('text', { nullable: true })
  comment: string;

  // Rating breakdown (like Booking.com)
  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  cleanlinessRating?: number; // 1.0 to 5.0

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  locationRating?: number; // 1.0 to 5.0

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  valueRating?: number; // 1.0 to 5.0

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  communicationRating?: number; // 1.0 to 5.0

  @Column('text', { nullable: true })
  ownerResponse: string; // Property owner can respond to review

  @Column({ nullable: true })
  respondedAt: Date; // When owner responded

  @Column({ default: false })
  isVerified: boolean; // Verified booking = verified review

  @Column({ default: false })
  isHidden: boolean; // Admin can hide inappropriate reviews

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
