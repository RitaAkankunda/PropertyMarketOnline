import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

export enum NotificationType {
  JOB_CREATED = 'job_created',
  JOB_ACCEPTED = 'job_accepted',
  JOB_REJECTED = 'job_rejected',
  JOB_STARTED = 'job_started',
  JOB_COMPLETED = 'job_completed',
  JOB_CANCELLED = 'job_cancelled',
  JOB_STATUS_UPDATED = 'job_status_updated',
  MAINTENANCE_TICKET_CREATED = 'maintenance_ticket_created',
  MAINTENANCE_TICKET_ASSIGNED = 'maintenance_ticket_assigned',
  MAINTENANCE_TICKET_STATUS_UPDATED = 'maintenance_ticket_status_updated',
  MAINTENANCE_TICKET_JOB_LINKED = 'maintenance_ticket_job_linked',
}

@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column('jsonb', { nullable: true })
  data?: Record<string, any>; // Additional data like jobId, ticketId, etc.

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
