import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'participant_one_id' })
  participantOneId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'participant_one_id' })
  participantOne: User;

  @Column({ name: 'participant_two_id' })
  participantTwoId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'participant_two_id' })
  participantTwo: User;

  @Column({ name: 'property_id', nullable: true })
  propertyId: string | null;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'property_id' })
  property: Property | null;

  @Column({ name: 'last_message_content', nullable: true })
  lastMessageContent: string | null;

  @Column({ name: 'last_message_at', type: 'timestamp with time zone', nullable: true })
  lastMessageAt: Date | null;

  @Column({ name: 'participant_one_unread_count', default: 0 })
  participantOneUnreadCount: number;

  @Column({ name: 'participant_two_unread_count', default: 0 })
  participantTwoUnreadCount: number;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'blocked_by', nullable: true })
  blockedBy: string | null;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
