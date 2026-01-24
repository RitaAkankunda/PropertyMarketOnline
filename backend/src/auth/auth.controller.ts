import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res, Query, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthGuard } from './guards';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { EmailVerificationService } from 'src/common/email-verification.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Query('email') email: string,
  ) {
    if (!token || !email) {
      throw new BadRequestException('Verification token and email are required');
    }

    const user = await this.emailVerificationService.verifyEmailWithToken(token, email);
    
    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }

    await this.emailVerificationService.resendVerificationEmail(body.email);
    
    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('verification-status')
  async getVerificationStatus(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new BadRequestException('User ID is required');
    }

    const status = await this.emailVerificationService.getEmailVerificationStatus(body.userId);
    
    return status;
  }

  // Google OAuth
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      const { accessToken, user } = req.user;
      
      // Force frontend URL to be localhost:3000 (frontend port)
      // Don't use FRONTEND_URL env var as it might be wrong
      const frontendUrl = 'http://localhost:3000';
      
      console.log('[GOOGLE OAUTH] Callback received, redirecting to frontend:', {
        frontendUrl,
        hasToken: !!accessToken,
        userId: user?.id,
        tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'none',
      });
      
      // Redirect to frontend with token
      const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(accessToken)}&provider=google`;
      console.log('[GOOGLE OAUTH] Redirect URL:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[GOOGLE OAUTH] Error in callback:', error);
      const frontendUrl = 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
    }
  }
}
