import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/users/enums/user-role.enum';
import { R2Service } from 'src/common/r2.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly usersService: UsersService,
    private readonly r2Service: R2Service,
  ) {}

  async create(
    createJobDto: CreateJobDto,
    clientId: string,
    images?: any[],
  ): Promise<Job> {
    // Verify client exists
    const client = await this.usersService.findOneById(clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // If providerId is provided, verify provider exists
    let provider = null;
    if (createJobDto.providerId) {
      provider = await this.usersService.findOneById(createJobDto.providerId);
      if (!provider) {
        throw new NotFoundException('Provider not found');
      }
      // Optionally verify provider role
      if (
        provider.role !== UserRole.PROPERTY_MANAGER &&
        provider.role !== UserRole.LISTER
      ) {
        throw new BadRequestException('Selected user is not a service provider');
      }
    }

    // Upload images if provided
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      try {
        imageUrls = await Promise.all(
          images.map((file) => this.r2Service.uploadFile(file, 'jobs')),
        );
      } catch (error) {
        console.error('Error uploading images:', error);
        // Continue without images if upload fails
      }
    }

    // Create job
    const job = this.jobRepository.create({
      ...createJobDto,
      clientId,
      providerId: createJobDto.providerId || null,
      images: imageUrls.length > 0 ? imageUrls : null,
      currency: createJobDto.currency || 'UGX',
      status: JobStatus.PENDING,
    });

    return await this.jobRepository.save(job);
  }

  async findAll(query: QueryJobDto) {
    const { page = 1, pageSize = 10, status } = query;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<Job> = {};
    if (status) {
      where.status = status;
    }

    const [jobs, total] = await this.jobRepository.findAndCount({
      where,
      relations: ['client', 'provider'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      data: jobs,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['client', 'provider'],
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async findMyJobs(userId: string, query: QueryJobDto) {
    const { page = 1, pageSize = 10, status } = query;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<Job> = { clientId: userId };
    if (status) {
      where.status = status;
    }

    const [jobs, total] = await this.jobRepository.findAndCount({
      where,
      relations: ['client', 'provider'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      data: jobs,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findProviderJobs(providerId: string, query: QueryJobDto) {
    const { page = 1, pageSize = 10, status } = query;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<Job> = { providerId };
    if (status) {
      where.status = status;
    }

    const [jobs, total] = await this.jobRepository.findAndCount({
      where,
      relations: ['client', 'provider'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      data: jobs,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateJobStatusDto,
    userId: string,
  ): Promise<Job> {
    const job = await this.findOne(id);

    // Check permissions
    const isClient = job.clientId === userId;
    const isProvider = job.providerId === userId;
    const user = await this.usersService.findOneById(userId);

    if (!isClient && !isProvider && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to update this job',
      );
    }

    // Validate status transitions
    if (updateStatusDto.status === JobStatus.ACCEPTED) {
      if (job.status !== JobStatus.PENDING) {
        throw new BadRequestException(
          'Only pending jobs can be accepted',
        );
      }
      if (!isProvider && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only providers can accept jobs');
      }
    }

    if (updateStatusDto.status === JobStatus.CANCELLED) {
      if (job.status === JobStatus.COMPLETED) {
        throw new BadRequestException('Cannot cancel a completed job');
      }
    }

    if (updateStatusDto.status === JobStatus.COMPLETED) {
      if (job.status !== JobStatus.IN_PROGRESS && job.status !== JobStatus.ACCEPTED) {
        throw new BadRequestException(
          'Only in-progress or accepted jobs can be completed',
        );
      }
      if (!isProvider && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only providers can complete jobs');
      }
    }

    // Update job
    job.status = updateStatusDto.status;
    if (updateStatusDto.reason) {
      job.cancellationReason = updateStatusDto.reason;
    }
    if (updateStatusDto.status === JobStatus.COMPLETED) {
      job.completedAt = new Date();
    }

    return await this.jobRepository.save(job);
  }

  async updateProgress(
    id: string,
    updates: Partial<Job>,
    userId: string,
  ): Promise<Job> {
    const job = await this.findOne(id);

    // Only provider or admin can update progress
    const isProvider = job.providerId === userId;
    const user = await this.usersService.findOneById(userId);

    if (!isProvider && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only providers can update job progress',
      );
    }

    // Update allowed fields
    if (updates.status) {
      job.status = updates.status;
    }
    if (updates.description) {
      job.description = updates.description;
    }

    return await this.jobRepository.save(job);
  }

  async addRating(
    id: string,
    rating: number,
    review: string,
    userId: string,
  ): Promise<Job> {
    const job = await this.findOne(id);

    // Only client can rate
    if (job.clientId !== userId) {
      throw new ForbiddenException('Only the client can rate this job');
    }

    if (job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed jobs');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    job.rating = rating;
    job.review = review;

    return await this.jobRepository.save(job);
  }
}

