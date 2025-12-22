import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class ProvidersService {
  constructor(private readonly usersService: UsersService) {}

  async findAllProviders() {
    // Assuming UsersService has a method to find by roles
    // If not, we can add it or filter here
    // For now, return users with PROPERTY_MANAGER or LISTER roles
    return this.usersService.findByRoles([UserRole.PROPERTY_MANAGER, UserRole.LISTER]);
  }
}