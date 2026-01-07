import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RegisterProviderCompleteDto } from './dto/register-provider-complete.dto';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { ReviewVerificationRequestDto } from './dto/review-verification-request.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { User } from '../users/entities/user.entity';
import { Provider } from './entities/provider.entity';
import { ProviderVerificationRequest, VerificationRequestStatus } from './entities/provider-verification-request.entity';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../common/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProviderVerificationRequest)
    private readonly verificationRequestRepository: Repository<ProviderVerificationRequest>,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  async findAllProviders(
    filters?: {
      serviceType?: string;
      location?: string;
      search?: string;
      minRating?: number;
      isVerified?: boolean;
    },
    page: number = 1,
    pageSize: number = 12,
  ) {
    // Log total providers count for debugging
    const totalCount = await this.providerRepository.count();
    console.log('[PROVIDERS] findAllProviders - Total providers in database:', totalCount);
    
    const query = this.providerRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.user', 'user');

    // Only filter by isVerified if explicitly set
    // By default, show all providers (both verified and unverified)
    if (filters?.isVerified !== undefined) {
      query.where('provider.isVerified = :isVerified', { isVerified: filters.isVerified });
    }

    if (filters?.serviceType) {
      // For PostgreSQL arrays, use ANY operator to check if serviceType exists in the array
      // TypeORM handles parameterization, but we need to use raw SQL for array operators
      console.log('[PROVIDERS] Filtering by serviceType:', filters.serviceType);
      query.andWhere(`:serviceType = ANY(provider.serviceTypes)`, {
        serviceType: filters.serviceType,
      });
    }

    if (filters?.location) {
      query.andWhere(
        '(provider.location->>\'city\' ILIKE :location OR provider.location->>\'district\' ILIKE :location)',
        { location: `%${filters.location}%` },
      );
    }

    if (filters?.search) {
      query.andWhere(
        '(provider.businessName ILIKE :search OR provider.description ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.minRating) {
      query.andWhere('provider.rating >= :minRating', { minRating: filters.minRating });
    }

    // Add pagination
    const skip = (page - 1) * pageSize;
    query.skip(skip).take(pageSize);
    query.orderBy('provider.rating', 'DESC').addOrderBy('provider.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();
    
    console.log('[PROVIDERS] findAllProviders - Query results:', {
      filters,
      returnedCount: data.length,
      totalCount: total,
      providerNames: data.map(p => p.businessName || p.user?.firstName),
    });

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async registerProvider(userId: string, registerDto: RegisterProviderDto): Promise<Provider> {
    try {
      // Get the current user
      let user = await this.usersService.findOneById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update user role to SERVICE_PROVIDER (unless they're an admin)
      // Admins can have provider profiles while keeping their admin role
      if (user.role !== UserRole.SERVICE_PROVIDER && user.role !== UserRole.ADMIN) {
        try {
          console.log('[PROVIDERS] Updating user role from', user.role, 'to', UserRole.SERVICE_PROVIDER);
          const updatedUser = await this.usersService.updateRole(userId, UserRole.SERVICE_PROVIDER);
          console.log('[PROVIDERS] User role updated successfully:', {
            userId: updatedUser.id,
            oldRole: user.role,
            newRole: updatedUser.role,
          });
          
          // Verify the role was actually saved
          const verifyUser = await this.usersService.findOneById(userId);
          if (verifyUser && verifyUser.role !== UserRole.SERVICE_PROVIDER && verifyUser.role !== UserRole.ADMIN) {
            console.error('[PROVIDERS] WARNING: Role update did not persist!', {
              expected: UserRole.SERVICE_PROVIDER,
              actual: verifyUser.role,
            });
            // Log warning but continue - provider profile can still be created
            console.warn('[PROVIDERS] Continuing with provider creation despite role update issue');
          } else {
            console.log('[PROVIDERS] Role update verified in database');
            // Update the user object for later use
            user = verifyUser || updatedUser;
          }
        } catch (roleError) {
          console.error('[PROVIDERS] Failed to update user role:', {
            error: roleError.message,
            stack: roleError.stack,
            userId: userId,
            userRole: user.role,
          });
          // Log error but continue - we can still create the provider profile
          // The user can sync their role later if needed
          console.warn('[PROVIDERS] Continuing with provider creation despite role update failure');
        }
      } else if (user.role === UserRole.ADMIN) {
        console.log('[PROVIDERS] User is an admin - keeping admin role, adding provider profile');
      } else {
        console.log('[PROVIDERS] User already has SERVICE_PROVIDER role');
      }

      // Check if provider already exists
      const existingProvider = await this.providerRepository.findOne({
        where: { userId },
      });

      if (existingProvider) {
        console.log('[PROVIDERS] Existing provider found, updating profile:', {
          providerId: existingProvider.id,
          businessName: existingProvider.businessName,
          currentUserRole: user.role,
        });
        
        // Try to update role if needed, but don't fail if it doesn't work
        // The provider profile is more important than the role
        if (user.role !== UserRole.SERVICE_PROVIDER && user.role !== UserRole.ADMIN) {
          console.log('[PROVIDERS] Attempting to update role from', user.role, 'to', UserRole.SERVICE_PROVIDER);
          try {
            const updatedUser = await this.usersService.updateRole(userId, UserRole.SERVICE_PROVIDER);
            user = updatedUser;
            console.log('[PROVIDERS] Role updated for existing provider');
          } catch (roleError) {
            console.warn('[PROVIDERS] Failed to update role for existing provider (non-critical):', {
              error: roleError.message,
              userRole: user.role,
            });
            // Continue anyway - provider exists and can be updated
            // User can sync their role later if needed
          }
        } else {
          console.log('[PROVIDERS] User role is already', user.role, '- no update needed');
        }
        
        // Update existing provider
        Object.assign(existingProvider, {
          businessName: registerDto.businessName.trim(),
          profilePicture: registerDto.profilePicture || existingProvider.profilePicture,
          serviceTypes: Array.isArray(registerDto.serviceTypes) 
            ? registerDto.serviceTypes 
            : [registerDto.serviceTypes].filter(Boolean),
          description: registerDto.description.trim(),
          pricing: {
            type: registerDto.pricing.type,
            hourlyRate: registerDto.pricing.hourlyRate,
            minimumCharge: registerDto.pricing.minimumCharge,
            currency: registerDto.pricing.currency || 'UGX',
          },
          availability: {
            days: registerDto.availability.days || [],
            startTime: registerDto.availability.startTime,
            endTime: registerDto.availability.endTime,
            isAvailable: (registerDto.availability.days?.length || 0) > 0,
          },
          location: {
            city: registerDto.location.city,
            district: registerDto.location.district,
            serviceRadius: Number(registerDto.location.serviceRadius),
          },
        });
        const updatedProvider = await this.providerRepository.save(existingProvider);
        
        // Load the provider with user relation for proper response
        const providerWithUser = await this.providerRepository.findOne({
          where: { id: updatedProvider.id },
          relations: ['user'],
        });

        return providerWithUser || updatedProvider;
      }

      // Validate required fields
      if (!registerDto.businessName || !registerDto.serviceTypes || !registerDto.description) {
        throw new BadRequestException('Missing required fields: businessName, serviceTypes, or description');
      }

      if (!registerDto.pricing || !registerDto.availability || !registerDto.location) {
        throw new BadRequestException('Missing required fields: pricing, availability, or location');
      }

      // Ensure serviceTypes is an array and properly formatted
      let serviceTypes: string[];
      if (Array.isArray(registerDto.serviceTypes)) {
        serviceTypes = registerDto.serviceTypes.filter(Boolean).map(s => String(s).trim());
      } else if (registerDto.serviceTypes) {
        serviceTypes = [String(registerDto.serviceTypes).trim()];
      } else {
        serviceTypes = [];
      }

      if (serviceTypes.length === 0) {
        throw new BadRequestException('At least one service type is required');
      }

      console.log('[PROVIDERS] Prepared serviceTypes:', {
        original: registerDto.serviceTypes,
        processed: serviceTypes,
        isArray: Array.isArray(serviceTypes),
      });

      // Create new provider
      const provider = this.providerRepository.create({
        userId,
        businessName: registerDto.businessName.trim(),
        profilePicture: registerDto.profilePicture || null,
        serviceTypes: serviceTypes as any, // TypeORM will handle the array conversion
        description: registerDto.description.trim(),
        pricing: {
          type: registerDto.pricing.type,
          hourlyRate: registerDto.pricing.hourlyRate,
          minimumCharge: registerDto.pricing.minimumCharge,
          currency: registerDto.pricing.currency || 'UGX',
        },
        availability: {
          days: registerDto.availability.days || [],
          startTime: registerDto.availability.startTime,
          endTime: registerDto.availability.endTime,
          isAvailable: (registerDto.availability.days?.length || 0) > 0,
        },
        location: {
          city: registerDto.location.city,
          district: registerDto.location.district,
          serviceRadius: Number(registerDto.location.serviceRadius),
        },
        rating: 0,
        reviewCount: 0,
        completedJobs: 0,
        isVerified: false,
        isKycVerified: false,
      });

      console.log('[PROVIDERS] About to save provider:', {
        userId,
        businessName: provider.businessName,
        serviceTypes: provider.serviceTypes,
        serviceTypesType: typeof provider.serviceTypes,
        serviceTypesIsArray: Array.isArray(provider.serviceTypes),
        pricing: provider.pricing,
        availability: provider.availability,
        location: provider.location,
      });

      let savedProvider;
      try {
        savedProvider = await this.providerRepository.save(provider);
        console.log('[PROVIDERS] Provider saved successfully');
      } catch (saveError) {
        console.error('[PROVIDERS] Save error details:', {
          message: saveError.message,
          code: saveError.code,
          detail: saveError.detail,
          constraint: saveError.constraint,
          table: saveError.table,
          column: saveError.column,
          stack: saveError.stack,
        });
        throw saveError;
      }
      
      console.log('[PROVIDERS] Provider saved successfully:', {
        id: savedProvider.id,
        businessName: savedProvider.businessName,
      });

      // Load the provider with user relation for proper response
      try {
        const providerWithUser = await this.providerRepository.findOne({
          where: { id: savedProvider.id },
          relations: ['user'],
        });
        console.log('[PROVIDERS] Provider with user loaded:', {
          hasUser: !!providerWithUser?.user,
          userId: providerWithUser?.user?.id,
        });
        return providerWithUser || savedProvider;
      } catch (relationError) {
        console.warn('[PROVIDERS] Failed to load user relation, returning provider without relation:', relationError.message);
        return savedProvider;
      }
    } catch (error) {
      console.error('[PROVIDERS] registerProvider error details:', {
        userId,
        error: error.message,
        stack: error.stack,
        registerDto: {
          businessName: registerDto.businessName,
          serviceTypes: registerDto.serviceTypes,
          descriptionLength: registerDto.description?.length,
          pricing: registerDto.pricing,
          availability: registerDto.availability,
          location: registerDto.location,
        },
      });
      throw error;
    }
  }

  /**
   * Register as a provider directly - creates account and provider profile in one step
   * This is for users who only want to be service providers, not buyers/renters/listers
   */
  async registerProviderComplete(registerDto: RegisterProviderCompleteDto) {
    try {
      console.log('[PROVIDERS] registerProviderComplete called with:', {
        email: registerDto.email,
        businessName: registerDto.businessName,
        serviceTypes: registerDto.serviceTypes,
        descriptionLength: registerDto.description?.length,
      });

      // Check if user already exists
      const existingUser = await this.usersService.findOneByEmail(registerDto.email);
      let user: User;
      let isExistingUser = false;
      
      if (existingUser) {
        // User exists - verify password and add provider profile to existing account
        console.log('[PROVIDERS] User with email already exists, verifying password to add provider profile:', {
          email: registerDto.email,
          userId: existingUser.id,
          currentRole: existingUser.role,
        });
        
        // Verify password
        if (!existingUser.password) {
          throw new BadRequestException('This email is registered with OAuth. Please login and register as a provider from your dashboard.');
        }
        
        const isPasswordValid = await bcrypt.compare(registerDto.password, existingUser.password);
        if (!isPasswordValid) {
          throw new BadRequestException('Incorrect password. Please use the correct password for this account, or login first and register as a provider from your dashboard.');
        }
        
        // Use existing user
        user = existingUser;
        isExistingUser = true;
        
        // Check if user already has a provider profile
        const existingProvider = await this.providerRepository.findOne({
          where: { userId: user.id },
        });
        
        if (existingProvider) {
          throw new BadRequestException('You already have a service provider profile. Please login to manage it.');
        }
        
        // Update user role to SERVICE_PROVIDER (unless they're an admin)
        if (user.role !== UserRole.SERVICE_PROVIDER && user.role !== UserRole.ADMIN) {
          try {
            console.log('[PROVIDERS] Updating existing user role from', user.role, 'to', UserRole.SERVICE_PROVIDER);
            user = await this.usersService.updateRole(user.id, UserRole.SERVICE_PROVIDER);
            console.log('[PROVIDERS] User role updated successfully');
          } catch (roleError) {
            console.error('[PROVIDERS] Failed to update user role:', roleError);
            throw new BadRequestException('Failed to update account. Please contact support.');
          }
        }
        
        // Update user info if provided (phone, name updates)
        if (registerDto.phone && registerDto.phone !== user.phone) {
          user.phone = registerDto.phone;
        }
        if (registerDto.firstName && registerDto.firstName !== user.firstName) {
          user.firstName = registerDto.firstName;
        }
        if (registerDto.lastName && registerDto.lastName !== user.lastName) {
          user.lastName = registerDto.lastName;
        }
        
        // Save updated user info if any changes
        if (registerDto.phone || registerDto.firstName || registerDto.lastName) {
          user = await this.userRepository.save(user);
        }
      } else {
        // User doesn't exist - create new account
          // Validate required fields
        if (!registerDto.businessName || !registerDto.serviceTypes || !registerDto.description) {
          throw new BadRequestException('Missing required fields: businessName, serviceTypes, or description');
        }

        if (!registerDto.pricing || !registerDto.availability || !registerDto.location) {
          throw new BadRequestException('Missing required fields: pricing, availability, or location');
        }

        // Ensure serviceTypes is an array
        const serviceTypes = Array.isArray(registerDto.serviceTypes) 
          ? registerDto.serviceTypes 
          : [registerDto.serviceTypes].filter(Boolean);

        if (serviceTypes.length === 0) {
          throw new BadRequestException('At least one service type is required');
        }

        // Create user account with SERVICE_PROVIDER role
        console.log('[PROVIDERS] Creating new user account:', {
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        });
        
        user = await this.usersService.create({
          email: registerDto.email,
          password: registerDto.password,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phone: registerDto.phone,
          role: UserRole.SERVICE_PROVIDER,
        });

        if (!user || !user.id) {
          throw new BadRequestException('Failed to create user account');
        }
        
        console.log('[PROVIDERS] New user created:', {
          userId: user.id,
          email: user.email,
        });
      }

      // Validate required fields for provider profile
      if (!registerDto.businessName || !registerDto.serviceTypes || !registerDto.description) {
        throw new BadRequestException('Missing required fields: businessName, serviceTypes, or description');
      }

      if (!registerDto.pricing || !registerDto.availability || !registerDto.location) {
        throw new BadRequestException('Missing required fields: pricing, availability, or location');
      }

      // Ensure serviceTypes is an array
      const serviceTypes = Array.isArray(registerDto.serviceTypes) 
        ? registerDto.serviceTypes 
        : [registerDto.serviceTypes].filter(Boolean);

      if (serviceTypes.length === 0) {
        throw new BadRequestException('At least one service type is required');
      }

      // Check if provider already exists for this user
      const existingProviderForUser = await this.providerRepository.findOne({
        where: { userId: user.id },
      });
      
      if (existingProviderForUser) {
        console.warn('[PROVIDERS] Provider already exists for user, updating instead of creating:', {
          userId: user.id,
          existingProviderId: existingProviderForUser.id,
          existingBusinessName: existingProviderForUser.businessName,
        });
        // Update existing provider instead of creating new one
        Object.assign(existingProviderForUser, {
          businessName: registerDto.businessName.trim(),
          profilePicture: registerDto.profilePicture || existingProviderForUser.profilePicture,
          serviceTypes,
          description: registerDto.description.trim(),
          pricing: {
            type: registerDto.pricing.type,
            hourlyRate: registerDto.pricing.hourlyRate,
            minimumCharge: registerDto.pricing.minimumCharge,
            currency: registerDto.pricing.currency || 'UGX',
          },
          availability: {
            days: registerDto.availability.days || [],
            startTime: registerDto.availability.startTime,
            endTime: registerDto.availability.endTime,
            isAvailable: (registerDto.availability.days?.length || 0) > 0,
          },
          location: {
            city: registerDto.location.city,
            district: registerDto.location.district,
            serviceRadius: Number(registerDto.location.serviceRadius),
          },
        });
        const savedProvider = await this.providerRepository.save(existingProviderForUser);
        
        // Refresh user to ensure we have the latest data
        const refreshedUser = await this.usersService.findOneById(user.id);
        if (!refreshedUser) {
          throw new BadRequestException('Failed to retrieve user');
        }
        
        // Generate JWT token
        const accessToken = await this.authService.generateAccessToken(refreshedUser);
        const { password, ...userWithoutPassword } = refreshedUser;
        
        return {
          accessToken,
          user: userWithoutPassword,
        };
      }

      // Create NEW provider profile (user doesn't have one yet)
      console.log('[PROVIDERS] Creating new provider for new user:', {
        userId: user.id,
        email: user.email,
        businessName: registerDto.businessName,
      });
      
      const provider = this.providerRepository.create({
        userId: user.id,
        businessName: registerDto.businessName.trim(),
        profilePicture: registerDto.profilePicture || null,
        serviceTypes,
        description: registerDto.description.trim(),
        pricing: {
          type: registerDto.pricing.type,
          hourlyRate: registerDto.pricing.hourlyRate,
          minimumCharge: registerDto.pricing.minimumCharge,
          currency: registerDto.pricing.currency || 'UGX',
        },
        availability: {
          days: registerDto.availability.days || [],
          startTime: registerDto.availability.startTime,
          endTime: registerDto.availability.endTime,
          isAvailable: (registerDto.availability.days?.length || 0) > 0,
        },
        location: {
          city: registerDto.location.city,
          district: registerDto.location.district,
          serviceRadius: Number(registerDto.location.serviceRadius),
        },
        rating: 0,
        reviewCount: 0,
        completedJobs: 0,
        isVerified: false,
        isKycVerified: false,
      });

      const savedProvider = await this.providerRepository.save(provider);
      
      console.log('[PROVIDERS] New provider created successfully:', {
        providerId: savedProvider.id,
        userId: savedProvider.userId,
        businessName: savedProvider.businessName,
        serviceTypes: savedProvider.serviceTypes,
      });
      
      // Verify the provider was saved correctly by counting all providers
      const totalProviders = await this.providerRepository.count();
      console.log('[PROVIDERS] Total providers in database after creation:', totalProviders);
      
      // List all providers for debugging
      const allProviders = await this.providerRepository.find({
        select: ['id', 'businessName', 'userId', 'createdAt'],
        order: { createdAt: 'DESC' },
      });
      console.log('[PROVIDERS] All providers in database:', allProviders.map(p => ({
        id: p.id.substring(0, 8) + '...',
        businessName: p.businessName,
        userId: p.userId.substring(0, 8) + '...',
        createdAt: p.createdAt,
      })));

      // Refresh user to ensure we have the latest data
      const refreshedUser = await this.usersService.findOneById(user.id);
      if (!refreshedUser) {
        throw new BadRequestException('Failed to retrieve created user');
      }

      // Generate JWT token
      const accessToken = await this.authService.generateAccessToken(refreshedUser);

      // Return user and token
      const { password, ...userWithoutPassword } = refreshedUser;

      console.log('[PROVIDERS] registerProviderComplete success:', {
        userId: refreshedUser.id,
        providerId: savedProvider.id,
        businessName: savedProvider.businessName,
      });

      return {
        accessToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error('[PROVIDERS] registerProviderComplete error details:', {
        message: error.message,
        stack: error.stack,
        errorName: error.name,
        registerDto: {
          email: registerDto.email,
          businessName: registerDto.businessName,
          serviceTypes: registerDto.serviceTypes,
          descriptionLength: registerDto.description?.length,
        },
      });
      // If user was created but provider creation failed, we might want to clean up
      // For now, just rethrow the error
      throw error;
    }
  }

  /**
   * Sync user role - if user has a provider profile, ensure their role is SERVICE_PROVIDER
   */
  async syncUserRole(userId: string) {
    try {
      // Check if user has a provider profile
      const provider = await this.providerRepository.findOne({
        where: { userId },
      });
      
      if (provider) {
        // User has provider, ensure role is SERVICE_PROVIDER
        const user = await this.usersService.findOneById(userId);
        if (!user) {
          throw new NotFoundException('User not found');
        }
        
        if (user.role !== UserRole.SERVICE_PROVIDER) {
          console.log(`[PROVIDERS] Syncing role for user ${userId} from ${user.role} to SERVICE_PROVIDER`);
          const updatedUser = await this.usersService.updateRole(userId, UserRole.SERVICE_PROVIDER);
          
          // Verify the update
          const verifyUser = await this.usersService.findOneById(userId);
          console.log('[PROVIDERS] Role sync result:', {
            userId: verifyUser.id,
            role: verifyUser.role,
            success: verifyUser.role === UserRole.SERVICE_PROVIDER,
          });
          
          const { password, ...userWithoutPassword } = updatedUser;
          return { 
            success: true, 
            message: 'Role updated to service_provider',
            user: userWithoutPassword 
          };
        }
        
        const { password, ...userWithoutPassword } = user;
        return { 
          success: true, 
          message: 'User already has correct role',
          user: userWithoutPassword 
        };
      }
      
      return { 
        success: false, 
        message: 'User does not have a provider profile' 
      };
    } catch (error) {
      console.error('[PROVIDERS] Error in syncUserRole:', error);
      throw error;
    }
  }

  async findNearbyProviders(
    serviceType: string,
    latitude: number,
    longitude: number,
    radius: number = 10,
  ) {
    // Get all providers with filters
    const filters: any = {};
    if (serviceType) {
      filters.serviceType = serviceType;
    }
    
    const allProvidersResult = await this.findAllProviders(filters, 1, 1000); // Get all providers for nearby search
    const allProviders = allProvidersResult.data;

    // Calculate distance and filter by radius
    // Using Haversine formula for distance calculation
    const nearbyProviders = allProviders
      .map((provider) => {
        // Calculate distance using provider's location
        // For now, we'll return all providers since location might not have lat/lng
        // In a full implementation, you'd extract lat/lng from provider.location
        const distance = 0; // Placeholder - would calculate using provider.location.latitude/longitude
        
        return {
          ...provider,
          distance,
        };
      })
      .filter((provider) => provider.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return nearbyProviders;
  }

  async getProviderByUserId(userId: string): Promise<Provider | null> {
    const provider = await this.providerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    return provider;
  }

  /**
   * Update provider profile picture
   */
  async updateProfilePicture(userId: string, profilePictureUrl: string): Promise<{ profilePicture: string; message: string }> {
    const provider = await this.getProviderByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    provider.profilePicture = profilePictureUrl;
    await this.providerRepository.save(provider);

    return {
      profilePicture: provider.profilePicture,
      message: 'Profile picture uploaded successfully',
    };
  }

  /**
   * Update provider profile
   * Allows providers to update their business information, pricing, availability, location, etc.
   */
  async updateProviderProfile(userId: string, updateDto: UpdateProviderProfileDto): Promise<Provider> {
    // Get the provider profile
    const provider = await this.getProviderByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    // Update business name if provided
    if (updateDto.businessName !== undefined) {
      if (updateDto.businessName.trim().length < 3) {
        throw new BadRequestException('Business name must be at least 3 characters');
      }
      provider.businessName = updateDto.businessName.trim();
    }

    // Update service types if provided
    if (updateDto.serviceTypes !== undefined) {
      const serviceTypes = Array.isArray(updateDto.serviceTypes)
        ? updateDto.serviceTypes.filter(Boolean).map(s => String(s).trim())
        : [String(updateDto.serviceTypes).trim()].filter(Boolean);

      if (serviceTypes.length === 0) {
        throw new BadRequestException('At least one service type is required');
      }
      provider.serviceTypes = serviceTypes as any;
    }

    // Update description if provided
    if (updateDto.description !== undefined) {
      if (updateDto.description.trim().length < 50) {
        throw new BadRequestException('Description must be at least 50 characters');
      }
      provider.description = updateDto.description.trim();
    }

    // Update pricing if provided
    if (updateDto.pricing !== undefined) {
      provider.pricing = {
        ...provider.pricing,
        ...updateDto.pricing,
      };
      // Ensure currency defaults to UGX if not provided
      if (!provider.pricing.currency) {
        provider.pricing.currency = 'UGX';
      }
    }

    // Update availability if provided
    if (updateDto.availability !== undefined) {
      provider.availability = {
        ...provider.availability,
        ...updateDto.availability,
      };
      // Update isAvailable based on days
      if (updateDto.availability.days !== undefined) {
        provider.availability.isAvailable = updateDto.availability.days.length > 0;
      }
    }

    // Update location if provided
    if (updateDto.location !== undefined) {
      provider.location = {
        ...provider.location,
        ...updateDto.location,
      };
    }

    // Update portfolio images if provided
    if (updateDto.portfolio !== undefined) {
      const portfolio = Array.isArray(updateDto.portfolio)
        ? updateDto.portfolio.filter(Boolean)
        : [];
      provider.portfolio = portfolio as any;
    }

    // Save the updated provider
    const updatedProvider = await this.providerRepository.save(provider);

    // Load with user relation for proper response
    const providerWithUser = await this.providerRepository.findOne({
      where: { id: updatedProvider.id },
      relations: ['user'],
    });

    return providerWithUser || updatedProvider;
  }

  /**
   * Deactivate provider profile and revert user role back to LISTER
   * This allows users to go back to being a lister from being a service provider
   */
  async deactivateProviderProfile(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get the user
      const user = await this.usersService.findOneById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user has a provider profile
      const provider = await this.providerRepository.findOne({
        where: { userId },
      });

      if (!provider) {
        return {
          success: false,
          message: 'You do not have an active provider profile',
        };
      }

      // Check if user has active jobs (pending, accepted, or in-progress)
      // We prevent deactivation if there are active jobs
      const { Job, JobStatus } = await import('src/jobs/entities/job.entity');
      const jobRepository = this.providerRepository.manager.getRepository(Job);
      const activeJobs = await jobRepository.count({
        where: [
          { providerId: userId, status: JobStatus.PENDING },
          { providerId: userId, status: JobStatus.ACCEPTED },
          { providerId: userId, status: JobStatus.IN_PROGRESS },
        ],
      });

      if (activeJobs > 0) {
        throw new BadRequestException(
          `Cannot deactivate provider profile. You have ${activeJobs} active job(s). Please complete or cancel them first.`,
        );
      }

      // Delete the provider profile
      await this.providerRepository.remove(provider);
      console.log('[PROVIDERS] Provider profile deleted for user:', {
        userId,
        providerId: provider.id,
        businessName: provider.businessName,
      });

      // Revert user role back to LISTER (unless they're an admin)
      if (user.role === UserRole.SERVICE_PROVIDER) {
        try {
          await this.usersService.updateRole(userId, UserRole.LISTER);
          console.log('[PROVIDERS] User role reverted from SERVICE_PROVIDER to LISTER');
        } catch (roleError) {
          console.warn('[PROVIDERS] Failed to revert user role (non-critical):', roleError.message);
          // Continue anyway - provider is deleted
        }
      } else if (user.role === UserRole.ADMIN) {
        console.log('[PROVIDERS] User is an admin - keeping admin role after provider deactivation');
      }

      return {
        success: true,
        message: 'Provider profile deactivated successfully. Your account has been reverted to lister.',
      };
    } catch (error) {
      console.error('[PROVIDERS] Error deactivating provider profile:', {
        error: error.message,
        stack: error.stack,
        userId,
      });
      throw error;
    }
  }

  async getProvider(id: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  // Document management methods
  async updateIdDocument(providerId: string, documentUrl: string): Promise<Provider> {
    const provider = await this.getProvider(providerId);
    provider.idDocumentUrl = documentUrl;
    return await this.providerRepository.save(provider);
  }

  async addCertification(
    providerId: string,
    certification: {
      name: string;
      issuer: string;
      documentUrl: string;
      isVerified: boolean;
    },
  ): Promise<Provider> {
    const provider = await this.getProvider(providerId);
    
    const certifications = provider.certifications || [];
    certifications.push({
      id: uuidv4(),
      ...certification,
    });

    provider.certifications = certifications;
    return await this.providerRepository.save(provider);
  }

  // Admin management methods
  async verifyProvider(providerId: string): Promise<Provider> {
    const provider = await this.getProvider(providerId);
    provider.isVerified = true;
    provider.isKycVerified = true;
    return await this.providerRepository.save(provider);
  }

  async rejectProvider(providerId: string, reason?: string): Promise<Provider> {
    const provider = await this.getProvider(providerId);
    provider.isVerified = false;
    provider.isKycVerified = false;
    // Store rejection reason if we have a field for it
    // For now, just update the verification status
    return await this.providerRepository.save(provider);
  }

  async suspendProvider(providerId: string, reason?: string, duration?: number): Promise<Provider> {
    const provider = await this.getProvider(providerId);
    // Add suspension fields to entity if needed
    // For now, we'll just set isVerified to false as a simple suspension
    provider.isVerified = false;
    return await this.providerRepository.save(provider);
  }

  async banProvider(providerId: string, reason?: string): Promise<Provider> {
    const provider = await this.getProvider(providerId);
    // Add ban status to entity if needed
    // For now, we'll set both verification flags to false
    provider.isVerified = false;
    provider.isKycVerified = false;
    return await this.providerRepository.save(provider);
  }

  // Verification Request methods
  async createVerificationRequest(
    providerId: string,
    createDto: CreateVerificationRequestDto,
  ): Promise<ProviderVerificationRequest> {
    const provider = await this.getProvider(providerId);

    // Check if there's already a pending request
    const existingPending = await this.verificationRequestRepository.findOne({
      where: {
        providerId,
        status: VerificationRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException('You already have a pending verification request');
    }

    // Validate that at least one document is provided
    if (!createDto.idDocumentUrl && !createDto.businessLicenseUrl && 
        (!createDto.additionalDocuments || createDto.additionalDocuments.length === 0)) {
      throw new BadRequestException('At least one document is required for verification');
    }

    const request = this.verificationRequestRepository.create({
      providerId,
      idDocumentUrl: createDto.idDocumentUrl,
      businessLicenseUrl: createDto.businessLicenseUrl,
      additionalDocuments: createDto.additionalDocuments || [],
      status: VerificationRequestStatus.PENDING,
    });

    const savedRequest = await this.verificationRequestRepository.save(request);

    // Send email notification
    try {
      const user = await this.userRepository.findOne({ where: { id: provider.userId } });
      if (user) {
        await this.emailService.sendVerificationRequestSubmitted(
          user.email,
          `${user.firstName} ${user.lastName}`,
        );
      }
    } catch (error) {
      // Don't fail the request if email fails
      console.error('Failed to send verification request email:', error);
    }

    return savedRequest;
  }

  async getVerificationRequests(
    filters?: {
      status?: VerificationRequestStatus;
      providerId?: string;
    },
  ): Promise<ProviderVerificationRequest[]> {
    const query = this.verificationRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.provider', 'provider')
      .leftJoinAndSelect('provider.user', 'user');

    if (filters?.status) {
      query.where('request.status = :status', { status: filters.status });
    }

    if (filters?.providerId) {
      query.andWhere('request.providerId = :providerId', { providerId: filters.providerId });
    }

    query.orderBy('request.submittedAt', 'DESC');

    return await query.getMany();
  }

  async getVerificationRequest(id: string): Promise<ProviderVerificationRequest> {
    const request = await this.verificationRequestRepository.findOne({
      where: { id },
      relations: ['provider', 'provider.user'],
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    return request;
  }

  async reviewVerificationRequest(
    requestId: string,
    reviewDto: ReviewVerificationRequestDto,
    adminUserId: string,
  ): Promise<ProviderVerificationRequest> {
    const request = await this.getVerificationRequest(requestId);

    if (request.status !== VerificationRequestStatus.PENDING) {
      throw new BadRequestException('This verification request has already been reviewed');
    }

    request.status = reviewDto.status;
    request.reviewedBy = adminUserId;
    request.reviewedAt = new Date();

    if (reviewDto.status === VerificationRequestStatus.REJECTED) {
      if (!reviewDto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required when rejecting a request');
      }
      request.rejectionReason = reviewDto.rejectionReason;
    }

    // If approved, also verify the provider
    if (reviewDto.status === VerificationRequestStatus.APPROVED) {
      const provider = await this.getProvider(request.providerId);
      provider.isVerified = true;
      provider.isKycVerified = true;
      await this.providerRepository.save(provider);

      // Send approval email
      try {
        const user = await this.userRepository.findOne({ where: { id: provider.userId } });
        if (user) {
          await this.emailService.sendVerificationApproved(
            user.email,
            `${user.firstName} ${user.lastName}`,
          );
        }
      } catch (error) {
        console.error('Failed to send verification approval email:', error);
      }
    } else if (reviewDto.status === VerificationRequestStatus.REJECTED) {
      // Send rejection email
      try {
        const provider = await this.getProvider(request.providerId);
        const user = await this.userRepository.findOne({ where: { id: provider.userId } });
        if (user) {
          await this.emailService.sendVerificationRejected(
            user.email,
            `${user.firstName} ${user.lastName}`,
            reviewDto.rejectionReason || 'Your verification request did not meet our requirements.',
          );
        }
      } catch (error) {
        console.error('Failed to send verification rejection email:', error);
      }
    }

    return await this.verificationRequestRepository.save(request);
  }

  async getProviderVerificationRequest(providerId: string): Promise<ProviderVerificationRequest | null> {
    return await this.verificationRequestRepository.findOne({
      where: { providerId },
      relations: ['provider', 'provider.user'],
      order: { submittedAt: 'DESC' },
    });
  }
}