import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { UserRole } from 'src/users/enums/user-role.enum';
import { User } from 'src/users/entities/user.entity';
import { EmailVerificationService } from 'src/common/email-verification.service';
import { EmailValidationService } from 'src/common/email-validation.service';
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
    private readonly emailVerificationService: EmailVerificationService,
    private readonly emailValidationService: EmailValidationService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    // Prevent admin role from being created via public registration
    if (createUserDto.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin role cannot be assigned during registration');
    }

    // Validate email format and check for disposable domains
    this.emailValidationService.validateEmailOrThrow(createUserDto.email);

    const user = await this.usersService.create(createUserDto);

    // Send verification email
    try {
      await this.emailVerificationService.sendVerificationEmail(user);
    } catch (error) {
      console.error('[AUTH] Failed to send verification email:', error);
      // Log error but don't fail signup - user can resend later
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;

    return {
      accessToken,
      user: result,
      requiresEmailVerification: !user.isEmailVerified,
      message: 'Account created successfully. Please check your email to verify your address.',
    };
  }

  async login(loginDto: LoginDto) {
    console.log(`[AUTH] Login attempt for email: ${loginDto.email}`);
    
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user) {
      console.log(`[AUTH] User not found: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[AUTH] User found: ${user.email}, has password: ${!!user.password}`);

    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      console.log(`[AUTH] User ${user.email} has no password (likely OAuth user)`);
      throw new UnauthorizedException('Invalid credentials. Please use the OAuth provider you registered with.');
    }

    const isPasswordMatching = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordMatching) {
      console.log(`[AUTH] Password mismatch for user: ${user.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[AUTH] Login successful for user: ${user.email}`);

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
        role: UserRole.LISTER, // Default role for OAuth users (can list properties)
      });
    } else {
      // Update existing user: upgrade from old roles (buyer, renter) to lister
      // so they can access the dashboard
      if (user.role === UserRole.BUYER || user.role === UserRole.RENTER) {
        console.log(`[OAUTH] Upgrading user ${user.email} from ${user.role} to LISTER`);
        user = await this.usersService.updateRole(user.id, UserRole.LISTER);
      }
      
      // Update OAuth provider info if missing
      if (!user.provider || !user.providerId) {
        user = await this.usersService.updateOAuthProvider(
          user.id,
          oauthUser.provider,
          oauthUser.providerId
        );
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;

    return {
      accessToken,
      user: result,
    };
  }

  async generateAccessToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.signAsync(payload);
  }
}
