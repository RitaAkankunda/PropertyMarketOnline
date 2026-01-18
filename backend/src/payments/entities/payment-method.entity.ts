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
import { PaymentMethodType } from './payment.entity';

@Entity('payment_methods')
@Index(['userId', 'isDefault'])
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  type: PaymentMethodType;

  // Display name (e.g., "MTN Mobile Money", "My Visa Card")
  @Column()
  name: string;

  // For mobile money: phone number (masked for display)
  @Column({ nullable: true })
  phoneNumber: string;

  // For cards: last 4 digits
  @Column({ nullable: true })
  last4: string;

  // For cards: card brand (Visa, Mastercard, etc.)
  @Column({ nullable: true })
  cardBrand: string;

  // For cards: expiry month
  @Column({ nullable: true })
  expiryMonth: number;

  // For cards: expiry year
  @Column({ nullable: true })
  expiryYear: number;

  // For bank transfer: bank name
  @Column({ nullable: true })
  bankName: string;

  // For bank transfer: account number (masked)
  @Column({ nullable: true })
  accountNumber: string;

  // Is this the default payment method?
  @Column({ default: false })
  isDefault: boolean;

  // Is this method verified/confirmed?
  @Column({ default: false })
  isVerified: boolean;

  // Stripe payment method ID (if using Stripe)
  @Column({ nullable: true })
  stripePaymentMethodId: string;

  // Metadata
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
