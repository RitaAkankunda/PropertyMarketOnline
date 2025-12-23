import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';

export interface CreateOAuthUserDto {
  email: string;
  firstName: string;
  lastName: string;
  provider: string;
  providerId: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async createOAuthUser(oauthUserDto: CreateOAuthUserDto): Promise<User> {
    const user = this.userRepository.create({
      email: oauthUserDto.email,
      firstName: oauthUserDto.firstName,
      lastName: oauthUserDto.lastName,
      provider: oauthUserDto.provider,
      providerId: oauthUserDto.providerId,
      role: oauthUserDto.role,
    });
    return await this.userRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async promoteToAdminByEmail(email: string): Promise<User | null> {
    const user = await this.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = UserRole.ADMIN;
    return await this.userRepository.save(user);
  }

  async findByRoles(roles: UserRole[]): Promise<User[]> {
    return await this.userRepository.find({ where: { role: roles as any } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Don't allow updating email or role through this endpoint
    const { email, role, ...updateData } = updateUserDto;
    
    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return await this.userRepository.save(user);
  }

  async updateOAuthProvider(id: string, provider: string, providerId: string): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.provider = provider;
    user.providerId = providerId;
    return await this.userRepository.save(user);
  }

}
