import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from './entities/service-category.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categoryRepository: Repository<ServiceCategory>,
  ) {}

  async create(createDto: CreateServiceCategoryDto): Promise<ServiceCategory> {
    // Generate slug if not provided
    const slug = createDto.slug || this.generateSlug(createDto.name);

    // Check if slug already exists
    const existing = await this.categoryRepository.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException('A category with this name or slug already exists');
    }

    const category = this.categoryRepository.create({
      ...createDto,
      slug,
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
      sortOrder: createDto.sortOrder !== undefined ? createDto.sortOrder : 0,
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(includeInactive = false): Promise<ServiceCategory[]> {
    const query = this.categoryRepository.createQueryBuilder('category');

    if (!includeInactive) {
      query.where('category.isActive = :isActive', { isActive: true });
    }

    return await query.orderBy('category.sortOrder', 'ASC').addOrderBy('category.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<ServiceCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<ServiceCategory> {
    const category = await this.categoryRepository.findOne({ where: { slug } });
    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }
    return category;
  }

  async update(id: string, updateDto: UpdateServiceCategoryDto): Promise<ServiceCategory> {
    const category = await this.findOne(id);

    // If name is being updated, check slug uniqueness
    if (updateDto.name && updateDto.name !== category.name) {
      const slug = updateDto.slug || this.generateSlug(updateDto.name);
      const existing = await this.categoryRepository.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new BadRequestException('A category with this name or slug already exists');
      }
      updateDto.slug = slug;
    }

    Object.assign(category, updateDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  async softDelete(id: string): Promise<ServiceCategory> {
    const category = await this.findOne(id);
    category.isActive = false;
    return await this.categoryRepository.save(category);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
}

