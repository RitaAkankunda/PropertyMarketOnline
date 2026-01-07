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

export enum JobStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column({ nullable: true })
  providerId?: string;

  @Column()
  serviceType: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  // Location stored as JSON
  @Column('jsonb')
  location: {
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };

  @Column('date')
  scheduledDate: string;

  @Column()
  scheduledTime: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  price: number;

  @Column({ default: 'UGX' })
  currency: string;

  @Column({ default: false })
  depositPaid: boolean;

  @Column({ nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  completionNotes: string; // Provider's notes about completion

  @Column('simple-array', { nullable: true })
  completionPhotos: string[]; // URLs of completion photos

  @Column({ nullable: true, type: 'decimal', precision: 3, scale: 2 })
  rating: number;

  @Column('text', { nullable: true })
  review: string;

  @Column('text', { nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

