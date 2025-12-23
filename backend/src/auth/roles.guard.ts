import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('[ROLES GUARD] Required roles:', requiredRoles);

    if (!requiredRoles || requiredRoles.length === 0) {
      console.log('[ROLES GUARD] No roles required, allowing access');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    console.log('[ROLES GUARD] User from request:', user);
    
    if (!user || !user.role) {
      console.error('[ROLES GUARD] Missing user or role. User:', user);
      throw new ForbiddenException('Missing role');
    }

    const isAllowed = requiredRoles.includes(user.role);
    console.log('[ROLES GUARD] User role:', user.role, 'Required:', requiredRoles, 'Allowed:', isAllowed);
    
    if (!isAllowed) {
      console.error('[ROLES GUARD] Insufficient role. User role:', user.role, 'Required:', requiredRoles);
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
