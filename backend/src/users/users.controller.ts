import { Controller, Get, UseGuards, Request, Post, Body, Headers, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ConfigService } from '@nestjs/config';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findOneById(req.user.sub);
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
}
