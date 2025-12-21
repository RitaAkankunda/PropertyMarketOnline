import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID'),
      teamID: configService.get<string>('APPLE_TEAM_ID'),
      keyID: configService.get<string>('APPLE_KEY_ID'),
      privateKeyString: configService.get<string>('APPLE_PRIVATE_KEY'),
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL') || 'http://localhost:3000/auth/apple/callback',
      scope: ['name', 'email'],
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
    done: Function,
  ): Promise<any> {
    // Apple only sends name on first login, so we need to handle that
    const user = {
      email: idToken.email,
      firstName: profile?.name?.firstName || 'Apple',
      lastName: profile?.name?.lastName || 'User',
      provider: 'apple',
      providerId: idToken.sub,
    };

    const result = await this.authService.validateOAuthUser(user);
    done(null, result);
  }
}
