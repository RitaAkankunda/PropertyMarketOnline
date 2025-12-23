import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthGuard } from './guards';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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
