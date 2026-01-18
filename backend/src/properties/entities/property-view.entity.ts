import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Property } from './property.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('property_views')
@Index(['propertyId', 'createdAt']) // For efficient date-range queries
export class PropertyView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  @Index()
  propertyId: string;

  // Optional: track which user viewed (null for anonymous/guest views)
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'viewerId' })
  viewer: User;

  @Column({ nullable: true })
  viewerId: string;

  // Track visitor info for analytics
  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referrer: string;

  // Session tracking to avoid counting duplicate views
  @Column({ nullable: true })
  sessionId: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
