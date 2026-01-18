import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import { PropertiesService } from 'src/properties/properties.service';
import { Booking, BookingType, BookingStatus } from 'src/bookings/entities/booking.entity';
import { Property } from 'src/properties/entities/property.entity';
import { PropertyView } from 'src/properties/entities/property-view.entity';

export interface CreateOAuthUserDto {
  email: string;
  firstName: string;
  lastName: string;
  provider: string;
  providerId: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly propertiesService: PropertiesService,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(PropertyView)
    private readonly propertyViewRepository: Repository<PropertyView>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists. Please login instead.');
    }

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async createOAuthUser(oauthUserDto: CreateOAuthUserDto): Promise<User> {
    const user = this.userRepository.create({
      email: oauthUserDto.email,
      firstName: oauthUserDto.firstName,
      lastName: oauthUserDto.lastName,
      provider: oauthUserDto.provider,
      providerId: oauthUserDto.providerId,
      role: oauthUserDto.role,
    });
    return await this.userRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    // Ensure isVerified has a default value if null/undefined
    if (user && (user.isVerified === undefined || user.isVerified === null)) {
      user.isVerified = false;
    }
    return user;
  }

  async findOneById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    // Ensure isVerified has a default value if null/undefined
    if (user && (user.isVerified === undefined || user.isVerified === null)) {
      user.isVerified = false;
    }
    return user;
  }

  async promoteToAdminByEmail(email: string): Promise<User | null> {
    const user = await this.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = UserRole.ADMIN;
    return await this.userRepository.save(user);
  }

  async findByRoles(roles: UserRole[]): Promise<User[]> {
    return await this.userRepository.find({ where: { role: roles as any } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Don't allow updating email or role through this endpoint
    const { email, role, ...updateData } = updateUserDto;
    
    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return await this.userRepository.save(user);
  }

  async updateOAuthProvider(id: string, provider: string, providerId: string): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.provider = provider;
    user.providerId = providerId;
    return await this.userRepository.save(user);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTotalUsersCount(): Promise<number> {
    return await this.userRepository.count();
  }

  async getUsersByRole(role: UserRole): Promise<number> {
    return await this.userRepository.count({ where: { role } });
  }

  async deleteUser(id: string, currentUserId: string): Promise<void> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent users from deleting themselves
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Optional: Prevent deleting other admins (uncomment if needed)
    // if (user.role === UserRole.ADMIN) {
    //   throw new ForbiddenException('Cannot delete admin users');
    // }

    // Note: Due to foreign key constraints, related data (properties, payments)
    // should be handled by database CASCADE or manually deleted first
    await this.userRepository.remove(user);
  }

  async getDashboardActivities(userId: string) {
    // Get user's properties to track activities
    const { Property } = await import('src/properties/entities/property.entity');
    const propertyRepository = this.userRepository.manager.getRepository(Property);
    const properties = await propertyRepository.find({
      where: { ownerId: userId },
      order: { updatedAt: 'DESC' },
      take: 10,
    });

    const activities = [];

    // Generate activities from properties
    for (const property of properties) {
      // Property created activity (show recent listings)
      if (property.createdAt) {
        const daysSinceCreated = Math.floor(
          (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreated <= 30) {
          activities.push({
            id: `created-${property.id}`,
            type: 'verification',
            message: `Property "${property.title}" was listed`,
            time: this.formatTimeAgo(property.createdAt),
            read: false,
          });
        }
      }

      // Property updated activity
      if (property.updatedAt && property.updatedAt.getTime() !== property.createdAt.getTime()) {
        const daysSinceUpdated = Math.floor(
          (Date.now() - new Date(property.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceUpdated <= 7) {
          activities.push({
            id: `updated-${property.id}`,
            type: 'inquiry',
            message: `Property "${property.title}" was updated`,
            time: this.formatTimeAgo(property.updatedAt),
            read: false,
          });
        }
      }
    }

    // Sort by most recent (newest first)
    // We'll sort by the property's updatedAt/createdAt timestamp
    activities.sort((a, b) => {
      // Extract timestamp from activity ID (created-{id} or updated-{id})
      // For proper sorting, we should compare the actual property dates
      // For now, reverse order since properties are already sorted by updatedAt DESC
      return 0; // Properties are already sorted, activities maintain that order
    });

    return activities.slice(0, 10); // Return last 10 activities
  }

  async getDashboardAppointments(userId: string) {
    // For now, return empty array - appointments would be in a separate table
    // This is a placeholder for future appointment system
    return [];
  }

  async getAdminActivities() {
    // Ensure timezone is set to UTC for this query
    try {
      await this.userRepository.manager.query("SET timezone = 'UTC'");
    } catch (error) {
      console.warn('[GET ADMIN ACTIVITIES] Failed to set timezone:', error.message);
    }
    
    const activities: Array<{
      id: string;
      type: 'user' | 'property' | 'verification';
      message: string;
      time: string;
      status: 'active' | 'pending' | 'approved';
      timestamp: Date;
    }> = [];

    // Get recent users (last 10)
    const recentUsers = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    for (const user of recentUsers) {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreated <= 7) {
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          message: `New user registration: ${user.firstName} ${user.lastName} (${user.email})`,
          time: this.formatTimeAgo(user.createdAt),
          status: 'active',
          timestamp: user.createdAt,
        });
      }
    }

    // Get recent properties (last 10)
    const recentProperties = await this.propertiesService.getRecentProperties(10);
    for (const property of recentProperties) {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreated <= 7) {
        activities.push({
          id: `property-${property.id}`,
          type: 'property',
          message: `New property listing: ${property.title}`,
          time: this.formatTimeAgo(property.createdAt),
          status: 'active',
          timestamp: property.createdAt,
        });
      }
    }

    // Get recent providers (last 10)
    const { Provider } = await import('src/providers/entities/provider.entity');
    const providerRepository = this.userRepository.manager.getRepository(Provider);
    const recentProviders = await providerRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    for (const provider of recentProviders) {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(provider.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreated <= 7 && provider.user) {
        activities.push({
          id: `provider-${provider.id}`,
          type: 'verification',
          message: `New service provider registration: ${provider.businessName || provider.user.firstName + ' ' + provider.user.lastName}`,
          time: this.formatTimeAgo(provider.createdAt),
          status: 'pending',
          timestamp: provider.createdAt,
        });
      }
    }

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => {
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Remove timestamp before returning (not needed in frontend)
    return activities.slice(0, 10).map(({ timestamp, ...activity }) => activity);
  }

  private formatTimeAgo(date: Date | string): string {
    // Ensure we're working with Date objects
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    // Get current time in UTC milliseconds
    const nowMs = Date.now(); // This is always UTC
    
    // Get the date's UTC milliseconds
    // getTime() returns UTC milliseconds regardless of the date's timezone
    const dateMs = dateObj.getTime();
    
    // Calculate difference in milliseconds
    // This should be correct since both are in UTC milliseconds
    const diffMs = nowMs - dateMs;
    
    // Debug logging to help diagnose timezone issues (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[TIME CALC DEBUG]', {
        nowUTC: new Date(nowMs).toISOString(),
        dateUTC: new Date(dateMs).toISOString(),
        dateLocal: dateObj.toString(),
        dateValue: date,
        diffMs,
        diffMins: Math.floor(diffMs / 60000),
        diffHours: Math.floor(diffMs / 3600000),
      });
    }
    
    // If negative or zero, it's in the future or just now
    if (diffMs <= 0) return 'Just now';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return dateObj.toLocaleDateString();
  }

  async getDashboardAnalytics(userId: string) {
    // Get user's properties
    const properties = await this.propertyRepository.find({
      where: { ownerId: userId },
    });

    const totalProperties = properties.length;

    // Calculate total views from actual view counts on properties
    const totalViews = properties.reduce((sum, property) => {
      return sum + (property.views || 0);
    }, 0);

    // Get bookings for user's properties (inquiries/messages)
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.property', 'property')
      .where('property.ownerId = :userId', { userId })
      .getMany();

    // Calculate total messages (inquiries count as messages)
    const totalMessages = bookings.filter(
      (b) => b.type === BookingType.INQUIRY,
    ).length;

    // Calculate revenue from completed bookings with completed payments
    const completedBookings = bookings.filter(
      (b) =>
        b.status === BookingStatus.COMPLETED &&
        b.paymentStatus === 'completed',
    );

    const revenue = completedBookings.reduce((sum, booking) => {
      return sum + (Number(booking.paymentAmount) || 0);
    }, 0);

    // Calculate change percentages (comparing last 30 days vs previous 30 days)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Calculate views change from properties created in last 30 days vs previous 30 days
    // We'll use a simple approach: compare properties created in each period
    // For more accurate tracking, you'd want a property_views table with timestamps
    const recentPropertiesViews = properties
      .filter((p) => new Date(p.createdAt) >= last30Days)
      .reduce((sum, p) => sum + (p.views || 0), 0);
    const previousPropertiesViews = properties
      .filter(
        (p) =>
          new Date(p.createdAt) >= previous30Days &&
          new Date(p.createdAt) < last30Days,
      )
      .reduce((sum, p) => sum + (p.views || 0), 0);

    const viewsChange =
      previousPropertiesViews > 0
        ? (((recentPropertiesViews - previousPropertiesViews) /
            previousPropertiesViews) *
            100).toFixed(1)
        : recentPropertiesViews > 0
          ? '100'
          : '0';

    // Calculate messages change (inquiries in last 30 days vs previous 30 days)
    const recentBookings = bookings.filter(
      (b) => new Date(b.createdAt) >= last30Days,
    );
    const previousBookings = bookings.filter(
      (b) =>
        new Date(b.createdAt) >= previous30Days &&
        new Date(b.createdAt) < last30Days,
    );

    const recentMessages = recentBookings.filter(
      (b) => b.type === BookingType.INQUIRY,
    ).length;
    const previousMessages = previousBookings.filter(
      (b) => b.type === BookingType.INQUIRY,
    ).length;

    const messagesChange =
      previousMessages > 0
        ? (((recentMessages - previousMessages) / previousMessages) * 100).toFixed(1)
        : recentMessages > 0
          ? '100'
          : '0';

    const recentProperties = properties.filter(
      (p) => new Date(p.createdAt) >= last30Days,
    ).length;
    const previousProperties = properties.filter(
      (p) =>
        new Date(p.createdAt) >= previous30Days &&
        new Date(p.createdAt) < last30Days,
    ).length;

    const propertyChange =
      previousProperties > 0
        ? (((recentProperties - previousProperties) / previousProperties) * 100).toFixed(1)
        : recentProperties > 0
          ? '100'
          : '0';

    const recentRevenue = completedBookings
      .filter((b) => new Date(b.createdAt) >= last30Days)
      .reduce((sum, booking) => sum + (Number(booking.paymentAmount) || 0), 0);
    const previousRevenue = completedBookings
      .filter(
        (b) =>
          new Date(b.createdAt) >= previous30Days &&
          new Date(b.createdAt) < last30Days,
      )
      .reduce((sum, booking) => sum + (Number(booking.paymentAmount) || 0), 0);

    const revenueChange =
      previousRevenue > 0
        ? (((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
        : recentRevenue > 0
          ? '100'
          : '0';

    // Generate chart data for the last 7 days using REAL view data from property_views table
    const last7Days: { date: string; views: number; bookings: number; revenue: number }[] = [];
    const propertyIds = properties.map((p) => p.id);

    // Get real views from property_views table grouped by day
    let viewsByDay: { date: string; count: string }[] = [];
    if (propertyIds.length > 0) {
      try {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        viewsByDay = await this.propertyViewRepository
          .createQueryBuilder('view')
          .select("TO_CHAR(view.createdAt, 'YYYY-MM-DD')", 'date')
          .addSelect('COUNT(*)', 'count')
          .where('view.propertyId IN (:...propertyIds)', { propertyIds })
          .andWhere('view.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
          .groupBy("TO_CHAR(view.createdAt, 'YYYY-MM-DD')")
          .orderBy("TO_CHAR(view.createdAt, 'YYYY-MM-DD')", 'ASC')
          .getRawMany();
      } catch (error) {
        console.log('[ANALYTICS] property_views table may not exist yet:', error.message);
      }
    }

    // Create a map for quick lookup
    const viewsMap = new Map(viewsByDay.map((v) => [v.date, parseInt(v.count, 10)]));

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // Count bookings created on this day
      const dayBookings = bookings.filter((b) => {
        const createdAt = new Date(b.createdAt);
        return createdAt >= dayStart && createdAt < dayEnd;
      });

      // Calculate revenue for this day
      const dayRevenue = dayBookings
        .filter((b) => b.status === BookingStatus.COMPLETED && b.paymentStatus === 'completed')
        .reduce((sum, b) => sum + (Number(b.paymentAmount) || 0), 0);

      // Get real views from property_views table (or fallback to estimate if table is empty)
      let dayViews = viewsMap.get(dateStr) || 0;
      
      // If no tracked views yet, show a small approximation based on total property views
      // This handles the transition period before we have tracking data
      if (viewsByDay.length === 0 && totalViews > 0) {
        dayViews = Math.round(totalViews / 7);
      }

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        views: dayViews,
        bookings: dayBookings.length,
        revenue: dayRevenue,
      });
    }

    // Property performance data (views per property)
    const propertyPerformance = properties
      .map((p) => ({
        id: p.id,
        title: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
        views: p.views || 0,
        type: p.propertyType,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5); // Top 5 properties

    // Booking breakdown by type
    const bookingsByType = {
      inquiries: bookings.filter((b) => b.type === BookingType.INQUIRY).length,
      viewings: bookings.filter((b) => b.type === BookingType.VIEWING).length,
      bookings: bookings.filter((b) => b.type === BookingType.BOOKING).length,
    };

    // Booking status breakdown
    const bookingsByStatus = {
      pending: bookings.filter((b) => b.status === BookingStatus.PENDING).length,
      confirmed: bookings.filter((b) => b.status === BookingStatus.CONFIRMED).length,
      completed: bookings.filter((b) => b.status === BookingStatus.COMPLETED).length,
      cancelled: bookings.filter((b) => b.status === BookingStatus.CANCELLED).length,
    };

    return {
      totalProperties,
      totalViews,
      totalMessages,
      revenue,
      propertyChange: `${propertyChange}%`,
      viewsChange: `${viewsChange}%`,
      messagesChange: `${messagesChange}`,
      // Chart data
      chartData: {
        last7Days,
        propertyPerformance,
        bookingsByType,
        bookingsByStatus,
      },
      revenueChange: `${revenueChange}%`,
    };
  }

}
