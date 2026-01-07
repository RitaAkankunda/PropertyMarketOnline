import { Controller, Get, UseGuards, Request, Post, Body, Headers, UnauthorizedException, NotFoundException, Patch, Param, Delete, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import { PropertiesService } from 'src/properties/properties.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from 'src/providers/entities/provider.entity';
import { ProviderVerificationRequest, VerificationRequestStatus } from 'src/providers/entities/provider-verification-request.entity';
import { R2Service } from 'src/common/r2.service';
import { File as MulterFile } from 'multer';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly propertiesService: PropertiesService,
    private readonly r2Service: R2Service,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(ProviderVerificationRequest)
    private readonly verificationRequestRepository: Repository<ProviderVerificationRequest>,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findOneById(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard/activities')
  async getDashboardActivities(@Request() req) {
    const userId = req.user.sub;
    return this.usersService.getDashboardActivities(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard/appointments')
  async getDashboardAppointments(@Request() req) {
    const userId = req.user.sub;
    return this.usersService.getDashboardAppointments(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.sub, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
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

    // Upload to R2
    const url = await this.r2Service.uploadFile(file, 'users/avatars');

    // Update user with avatar URL
    const user = await this.usersService.update(userId, { avatar: url });

    return {
      avatar: user.avatar,
      message: 'Avatar uploaded successfully',
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('admin/ping')
  adminPing() {
    return { ok: true, scope: 'admin' };
  }

  @Post('admin/seed')
  async seedAdmin(
    @Body('email') email: string,
    @Headers('x-seed-token') seedToken: string,
  ) {
    const expected = this.configService.get<string>('ADMIN_SEED_TOKEN');
    if (!expected || seedToken !== expected) {
      throw new UnauthorizedException('Invalid seed token');
    }
    const user = await this.usersService.promoteToAdminByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { ok: true, email: user.email, role: user.role };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('admin/stats')
  async getAdminStats() {
    try {
      console.log('[ADMIN STATS] Fetching admin statistics...');
      
      const totalUsers = await this.usersService.getTotalUsersCount();
      console.log('[ADMIN STATS] Total users:', totalUsers);
      
      const totalListers = await this.usersService.getUsersByRole(UserRole.LISTER);
      console.log('[ADMIN STATS] Total listers:', totalListers);
      
      const totalPropertyManagers = await this.usersService.getUsersByRole(UserRole.PROPERTY_MANAGER);
      console.log('[ADMIN STATS] Total property managers:', totalPropertyManagers);
      
      // Count providers from the providers table (not from user roles)
      // This is more accurate since users with provider profiles may not have SERVICE_PROVIDER role yet
      const totalServiceProviders = await this.providerRepository.count();
      console.log('[ADMIN STATS] Total service providers (from providers table):', totalServiceProviders);
      
      const totalBuyers = await this.usersService.getUsersByRole(UserRole.BUYER);
      console.log('[ADMIN STATS] Total buyers:', totalBuyers);
      
      const totalRenters = await this.usersService.getUsersByRole(UserRole.RENTER);
      console.log('[ADMIN STATS] Total renters:', totalRenters);

      // Get properties stats
      console.log('[ADMIN STATS] Fetching property statistics...');
      const totalProperties = await this.propertiesService.getTotalCount();
      console.log('[ADMIN STATS] Total properties:', totalProperties);
      
      const activeListings = await this.propertiesService.getActiveListingsCount();
      console.log('[ADMIN STATS] Active listings:', activeListings);

      // Get pending verification requests count
      console.log('[ADMIN STATS] Fetching pending verification requests...');
      const pendingVerifications = await this.verificationRequestRepository.count({
        where: { status: VerificationRequestStatus.PENDING },
      });
      console.log('[ADMIN STATS] Pending verifications:', pendingVerifications);

      const stats = {
        totalUsers,
        totalProviders: totalServiceProviders, // Service providers with dedicated role
        pendingVerifications, // Real count from database
        totalProperties,
        revenue: 0, // TODO: Implement revenue tracking
        activeListings,
        totalListers,
        totalPropertyManagers,
        totalServiceProviders,
        totalBuyers,
        totalRenters,
      };

      console.log('[ADMIN STATS] Statistics compiled successfully:', stats);
      return stats;
    } catch (error) {
      console.error('[ADMIN STATS] Error fetching admin statistics:', {
        message: error.message,
        stack: error.stack,
        error: error,
      });
      throw error;
    }
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('admin/users')
  async getAllUsers() {
    const users = await this.usersService.getAllUsers();
    return users;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('admin/users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    const updatedUser = await this.usersService.updateRole(id, role);
    return updatedUser;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('admin/users')
  async createAdminUser(@Body() createUserDto: CreateUserDto) {
    // Force the role to admin for this endpoint
    const adminUserDto = { ...createUserDto, role: UserRole.ADMIN };
    const user = await this.usersService.create(adminUserDto);
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Delete('admin/users/:id')
  async deleteUser(
    @Param('id') id: string,
    @Request() req,
  ) {
    await this.usersService.deleteUser(id, req.user.sub);
    return { message: 'User deleted successfully' };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('admin/activities')
  async getAdminActivities() {
    // Ensure timezone is UTC for this request
    try {
      await this.providerRepository.manager.query("SET timezone = 'UTC'");
    } catch (error) {
      console.warn('[ADMIN ACTIVITIES] Failed to set timezone:', error.message);
    }
    
    return this.usersService.getAdminActivities();
  }

}
