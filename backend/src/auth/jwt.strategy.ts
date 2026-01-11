import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('[JWT STRATEGY] Validating payload:', payload);
    // Include both sub and id for consistency (id = sub)
    const user = { 
      sub: payload.sub, 
      id: payload.sub, // Add id as alias of sub for consistency
      email: payload.email, 
      role: payload.role 
    };
    console.log('[JWT STRATEGY] Returning user:', user);
    return user;
  }
}
