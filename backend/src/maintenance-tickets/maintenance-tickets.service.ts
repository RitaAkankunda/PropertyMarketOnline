import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { MaintenanceTicket, TicketStatus } from './entities/maintenance-ticket.entity';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from './dto/update-maintenance-ticket.dto';
import { QueryMaintenanceTicketDto } from './dto/query-maintenance-ticket.dto';
import { UsersService } from '../users/users.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateJobDto } from '../jobs/dto/create-job.dto';

@Injectable()
export class MaintenanceTicketsService {
  constructor(
    @InjectRepository(MaintenanceTicket)
    private readonly ticketRepository: Repository<MaintenanceTicket>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => JobsService))
    private readonly jobsService: JobsService,
  ) {}

  async create(
    createDto: CreateMaintenanceTicketDto,
    userId: string,
  ): Promise<MaintenanceTicket> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ticket = this.ticketRepository.create({
      ...createDto,
      tenantId: userId,
      status: TicketStatus.PENDING,
    });

    return this.ticketRepository.save(ticket);
  }

  async findAll(
    query: QueryMaintenanceTicketDto,
    userId?: string,
    userRole?: string,
  ) {
    const { page = 1, pageSize = 10, status, category, priority, property } = query;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<MaintenanceTicket> = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by priority
    if (priority) {
      where.priority = priority;
    }

    // Filter by property
    if (property) {
      where.property = property;
    }

    // Filter by user role
    if (userId) {
      if (userRole === 'property_manager' || userRole === 'lister') {
        // Property owners/managers see tickets for their properties
        where.ownerId = userId;
      } else {
        // Tenants see their own tickets
        where.tenantId = userId;
      }
    }

    const [tickets, total] = await this.ticketRepository.findAndCount({
      where,
      relations: ['tenant', 'assignedProvider', 'owner', 'job'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      data: tickets,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<MaintenanceTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['tenant', 'assignedProvider', 'owner', 'job'],
    });

    if (!ticket) {
      throw new NotFoundException('Maintenance ticket not found');
    }

    // Check access permissions
    if (userId) {
      const hasAccess =
        ticket.tenantId === userId ||
        ticket.ownerId === userId ||
        ticket.assignedProviderId === userId ||
        userRole === 'admin';

      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this ticket');
      }
    }

    return ticket;
  }

  async update(
    id: string,
    updateDto: UpdateMaintenanceTicketDto,
    userId?: string,
    userRole?: string,
  ): Promise<MaintenanceTicket> {
    const ticket = await this.findOne(id, userId, userRole);

    // Only owner or admin can update ticket details
    if (userId && ticket.ownerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You do not have permission to update this ticket');
    }

    Object.assign(ticket, updateDto);
    return this.ticketRepository.save(ticket);
  }

  async assignProvider(
    id: string,
    providerId: string,
    userId: string,
    userRole?: string,
  ): Promise<MaintenanceTicket> {
    const ticket = await this.findOne(id, userId, userRole);

    // Only owner or admin can assign providers
    if (ticket.ownerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You do not have permission to assign providers');
    }

    const provider = await this.usersService.findOneById(providerId);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    ticket.assignedProviderId = providerId;
    ticket.status = TicketStatus.ASSIGNED;

    return this.ticketRepository.save(ticket);
  }

  async updateStatus(
    id: string,
    status: TicketStatus,
    userId: string,
    userRole?: string,
  ): Promise<MaintenanceTicket> {
    const ticket = await this.findOne(id, userId, userRole);

    // Only assigned provider, owner, or admin can update status
    const canUpdate =
      ticket.assignedProviderId === userId ||
      ticket.ownerId === userId ||
      userRole === 'admin';

    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update ticket status');
    }

    ticket.status = status;
    return this.ticketRepository.save(ticket);
  }

  async remove(id: string, userId: string, userRole?: string): Promise<void> {
    const ticket = await this.findOne(id, userId, userRole);

    // Only owner or admin can delete
    if (ticket.ownerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You do not have permission to delete this ticket');
    }

    await this.ticketRepository.remove(ticket);
  }

  /**
   * Link an existing job to a maintenance ticket
   */
  async linkJob(
    ticketId: string,
    jobId: string,
    userId: string,
    userRole?: string,
  ): Promise<MaintenanceTicket> {
    const ticket = await this.findOne(ticketId, userId, userRole);

    // Only owner or admin can link jobs
    if (ticket.ownerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You do not have permission to link jobs to this ticket');
    }

    // Verify job exists
    const job = await this.jobsService.findOne(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    ticket.jobId = jobId;
    return this.ticketRepository.save(ticket);
  }

  /**
   * Create a job from a maintenance ticket
   */
  async createJobFromTicket(
    ticketId: string,
    createJobDto: CreateJobDto,
    userId: string,
    userRole?: string,
  ): Promise<{ ticket: MaintenanceTicket; job: any }> {
    const ticket = await this.findOne(ticketId, userId, userRole);

    // Only owner or admin can create jobs from tickets
    if (ticket.ownerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You do not have permission to create jobs from this ticket');
    }

    // Create job using the ticket information
    const job = await this.jobsService.create(createJobDto, userId);

    // Link the job to the ticket
    ticket.jobId = job.id;
    const updatedTicket = await this.ticketRepository.save(ticket);

    return { ticket: updatedTicket, job };
  }
}

