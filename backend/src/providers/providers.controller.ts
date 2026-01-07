import { Controller, Get, Post, Body, Query, UseGuards, Request, Param, BadRequestException, NotFoundException, UseInterceptors, UploadedFile, UploadedFiles, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ProvidersService } from './providers.service';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RegisterProviderCompleteDto } from './dto/register-provider-complete.dto';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { ReviewVerificationRequestDto } from './dto/review-verification-request.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { R2Service } from 'src/common/r2.service';
import { File as MulterFile } from 'multer';
import { VerificationRequestStatus } from './entities/provider-verification-request.entity';

@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly r2Service: R2Service,
  ) {}

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
        hasProfilePicture: !!registerDto.profilePicture,
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

  @Post('profile-picture')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('profilePicture'))
  async uploadProfilePicture(
    @UploadedFile() file: MulterFile,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Get provider by userId
    const provider = await this.providersService.getProviderByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found. Please register as a provider first.');
    }

    // Upload to R2
    const url = await this.r2Service.uploadFile(file, 'providers/profile-pictures');

    // Update provider with profile picture URL
    return await this.providersService.updateProfilePicture(userId, url);
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

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Body() updateDto: UpdateProviderProfileDto, @Request() req) {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        throw new BadRequestException('User ID not found in token');
      }

      console.log('[PROVIDERS] Updating profile for user:', {
        userId,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        updateFields: Object.keys(updateDto),
      });

      const updatedProvider = await this.providersService.updateProviderProfile(userId, updateDto);

      console.log('[PROVIDERS] Profile updated successfully:', {
        providerId: updatedProvider.id,
        businessName: updatedProvider.businessName,
      });

      return updatedProvider;
    } catch (error) {
      console.error('[PROVIDERS] Error updating profile:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.sub || req.user?.id,
        userEmail: req.user?.email,
      });
      throw error;
    }
  }


  // Verification Request endpoints (Provider) - Must be before :id route
  @Post('verification-request')
  @UseGuards(AuthGuard('jwt'))
  async createVerificationRequest(
    @Body() createDto: CreateVerificationRequestDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    // Auto-validation: Check that at least one document is provided
    if (!createDto.idDocumentUrl && !createDto.businessLicenseUrl && 
        (!createDto.additionalDocuments || createDto.additionalDocuments.length === 0)) {
      throw new BadRequestException('At least one document is required for verification');
    }

    // Auto-validation: Validate document URLs format
    const urlPattern = /^https?:\/\/.+/;
    if (createDto.idDocumentUrl && !urlPattern.test(createDto.idDocumentUrl)) {
      throw new BadRequestException('Invalid ID document URL format');
    }
    if (createDto.businessLicenseUrl && !urlPattern.test(createDto.businessLicenseUrl)) {
      throw new BadRequestException('Invalid business license URL format');
    }
    if (createDto.additionalDocuments) {
      for (const doc of createDto.additionalDocuments) {
        if (!urlPattern.test(doc.url)) {
          throw new BadRequestException(`Invalid URL format for document: ${doc.name}`);
        }
      }
    }

    // Get provider by userId
    const provider = await this.providersService.getProviderByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return await this.providersService.createVerificationRequest(provider.id, createDto);
  }

  @Get('verification-request')
  @UseGuards(AuthGuard('jwt'))
  async getMyVerificationRequest(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    const provider = await this.providersService.getProviderByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    const request = await this.providersService.getProviderVerificationRequest(provider.id);
    if (!request) {
      throw new NotFoundException('No verification request found');
    }

    return request;
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

  // Document upload endpoints
  @Post(':id/documents/id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('document'))
  async uploadIdDocument(
    @Param('id') providerId: string,
    @UploadedFile() file: MulterFile,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Verify provider belongs to user
    const provider = await this.providersService.getProvider(providerId);
    if (provider.userId !== userId) {
      throw new BadRequestException('You can only upload documents for your own provider profile');
    }

    // Upload to R2
    const url = await this.r2Service.uploadFile(file, 'providers/documents');
    
    // Update provider with ID document URL
    return await this.providersService.updateIdDocument(providerId, url);
  }

  @Post(':id/certifications')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('document'))
  async uploadCertification(
    @Param('id') providerId: string,
    @Body() body: { name: string; issuer: string },
    @UploadedFile() file: MulterFile,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!body.name || !body.issuer) {
      throw new BadRequestException('Certification name and issuer are required');
    }

    // Verify provider belongs to user
    const provider = await this.providersService.getProvider(providerId);
    if (provider.userId !== userId) {
      throw new BadRequestException('You can only upload certifications for your own provider profile');
    }

    // Upload to R2
    const url = await this.r2Service.uploadFile(file, 'providers/certifications');
    
    // Add certification to provider
    return await this.providersService.addCertification(providerId, {
      name: body.name,
      issuer: body.issuer,
      documentUrl: url,
      isVerified: false,
    });
  }

  // Admin provider management endpoints
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch(':id/verify')
  async verifyProvider(@Param('id') providerId: string) {
    return await this.providersService.verifyProvider(providerId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch(':id/reject')
  async rejectProvider(
    @Param('id') providerId: string,
    @Body() body: { reason?: string },
  ) {
    return await this.providersService.rejectProvider(providerId, body.reason);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch(':id/suspend')
  async suspendProvider(
    @Param('id') providerId: string,
    @Body() body: { reason?: string; duration?: number },
  ) {
    return await this.providersService.suspendProvider(providerId, body.reason, body.duration);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch(':id/ban')
  async banProvider(
    @Param('id') providerId: string,
    @Body() body: { reason?: string },
  ) {
    return await this.providersService.banProvider(providerId, body.reason);
  }


  // Admin verification request endpoints
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('admin/verification-requests')
  async getVerificationRequests(
    @Query('status') status?: string,
  ) {
    const filters: any = {};
    if (status && Object.values(VerificationRequestStatus).includes(status as VerificationRequestStatus)) {
      filters.status = status as VerificationRequestStatus;
    }
    return await this.providersService.getVerificationRequests(filters);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('admin/verification-requests/:id')
  async getVerificationRequest(@Param('id') id: string) {
    return await this.providersService.getVerificationRequest(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('admin/verification-requests/:id/review')
  async reviewVerificationRequest(
    @Param('id') id: string,
    @Body() reviewDto: ReviewVerificationRequestDto,
    @Request() req,
  ) {
    const adminUserId = req.user?.sub || req.user?.id;
    if (!adminUserId) {
      throw new BadRequestException('Admin user ID not found in token');
    }

    return await this.providersService.reviewVerificationRequest(id, reviewDto, adminUserId);
  }
}