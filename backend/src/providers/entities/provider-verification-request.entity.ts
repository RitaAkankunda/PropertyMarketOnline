import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Provider } from './provider.entity';

export enum VerificationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('provider_verification_requests')
export class ProviderVerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  @Column()
  providerId: string;

  @Column({
    type: 'enum',
    enum: VerificationRequestStatus,
    default: VerificationRequestStatus.PENDING,
  })
  status: VerificationRequestStatus;

  @Column({ nullable: true })
  idDocumentUrl: string;

  @Column({ nullable: true })
  businessLicenseUrl: string;

  @Column('jsonb', { nullable: true })
  additionalDocuments: Array<{
    name: string;
    url: string;
    type: string;
  }>;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  reviewedBy: string; // Admin user ID

  @Column({ nullable: true })
  reviewedAt: Date;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  submittedAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}

