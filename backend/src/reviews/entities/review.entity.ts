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
import { Provider } from 'src/providers/entities/provider.entity';
import { Job } from 'src/jobs/entities/job.entity';

@Entity('provider_reviews')
@Index(['providerId', 'reviewerId'], { unique: true }) // One review per user per provider
@Index(['jobId'], { unique: true }) // One review per job
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  @Column()
  providerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column()
  reviewerId: string;

  @ManyToOne(() => Job, { nullable: true })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @Column({ nullable: true })
  jobId: string; // Link review to completed job

  @Column('decimal', { precision: 3, scale: 2 })
  rating: number; // 1.0 to 5.0

  @Column('text', { nullable: true })
  comment: string;

  @Column('text', { nullable: true })
  providerResponse: string; // Provider can respond to review

  @Column({ nullable: true })
  respondedAt: Date; // When provider responded

  @Column({ default: false })
  isVerified: boolean; // Admin can verify reviews

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

