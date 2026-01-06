import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { Property } from 'src/properties/entities/property.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  role: UserRole;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  provider?: string;

  @Column({ nullable: true })
  providerId?: string;

  @Column({ default: false })
  isVerified: boolean;

  @OneToMany(() => Property, (property) => property.owner)
  properties: Property[];

  @CreateDateColumn({
    type: 'timestamptz', // Use timestamp with timezone to store in UTC
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @UpdateDateColumn({
    type: 'timestamptz', // Use timestamp with timezone to store in UTC
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
