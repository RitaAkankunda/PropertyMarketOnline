import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { UserRole } from 'src/users/enums/user-role.enum';
import { PropertyAvailabilityBlock } from './entities/property-availability.entity';
import { PropertyView } from './entities/property-view.entity';
import { Booking, BookingStatus, BookingType } from 'src/bookings/entities/booking.entity';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(PropertyAvailabilityBlock)
    private readonly availabilityRepository: Repository<PropertyAvailabilityBlock>,
    @InjectRepository(PropertyView)
    private readonly propertyViewRepository: Repository<PropertyView>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, userId: string) {
    try {
      console.log('[PROPERTIES] Creating property:', {
        title: createPropertyDto.title,
        propertyType: createPropertyDto.propertyType,
        userId,
      });
      
      const property = this.propertyRepository.create({
        ...createPropertyDto,
        ownerId: userId,
      });
      
      console.log('[PROPERTIES] Property entity created, saving to database...');
      const savedProperty = await this.propertyRepository.save(property);
      console.log('[PROPERTIES] Property saved successfully:', savedProperty.id);
      
      return savedProperty;
    } catch (error) {
      console.error('[PROPERTIES] Error creating property:', error);
      console.error('[PROPERTIES] Error details:', {
        message: error.message,
        stack: error.stack,
        createPropertyDto,
        userId,
      });
      throw error;
    }
  }

  async findAll(queryDto: QueryPropertyDto) {
    const {
      propertyType,
      listingType,
      minPrice,
      maxPrice,
      bedrooms,
      page = 1,
      limit = 10,
      north,
      south,
      east,
      west,
      centerLat,
      centerLng,
      radius,
      excludeId,
      city,
    } = queryDto;

    // Build query without owner join for better performance on list views
    // Owner will be loaded only when needed (e.g., in findOne)
    const query = this.propertyRepository
      .createQueryBuilder('property');

    if (propertyType) {
      query.andWhere('property.propertyType = :propertyType', {
        propertyType,
      });
    }

    if (listingType) {
      query.andWhere('property.listingType = :listingType', {
        listingType,
      });
    }

    if (minPrice !== undefined) {
      query.andWhere('property.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('property.price <= :maxPrice', { maxPrice });
    }

    if (bedrooms !== undefined) {
      query.andWhere('property.bedrooms = :bedrooms', { bedrooms });
    }

    // Exclude specific property (for similar properties)
    if (excludeId) {
      query.andWhere('property.id != :excludeId', { excludeId });
    }

    // Filter by city
    if (city) {
      query.andWhere('property.city = :city', { city });
    }

    // Map bounds filtering (for map view)
    if (north !== undefined && south !== undefined && east !== undefined && west !== undefined) {
      query.andWhere('property.latitude IS NOT NULL');
      query.andWhere('property.longitude IS NOT NULL');
      query.andWhere('property.latitude BETWEEN :south AND :north', { south, north });
      query.andWhere('property.longitude BETWEEN :west AND :east', { west, east });
    }

    // Radius-based search (alternative to bounds)
    if (centerLat !== undefined && centerLng !== undefined && radius !== undefined) {
      query.andWhere('property.latitude IS NOT NULL');
      query.andWhere('property.longitude IS NOT NULL');
      
      // Using Haversine formula for distance calculation
      // PostgreSQL with PostGIS would be better, but this works for basic needs
      // For now, we'll use a bounding box approximation
      // 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 111 km * cos(latitude)
      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos((centerLat * Math.PI) / 180));
      
      query.andWhere('property.latitude BETWEEN :minLat AND :maxLat', {
        minLat: centerLat - latDelta,
        maxLat: centerLat + latDelta,
      });
      query.andWhere('property.longitude BETWEEN :minLng AND :maxLng', {
        minLng: centerLng - lngDelta,
        maxLng: centerLng + lngDelta,
      });
    }

    // Add ordering for consistent results
    query.orderBy('property.createdAt', 'DESC');

    // For map view, don't paginate (show all markers in bounds)
    // For list/grid view, apply pagination
    if (!north && !centerLat) {
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);
    }

    // Use getManyAndCount for pagination
    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAvailability(
    propertyId: string,
    from?: string,
    to?: string,
  ): Promise<{
    blocked: PropertyAvailabilityBlock[];
    booked: { bookingId: string; startDate: string; endDate: string; status: BookingStatus }[];
  }> {
    await this.findOne(propertyId);

    const fromDate = from || new Date().toISOString().split('T')[0];
    const toDate = to || new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0];

    const blocked = await this.availabilityRepository
      .createQueryBuilder('block')
      .where('block.propertyId = :propertyId', { propertyId })
      .andWhere('block.startDate <= :toDate', { toDate })
      .andWhere('block.endDate >= :fromDate', { fromDate })
      .orderBy('block.startDate', 'ASC')
      .getMany();

    const booked = await this.bookingRepository
      .createQueryBuilder('booking')
      .select(['booking.id', 'booking.checkInDate', 'booking.checkOutDate', 'booking.status'])
      .where('booking.propertyId = :propertyId', { propertyId })
      .andWhere('booking.type = :type', { type: BookingType.BOOKING })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      })
      .andWhere('booking.checkInDate IS NOT NULL')
      .andWhere('booking.checkOutDate IS NOT NULL')
      .andWhere('booking.checkInDate <= :toDate', { toDate })
      .andWhere('booking.checkOutDate >= :fromDate', { fromDate })
      .orderBy('booking.checkInDate', 'ASC')
      .getMany();

    return {
      blocked,
      booked: booked.map((b) => ({
        bookingId: b.id,
        startDate: b.checkInDate,
        endDate: b.checkOutDate,
        status: b.status,
      })),
    };
  }

  async blockAvailability(
    propertyId: string,
    dto: { startDate: string; endDate: string; reason?: string },
    userId: string,
    userRole: UserRole,
  ) {
    const property = await this.findOne(propertyId);
    if (property.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to block availability for this property');
    }

    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const overlappingBooking = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.propertyId = :propertyId', { propertyId })
      .andWhere('booking.type = :type', { type: BookingType.BOOKING })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      })
      .andWhere('booking.checkInDate <= :endDate', { endDate: dto.endDate })
      .andWhere('booking.checkOutDate >= :startDate', { startDate: dto.startDate })
      .getOne();

    if (overlappingBooking) {
      throw new BadRequestException('Cannot block dates that overlap an existing booking');
    }

    const block = this.availabilityRepository.create({
      propertyId,
      createdById: userId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
    });

    return this.availabilityRepository.save(block);
  }

  async removeAvailabilityBlock(
    propertyId: string,
    blockId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const property = await this.findOne(propertyId);
    if (property.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to remove availability blocks for this property');
    }

    const block = await this.availabilityRepository.findOne({
      where: { id: blockId, propertyId },
    });
    if (!block) {
      throw new NotFoundException('Availability block not found');
    }

    await this.availabilityRepository.remove(block);
    return { message: 'Availability block removed' };
  }

  async findOne(id: string) {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async findByOwnerId(ownerId: string) {
    return await this.propertyRepository.find({
      where: { ownerId },
      relations: ['owner'],
    });
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    userId: string,
    userRole: string,
  ) {
    const property = await this.findOne(id);

    if (property.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own properties');
    }

    await this.propertyRepository.update(id, updatePropertyDto);

    return this.findOne(id);
  }

  async remove(id: string, userId: string, userRole: string) {
    const property = await this.findOne(id);

    if (property.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own properties');
    }

    await this.propertyRepository.delete(id);

    return { message: 'Property deleted successfully' };
  }

  async getTotalCount(): Promise<number> {
    return await this.propertyRepository.count();
  }

  async getActiveListingsCount(): Promise<number> {
    // For now, all properties are considered active
    // In the future, you might add a status field
    return await this.propertyRepository.count();
  }

  async getRecentProperties(limit: number = 10): Promise<Property[]> {
    return await this.propertyRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async recordView(
    propertyId: string,
    options?: {
      viewerId?: string;
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
      sessionId?: string;
    },
  ): Promise<void> {
    // Increment the counter on the property (for quick access)
    await this.propertyRepository.increment(
      { id: propertyId },
      'views',
      1,
    );

    // Also record detailed view in property_views table for analytics
    try {
      const view = this.propertyViewRepository.create({
        propertyId,
        viewerId: options?.viewerId || null,
        ipAddress: options?.ipAddress || null,
        userAgent: options?.userAgent || null,
        referrer: options?.referrer || null,
        sessionId: options?.sessionId || null,
      });
      await this.propertyViewRepository.save(view);
    } catch (error) {
      // Don't fail the view if analytics recording fails
      console.error('[PROPERTIES] Failed to record view analytics:', error.message);
    }
  }

  // Get view statistics for a property
  async getViewStats(propertyId: string, days: number = 7): Promise<{
    total: number;
    byDay: { date: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get total views from property_views table for the period
    const total = await this.propertyViewRepository.count({
      where: {
        propertyId,
        createdAt: new Date(startDate) as any, // TypeORM will handle >= comparison
      },
    });

    // Get views grouped by day
    const viewsByDay = await this.propertyViewRepository
      .createQueryBuilder('view')
      .select("DATE(view.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('view.propertyId = :propertyId', { propertyId })
      .andWhere('view.createdAt >= :startDate', { startDate })
      .groupBy("DATE(view.createdAt)")
      .orderBy("DATE(view.createdAt)", 'ASC')
      .getRawMany();

    return {
      total,
      byDay: viewsByDay.map((row) => ({
        date: row.date,
        count: parseInt(row.count, 10),
      })),
    };
  }

  // Get view statistics for all properties owned by a user
  async getOwnerViewStats(ownerId: string, days: number = 7): Promise<{
    totalViews: number;
    byDay: { date: string; views: number }[];
    byProperty: { propertyId: string; title: string; views: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all properties for this owner
    const properties = await this.propertyRepository.find({
      where: { ownerId },
      select: ['id', 'title'],
    });

    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return {
        totalViews: 0,
        byDay: [],
        byProperty: [],
      };
    }

    // Get total views
    const totalViews = await this.propertyViewRepository
      .createQueryBuilder('view')
      .where('view.propertyId IN (:...propertyIds)', { propertyIds })
      .andWhere('view.createdAt >= :startDate', { startDate })
      .getCount();

    // Get views by day
    const viewsByDay = await this.propertyViewRepository
      .createQueryBuilder('view')
      .select("DATE(view.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('view.propertyId IN (:...propertyIds)', { propertyIds })
      .andWhere('view.createdAt >= :startDate', { startDate })
      .groupBy("DATE(view.createdAt)")
      .orderBy("DATE(view.createdAt)", 'ASC')
      .getRawMany();

    // Get views by property
    const viewsByProperty = await this.propertyViewRepository
      .createQueryBuilder('view')
      .select('view.propertyId', 'propertyId')
      .addSelect('COUNT(*)', 'count')
      .where('view.propertyId IN (:...propertyIds)', { propertyIds })
      .andWhere('view.createdAt >= :startDate', { startDate })
      .groupBy('view.propertyId')
      .getRawMany();

    // Map property titles
    const propertyMap = new Map(properties.map((p) => [p.id, p.title]));

    return {
      totalViews,
      byDay: viewsByDay.map((row) => ({
        date: row.date,
        views: parseInt(row.count, 10),
      })),
      byProperty: viewsByProperty.map((row) => ({
        propertyId: row.propertyId,
        title: propertyMap.get(row.propertyId) || 'Unknown',
        views: parseInt(row.count, 10),
      })),
    };
  }
}
