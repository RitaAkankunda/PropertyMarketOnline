import { Controller, Get, UseGuards, Request, Post, Body, Headers, UnauthorizedException, NotFoundException, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import { PropertiesService } from 'src/properties/properties.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly propertiesService: PropertiesService,
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
    const totalUsers = await this.usersService.getTotalUsersCount();
    const totalListers = await this.usersService.getUsersByRole(UserRole.LISTER);
    const totalPropertyManagers = await this.usersService.getUsersByRole(UserRole.PROPERTY_MANAGER);
    const totalBuyers = await this.usersService.getUsersByRole(UserRole.BUYER);
    const totalRenters = await this.usersService.getUsersByRole(UserRole.RENTER);

    // Get properties stats
    const totalProperties = await this.propertiesService.getTotalCount();
    const activeListings = await this.propertiesService.getActiveListingsCount();

    return {
      totalUsers,
      totalProviders: totalListers + totalPropertyManagers, // Service providers are listers + property managers
      pendingVerifications: 0, // TODO: Implement verification system
      totalProperties,
      revenue: 0, // TODO: Implement revenue tracking
      activeListings,
      totalListers,
      totalPropertyManagers,
      totalBuyers,
      totalRenters,
    };
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

}
