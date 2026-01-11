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
import { Job } from 'src/jobs/entities/job.entity';

export enum TicketCategory {
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  SECURITY = 'security',
  STRUCTURAL = 'structural',
  APPLIANCE = 'appliance',
  INTERNET = 'internet',
  OTHER = 'other',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

@Entity('maintenance_tickets')
export class MaintenanceTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TicketCategory,
  })
  category: TicketCategory;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PENDING,
  })
  status: TicketStatus;

  @Column()
  property: string;

  @Column()
  unit: string;

  @Column()
  location: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant: User;

  @Column({ nullable: true })
  tenantId?: string;

  @Column({ nullable: true })
  tenantPhone?: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedProviderId' })
  assignedProvider: User;

  @Column({ nullable: true })
  assignedProviderId?: string;

  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  escrowAmount?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ nullable: true })
  ownerId?: string;

  @ManyToOne(() => Job, { nullable: true })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @Column({ nullable: true })
  jobId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

