import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { UserRole } from 'src/users/enums/user-role.enum';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
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

  async recordView(propertyId: string): Promise<void> {
    await this.propertyRepository.increment(
      { id: propertyId },
      'views',
      1,
    );
  }
}
