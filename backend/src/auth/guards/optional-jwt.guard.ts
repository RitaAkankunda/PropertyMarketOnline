import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * OptionalJwtGuard - Allows both authenticated and guest users
 * 
 * This guard will:
 * - If a valid JWT token is present: populate req.user with the user data
 * - If no token or invalid token: allow the request through with req.user = null
 * 
 * Use this for endpoints that need to work for both guests and logged-in users,
 * like creating bookings/inquiries where we want to capture the user ID if logged in.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  // Override canActivate to not throw on missing/invalid token
  canActivate(context: ExecutionContext) {
    // Call the parent's canActivate, which will try to authenticate
    return super.canActivate(context);
  }

  // Override handleRequest to not throw when there's no user
  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext): TUser {
    // If there's a user, return it
    // If there's no user or an error, return null instead of throwing
    if (err || !user) {
      // Log for debugging but don't throw
      console.log('[OPTIONAL JWT] No valid token or user found - allowing as guest');
      return null as TUser;
    }
    
    console.log('[OPTIONAL JWT] Valid token found - user authenticated:', {
      id: user.sub || user.id,
      email: user.email,
    });
    
    return user;
  }
}
