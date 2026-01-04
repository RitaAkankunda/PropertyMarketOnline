import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ValueTransformer,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

// Transformer for PostgreSQL array type
const arrayTransformer: ValueTransformer = {
  to: (value: string[] | null) => {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    return [value];
  },
  from: (value: string[] | string | null) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Handle comma-separated string (fallback)
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  },
};

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  businessName: string;

  @Column({
    type: 'text',
    array: true,
    transformer: arrayTransformer,
  })
  serviceTypes: string[];

  @Column('text')
  description: string;

  @Column('jsonb', { nullable: true })
  pricing: {
    type: 'hourly' | 'fixed' | 'custom';
    hourlyRate?: number;
    minimumCharge?: number;
    currency?: string;
  };

  @Column('jsonb', { nullable: true })
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
  };

  @Column('jsonb', { nullable: true })
  location: {
    city: string;
    district?: string;
    serviceRadius: number;
  };

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    transformer: arrayTransformer,
  })
  portfolio: string[];

  @Column('jsonb', { nullable: true })
  certifications: Array<{
    id?: string;
    name: string;
    issuer: string;
    documentUrl?: string;
    isVerified: boolean;
  }>;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: 0 })
  completedJobs: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isKycVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

