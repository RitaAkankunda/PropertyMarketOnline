import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RegisterProviderCompleteDto } from './dto/register-provider-complete.dto';
import { User } from '../users/entities/user.entity';
import { Provider } from './entities/provider.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
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
      const user = await this.usersService.findOneById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if provider already exists
      const existingProvider = await this.providerRepository.findOne({
        where: { userId },
      });

      if (existingProvider) {
        // Update existing provider
        Object.assign(existingProvider, {
          businessName: registerDto.businessName.trim(),
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

      // Update user role to PROPERTY_MANAGER if not already a provider
      // Note: LISTER role can also be a provider, so we don't change their role
      if (user.role !== UserRole.PROPERTY_MANAGER && user.role !== UserRole.LISTER) {
        try {
          await this.usersService.updateRole(userId, UserRole.PROPERTY_MANAGER);
        } catch (roleError) {
          console.warn('[PROVIDERS] Failed to update user role, continuing with provider creation:', roleError.message);
          // Continue with provider creation even if role update fails
        }
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
      if (existingUser) {
        throw new BadRequestException('An account with this email already exists. Please login instead.');
      }

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

      // Create user account with PROPERTY_MANAGER role
      console.log('[PROVIDERS] Creating new user account:', {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
      
      const user = await this.usersService.create({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role: UserRole.PROPERTY_MANAGER,
      });

      if (!user || !user.id) {
        throw new BadRequestException('Failed to create user account');
      }
      
      console.log('[PROVIDERS] New user created:', {
        userId: user.id,
        email: user.email,
      });
      
      // Double-check: Verify no provider exists for this new user (shouldn't happen, but safety check)
      const checkExistingProvider = await this.providerRepository.findOne({
        where: { userId: user.id },
      });
      
      if (checkExistingProvider) {
        console.error('[PROVIDERS] ERROR: Provider already exists for newly created user!', {
          userId: user.id,
          providerId: checkExistingProvider.id,
        });
        // This should never happen, but if it does, we should handle it
        throw new BadRequestException('Provider already exists for this user. This should not happen.');
      }

      // Check if provider already exists for this user (shouldn't happen, but safety check)
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
}