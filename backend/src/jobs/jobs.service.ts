import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import {
  JobCreatedEvent,
  JobAssignedEvent,
  JobAcceptedEvent,
  JobRejectedEvent,
  JobStartedEvent,
  JobCompletedEvent,
  JobCancelledEvent,
  JobStatusUpdatedEvent,
} from 'src/notifications/events/job.events';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    private readonly usersService: UsersService,
    private readonly r2Service: R2Service,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createJobDto: CreateJobDto,
    clientId: string,
    images?: any[],
  ): Promise<Job> {
    console.log('[JOBS SERVICE] Creating job for clientId:', clientId);
    // Verify client exists
    const client = await this.usersService.findOneById(clientId);
    if (!client) {
      console.error('[JOBS SERVICE] Client not found for clientId:', clientId);
      throw new NotFoundException('Client not found');
    }
    console.log('[JOBS SERVICE] Client verified:', { id: client.id, email: client.email, firstName: client.firstName });

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
        const uploadResults = await Promise.all(
          images.map((file) => this.r2Service.uploadFile(file, 'jobs')),
        );
        // Filter out any null/undefined results and ensure all are strings
        imageUrls = uploadResults.filter((url): url is string => typeof url === 'string' && url.length > 0);
        console.log('[JOBS] Images uploaded successfully:', imageUrls.length, 'images');
      } catch (error) {
        console.error('[JOBS] Error uploading images:', error);
        // Continue without images if upload fails
        imageUrls = [];
      }
    }

    // Create job
    // TypeORM simple-array requires an array of strings or null/undefined
    // Empty array should be converted to null to avoid issues
    const jobData: any = {
      ...createJobDto,
      clientId,
      providerId: providerUserId || null,
      currency: createJobDto.currency || 'UGX',
      status: JobStatus.PENDING,
    };

    // Only set images if we have valid URLs
    // TypeORM simple-array stores arrays as comma-separated strings in PostgreSQL
    // The issue is that URLs with special characters can break the array parsing
    // We need to ensure proper array formatting
    if (imageUrls.length > 0) {
      // Ensure all URLs are properly formatted strings
      const sanitizedUrls = imageUrls
        .map(url => String(url).trim())
        .filter(url => url.length > 0);
      
      // TypeORM simple-array will convert this to comma-separated string
      // But we need to make sure it's a proper array
      jobData.images = sanitizedUrls;
      
      console.log('[JOBS] Setting images array:', {
        count: sanitizedUrls.length,
        urls: sanitizedUrls,
        isArray: Array.isArray(sanitizedUrls),
      });
    } else {
      // Explicitly set to null for empty array
      jobData.images = null;
    }

    console.log('[JOBS] Creating job entity:', {
      clientId,
      providerId: providerUserId,
      serviceType: createJobDto.serviceType,
      imageCount: imageUrls.length,
      images: jobData.images,
      imagesType: Array.isArray(jobData.images) ? 'array' : typeof jobData.images,
    });

    try {
      const job = this.jobRepository.create(jobData);
      
      // Ensure job is a single entity, not an array
      const jobEntity = Array.isArray(job) ? job[0] : job;
      
      // Log the job entity before saving to debug
      console.log('[JOBS] Job entity created:', {
        id: jobEntity.id,
        images: jobEntity.images,
        imagesType: Array.isArray(jobEntity.images) ? 'array' : typeof jobEntity.images,
        imagesValue: jobEntity.images,
      });

      const savedJob = await this.jobRepository.save(jobEntity);
      console.log('[JOBS] Job saved successfully:', {
        id: savedJob.id,
        clientId: savedJob.clientId,
        title: savedJob.title,
        status: savedJob.status,
      });
      
      // Emit job created event
      this.eventEmitter.emit('job.created', new JobCreatedEvent(savedJob));
      
      // If provider was assigned, emit assigned event
      if (savedJob.providerId) {
        this.eventEmitter.emit('job.assigned', new JobAssignedEvent(savedJob, savedJob.providerId));
      }
      
      return savedJob;
    } catch (saveError: any) {
      console.error('[JOBS] Error saving job:', {
        error: saveError.message,
        stack: saveError.stack,
        jobData: {
          ...jobData,
          images: jobData.images,
        },
      });
      
      // If it's an array literal error, try saving without images first
      if (saveError.message && saveError.message.includes('malformed array literal')) {
        console.log('[JOBS] Attempting to save without images due to array literal error');
        const jobWithoutImages = this.jobRepository.create({
          ...jobData,
          images: null,
        });
        const jobEntityWithoutImages = Array.isArray(jobWithoutImages) ? jobWithoutImages[0] : jobWithoutImages;
        const savedJob = await this.jobRepository.save(jobEntityWithoutImages);
        console.log('[JOBS] Job saved without images:', savedJob.id);
        // Note: Images were uploaded but couldn't be saved - this is a workaround
        // TODO: Fix the simple-array issue with URLs containing special characters
        return savedJob;
      }
      
      throw saveError;
    }
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
      relations: ['client', 'provider'], // provider is already a User entity, not Provider entity
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
      relations: ['client', 'provider'], // provider is already a User entity
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

    console.log('[JOBS SERVICE] Finding jobs for clientId:', userId, 'with filters:', where);

    const [jobs, total] = await this.jobRepository.findAndCount({
      where,
      relations: ['client', 'provider'], // provider is already a User entity, not Provider entity
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    console.log('[JOBS SERVICE] Found', total, 'jobs for clientId:', userId);

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
      relations: ['client', 'provider'], // provider is already a User entity, not Provider entity
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
    const previousStatus = job.status;
    job.status = updateStatusDto.status;
    if (updateStatusDto.reason) {
      job.cancellationReason = updateStatusDto.reason;
    }
    if (updateStatusDto.status === JobStatus.COMPLETED) {
      job.completedAt = new Date();
    }

    const savedJob = await this.jobRepository.save(job);
    
    // Emit events based on status change
    if (updateStatusDto.status === JobStatus.CANCELLED) {
      this.eventEmitter.emit('job.cancelled', new JobCancelledEvent(savedJob, updateStatusDto.reason));
    }
    // Note: REJECTED status doesn't exist in JobStatus enum, removed that check
    
    // Always emit status updated event
    if (previousStatus !== updateStatusDto.status) {
      this.eventEmitter.emit('job.status.updated', new JobStatusUpdatedEvent(savedJob, previousStatus));
    }
    
    return savedJob;
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
    const previousStatus = job.status;
    job.status = JobStatus.ACCEPTED;

    const savedJob = await this.jobRepository.save(job);
    
    // Emit events
    this.eventEmitter.emit('job.accepted', new JobAcceptedEvent(savedJob));
    this.eventEmitter.emit('job.status.updated', new JobStatusUpdatedEvent(savedJob, previousStatus));
    
    return savedJob;
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
    const previousStatus = job.status;
    job.status = JobStatus.IN_PROGRESS;

    const savedJob = await this.jobRepository.save(job);
    
    // Emit events
    this.eventEmitter.emit('job.started', new JobStartedEvent(savedJob));
    this.eventEmitter.emit('job.status.updated', new JobStatusUpdatedEvent(savedJob, previousStatus));
    
    return savedJob;
  }
}

