import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MaintenanceTicketsService } from './maintenance-tickets.service';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from './dto/update-maintenance-ticket.dto';
import { QueryMaintenanceTicketDto } from './dto/query-maintenance-ticket.dto';
import { TicketStatus } from './entities/maintenance-ticket.entity';
import { CreateJobDto } from '../jobs/dto/create-job.dto';

@Controller('maintenance-tickets')
@UseGuards(AuthGuard('jwt'))
export class MaintenanceTicketsController {
  constructor(
    private readonly maintenanceTicketsService: MaintenanceTicketsService,
  ) {}

  @Post()
  async create(
    @Body() createDto: CreateMaintenanceTicketDto,
    @Request() req,
  ) {
    return this.maintenanceTicketsService.create(createDto, req.user.id);
  }

  @Get()
  async findAll(
    @Query() query: QueryMaintenanceTicketDto,
    @Request() req,
  ) {
    return this.maintenanceTicketsService.findAll(
      query,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.maintenanceTicketsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaintenanceTicketDto,
    @Request() req,
  ) {
    return this.maintenanceTicketsService.update(
      id,
      updateDto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/assign')
  async assignProvider(
    @Param('id') id: string,
    @Body() body: { providerId: string },
    @Request() req,
  ) {
    return this.maintenanceTicketsService.assignProvider(
      id,
      body.providerId,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TicketStatus },
    @Request() req,
  ) {
    return this.maintenanceTicketsService.updateStatus(
      id,
      body.status,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.maintenanceTicketsService.remove(id, req.user.id, req.user.role);
    return { message: 'Maintenance ticket deleted successfully' };
  }

  /**
   * Link an existing job to a maintenance ticket
   */
  @Post(':id/link-job')
  async linkJob(
    @Param('id') ticketId: string,
    @Body() body: { jobId: string },
    @Request() req,
  ) {
    return this.maintenanceTicketsService.linkJob(
      ticketId,
      body.jobId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Create a job from a maintenance ticket
   */
  @Post(':id/create-job')
  async createJobFromTicket(
    @Param('id') ticketId: string,
    @Body() createJobDto: CreateJobDto,
    @Request() req,
  ) {
    return this.maintenanceTicketsService.createJobFromTicket(
      ticketId,
      createJobDto,
      req.user.id,
      req.user.role,
    );
  }
}

