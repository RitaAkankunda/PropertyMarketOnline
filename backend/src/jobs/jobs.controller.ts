import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { File as MulterFile } from 'multer';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { QueryJobDto } from './dto/query-job.dto';

@Controller('jobs')
@UseGuards(AuthGuard('jwt'))
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('create')
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() createJobDto: any, // Use any to handle FormData properly
    @Request() req,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    @UploadedFiles() images?: MulterFile[],
  ) {
    console.log('[JOBS] Create job request received:', {
      userId: req.user?.id,
      serviceType: createJobDto.serviceType,
      title: createJobDto.title,
      description: createJobDto.description?.substring(0, 50),
      scheduledDate: createJobDto.scheduledDate,
      scheduledTime: createJobDto.scheduledTime,
      location: createJobDto.location,
      imageCount: images?.length || 0,
      allFields: Object.keys(createJobDto),
    });

    // Validate required fields
    if (!createJobDto.serviceType || !createJobDto.title || !createJobDto.description) {
      console.error('[JOBS] Missing required fields:', {
        serviceType: !!createJobDto.serviceType,
        title: !!createJobDto.title,
        description: !!createJobDto.description,
      });
      throw new BadRequestException('serviceType, title, and description are required');
    }

    if (!createJobDto.scheduledDate || !createJobDto.scheduledTime) {
      console.error('[JOBS] Missing schedule fields:', {
        scheduledDate: createJobDto.scheduledDate,
        scheduledTime: createJobDto.scheduledTime,
      });
      throw new BadRequestException('scheduledDate and scheduledTime are required');
    }

    // Parse location if it's a string (from FormData)
    let location = createJobDto.location;
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        console.error('[JOBS] Invalid location format:', location);
        throw new BadRequestException('Invalid location format. Expected JSON string.');
      }
    }

    if (!location || !location.address || !location.city) {
      console.error('[JOBS] Invalid location:', location);
      throw new BadRequestException('location with address and city is required');
    }

    // Parse price if it's a string
    const price = createJobDto.price
      ? parseFloat(createJobDto.price)
      : undefined;

    // Build DTO
    const dto: CreateJobDto = {
      providerId: createJobDto.providerId || undefined,
      serviceType: createJobDto.serviceType,
      title: createJobDto.title,
      description: createJobDto.description,
      location: location,
      scheduledDate: createJobDto.scheduledDate,
      scheduledTime: createJobDto.scheduledTime,
      price: price,
      currency: createJobDto.currency || 'UGX',
    };

    console.log('[JOBS] Creating job with DTO:', {
      ...dto,
      description: dto.description?.substring(0, 50),
      imageCount: images?.length || 0,
    });

    return this.jobsService.create(dto, req.user.id, images);
  }

  @Get()
  async findAll(@Query() query: QueryJobDto) {
    return this.jobsService.findAll(query);
  }

  @Get('my')
  async findMyJobs(@Query() query: QueryJobDto, @Request() req) {
    return this.jobsService.findMyJobs(req.user.id, query);
  }

  @Get('provider')
  async findProviderJobs(@Query() query: QueryJobDto, @Request() req) {
    return this.jobsService.findProviderJobs(req.user.id, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateJobStatusDto,
    @Request() req,
  ) {
    return this.jobsService.updateStatus(id, updateStatusDto, req.user.id);
  }

  @Patch(':id')
  async updateProgress(
    @Param('id') id: string,
    @Body() updates: Partial<CreateJobDto>,
    @Request() req,
  ) {
    return this.jobsService.updateProgress(id, updates, req.user.id);
  }

  @Post(':id/rate')
  async addRating(
    @Param('id') id: string,
    @Body() body: { rating: number; review?: string },
    @Request() req,
  ) {
    return this.jobsService.addRating(
      id,
      body.rating,
      body.review || '',
      req.user.id,
    );
  }
}

