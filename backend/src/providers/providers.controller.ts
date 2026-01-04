import { Controller, Get, Post, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
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
        errorName: error.name,
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.providersService.getProvider(id);
  }
}