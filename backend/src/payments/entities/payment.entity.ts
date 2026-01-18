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

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  BOOKING = 'booking',
  RENT = 'rent',
  DEPOSIT = 'deposit',
  VIEWING = 'viewing',
  SERVICE_FEE = 'service_fee',
  COMMISSION = 'commission',
  REFUND = 'refund',
}

export enum PaymentMethodType {
  MTN_MOMO = 'mtn_momo',
  AIRTEL_MONEY = 'airtel_money',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

@Entity('payments')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ nullable: true })
  propertyId: string;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ nullable: true })
  bookingId: string;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  type: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  paymentMethod: PaymentMethodType;

  @Column('decimal', { precision: 18, scale: 2 })
  amount: number;

  @Column({ default: 'UGX' })
  currency: string;

  // Transaction reference from payment provider
  @Column({ nullable: true })
  transactionRef: string;

  // External reference (from MTN, Airtel, Stripe, etc.)
  @Column({ nullable: true })
  externalRef: string;

  // Phone number used for mobile money
  @Column({ nullable: true })
  phoneNumber: string;

  // Description/notes
  @Column('text', { nullable: true })
  description: string;

  // Metadata (JSON for additional info)
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  // Failed payment reason
  @Column('text', { nullable: true })
  failureReason: string;

  // Refund information
  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  refundedAmount: number;

  @Column({ nullable: true })
  refundedAt: Date;

  @Column({ nullable: true })
  refundReason: string;

  // Receipt/Invoice number
  @Column({ nullable: true, unique: true })
  receiptNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Completed timestamp
  @Column({ nullable: true })
  completedAt: Date;
}
