import { Controller, Get, Post, Body, Query, UseGuards, Request, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProvidersService } from './providers.service';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RegisterProviderCompleteDto } from './dto/register-provider-complete.dto';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  findAll(
    @Query() query: {
      serviceType?: string;
      location?: string;
      search?: string;
      minRating?: string;
      isVerified?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    const filters = {
      serviceType: query.serviceType,
      location: query.location,
      search: query.search,
      minRating: query.minRating ? parseFloat(query.minRating) : undefined,
      isVerified: query.isVerified === 'true' ? true : query.isVerified === 'false' ? false : undefined,
    };
    const page = query.page ? parseInt(query.page) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize) : 12;
    return this.providersService.findAllProviders(filters, page, pageSize);
  }

  @Post('register')
  @UseGuards(AuthGuard('jwt'))
  async register(@Body() registerDto: RegisterProviderDto, @Request() req) {
    try {
      console.log('[PROVIDERS] Registration request received:', {
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        businessName: registerDto.businessName,
        serviceTypes: registerDto.serviceTypes,
        descriptionLength: registerDto.description?.length,
      });
      return await this.providersService.registerProvider(req.user.id, registerDto);
    } catch (error) {
      console.error('[PROVIDERS] Registration error:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        errorName: error.name,
        errorCode: error.code,
        errorResponse: error.response,
      });
      throw error;
    }
  }

  @Post('register-complete')
  async registerComplete(@Body() registerDto: RegisterProviderCompleteDto) {
    try {
      return await this.providersService.registerProviderComplete(registerDto);
    } catch (error) {
      console.error('[PROVIDERS] Complete registration error:', error);
      throw error;
    }
  }

  @Get('nearby')
  @UseGuards(AuthGuard('jwt'))
  findNearby(
    @Query('serviceType') serviceType: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = radius ? parseFloat(radius) : 10;

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid latitude or longitude');
    }

    return this.providersService.findNearbyProviders(
      serviceType,
      latitude,
      longitude,
      radiusKm,
    );
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req) {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new BadRequestException('User ID not found in token');
      }
      
      console.log('[PROVIDERS] Fetching profile for user:', {
        userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
      });
      
      const provider = await this.providersService.getProviderByUserId(userId);
      
      if (!provider) {
        console.log('[PROVIDERS] No provider profile found for user:', userId);
        throw new NotFoundException('Provider profile not found');
      }
      
      return provider;
    } catch (error) {
      console.error('[PROVIDERS] Error fetching profile:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.sub || req.user?.id,
        userEmail: req.user?.email,
      });
      throw error;
    }
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.providersService.getProvider(id);
  }

  @Post('sync-role')
  @UseGuards(AuthGuard('jwt'))
  async syncRole(@Request() req) {
    try {
      // JWT payload uses 'sub' for user ID
      const userId = req.user?.sub || req.user?.id;
      console.log('[PROVIDERS] Sync role request received:', {
        userId: userId,
        userEmail: req.user?.email,
        userObject: req.user,
      });
      
      if (!userId) {
        throw new Error('User ID not found in JWT token');
      }
      
      const result = await this.providersService.syncUserRole(userId);
      console.log('[PROVIDERS] Sync role result:', result);
      return result;
    } catch (error) {
      console.error('[PROVIDERS] Error syncing role:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.sub || req.user?.id,
        userObject: req.user,
      });
      throw error;
    }
  }

  @Post('deactivate')
  @UseGuards(AuthGuard('jwt'))
  async deactivateProvider(@Request() req) {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new BadRequestException('User ID not found in token');
      }

      console.log('[PROVIDERS] Deactivate provider request received:', {
        userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
      });

      return await this.providersService.deactivateProviderProfile(userId);
    } catch (error) {
      console.error('[PROVIDERS] Error deactivating provider:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.sub || req.user?.id,
        userEmail: req.user?.email,
      });
      throw error;
    }
  }
}