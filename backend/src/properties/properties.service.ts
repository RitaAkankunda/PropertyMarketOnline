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
    const property = this.propertyRepository.create({
      ...createPropertyDto,
      ownerId: userId,
    });
    return await this.propertyRepository.save(property);
  }

  async findAll(queryDto: QueryPropertyDto) {
    const {
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      page = 1,
      limit = 10,
    } = queryDto;

    const query = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner');

    if (propertyType) {
      query.andWhere('property.propertyType = :propertyType', {
        propertyType,
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

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

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
}
