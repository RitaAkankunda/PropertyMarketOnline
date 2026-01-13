import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Property } from 'src/properties/entities/property.entity';

export enum BookingType {
  VIEWING = 'viewing',
  INQUIRY = 'inquiry',
  BOOKING = 'booking', // For Airbnb/hotel bookings
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  propertyId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: BookingType,
  })
  type: BookingType;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  // Contact information
  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column('text', { nullable: true })
  message: string;

  // Viewing/Booking schedule
  @Column('date', { nullable: true })
  scheduledDate: string;

  @Column({ nullable: true })
  scheduledTime: string;

  // For Airbnb/hotel bookings
  @Column('date', { nullable: true })
  checkInDate: string;

  @Column('date', { nullable: true })
  checkOutDate: string;

  @Column({ nullable: true })
  guests: number;

  // For rental/lease applications
  @Column('date', { nullable: true })
  moveInDate: string;

  @Column({ nullable: true })
  leaseDuration: string;

  @Column({ nullable: true })
  occupants: number;

  // For sale properties
  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  offerAmount: number;

  @Column({ nullable: true })
  financingType: string;

  // For commercial properties
  @Column({ nullable: true })
  businessType: string;

  @Column('text', { nullable: true })
  spaceRequirements: string;

  @Column({ nullable: true })
  leaseTerm: string;

  // Payment information
  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  paymentAmount: number;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentStatus: string; // pending, completed, failed

  @Column({ nullable: true })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
