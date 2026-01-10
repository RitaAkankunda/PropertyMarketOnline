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
import { AssignProviderDto } from './dto/assign-provider.dto';
import { CompleteJobDto } from './dto/complete-job.dto';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/users/enums/user-role.enum';
import { R2Service } from 'src/common/r2.service';
import { Provider } from 'src/providers/entities/provider.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
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
    let providerUserId = null;
    if (createJobDto.providerId) {
      // First try to find by provider table ID
      const providerEntity = await this.providerRepository.findOne({
        where: { id: createJobDto.providerId },
        relations: ['user'],
      });
      
      if (providerEntity) {
        // Found provider by provider ID, use the user ID
        providerUserId = providerEntity.userId;
      } else {
        // Try to find by user ID (backwards compatibility)
        const user = await this.usersService.findOneById(createJobDto.providerId);
        if (!user) {
          throw new NotFoundException('Provider not found');
        }
        // Verify provider role
        if (user.role !== UserRole.SERVICE_PROVIDER && user.role !== UserRole.PROPERTY_MANAGER) {
          throw new BadRequestException('Selected user is not a service provider');
        }
        providerUserId = user.id;
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
      providerId: providerUserId || null,
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

  /**
   * Client assigns a provider to a pending job
   */
  async assignProvider(jobId: string, assignDto: AssignProviderDto, clientId: string): Promise<Job> {
    const job = await this.findOne(jobId);

    // Only client can assign provider
    if (job.clientId !== clientId) {
      throw new ForbiddenException('Only the job creator can assign a provider');
    }

    // Job must be pending
    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException('Can only assign provider to pending jobs');
    }

    // Verify provider exists and is a service provider
    const providerUser = await this.usersService.findOneById(assignDto.providerId);
    if (!providerUser) {
      throw new NotFoundException('Provider not found');
    }

    // Check if provider has a provider profile
    const provider = await this.providerRepository.findOne({
      where: { userId: assignDto.providerId },
    });

    if (!provider) {
      throw new BadRequestException('Selected user is not a registered service provider');
    }

    // Assign provider
    job.providerId = assignDto.providerId;
    // Status remains PENDING until provider accepts

    return await this.jobRepository.save(job);
  }

  /**
   * Provider accepts a job (that has been assigned to them)
   */
  async acceptJob(jobId: string, providerUserId: string): Promise<Job> {
    const job = await this.findOne(jobId);

    // Verify job is assigned to this provider
    if (job.providerId !== providerUserId) {
      throw new ForbiddenException('This job is not assigned to you');
    }

    // Job must be pending
    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException('Can only accept pending jobs');
    }

    // Update status to accepted
    job.status = JobStatus.ACCEPTED;

    return await this.jobRepository.save(job);
  }

  /**
   * Provider completes a job with notes and photos
   */
  async completeJob(jobId: string, completeDto: CompleteJobDto, providerUserId: string): Promise<Job> {
    const job = await this.findOne(jobId);

    // Verify job is assigned to this provider
    if (job.providerId !== providerUserId) {
      throw new ForbiddenException('You can only complete jobs assigned to you');
    }

    // Job must be accepted or in progress
    if (job.status !== JobStatus.ACCEPTED && job.status !== JobStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only complete accepted or in-progress jobs');
    }

    // Update job
    job.status = JobStatus.COMPLETED;
    job.completedAt = new Date();
    job.completionNotes = completeDto.completionNotes || null;
    job.completionPhotos = completeDto.completionPhotos || null;

    // Update provider's completed jobs count
    const provider = await this.providerRepository.findOne({
      where: { userId: providerUserId },
    });

    if (provider) {
      provider.completedJobs = (provider.completedJobs || 0) + 1;
      await this.providerRepository.save(provider);
    }

    return await this.jobRepository.save(job);
  }

  /**
   * Provider starts work on a job (moves from accepted to in_progress)
   */
  async startJob(jobId: string, providerUserId: string): Promise<Job> {
    const job = await this.findOne(jobId);

    // Verify job is assigned to this provider
    if (job.providerId !== providerUserId) {
      throw new ForbiddenException('You can only start jobs assigned to you');
    }

    // Job must be accepted
    if (job.status !== JobStatus.ACCEPTED) {
      throw new BadRequestException('Can only start accepted jobs');
    }

    // Update status to in progress
    job.status = JobStatus.IN_PROGRESS;

    return await this.jobRepository.save(job);
  }
}

