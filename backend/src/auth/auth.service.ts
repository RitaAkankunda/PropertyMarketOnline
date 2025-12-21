import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { UserRole } from 'src/users/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

export interface OAuthUserData {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  provider: string;
  providerId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;

    return {
      accessToken,
      user: result,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;

    return {
      accessToken,
      user: result,
    };
  }

  async validateOAuthUser(oauthUser: OAuthUserData) {
    // Check if user already exists
    let user = await this.usersService.findOneByEmail(oauthUser.email);

    if (!user) {
      // Create new user from OAuth data
      user = await this.usersService.createOAuthUser({
        email: oauthUser.email,
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        provider: oauthUser.provider,
        providerId: oauthUser.providerId,
        role: UserRole.BUYER, // Default role for OAuth users
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;

    return {
      accessToken,
      user: result,
    };
  }
}
