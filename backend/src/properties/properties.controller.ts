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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

import { FilesInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import { R2Service } from 'src/common/r2.service';
import { UserRole } from 'src/users/enums/user-role.enum';
import { diskStorage } from 'multer';


@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly r2Service: R2Service,
  ) {}

  // Upload multiple property images or documents to R2
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: MulterFile[]) {
    if (!files || files.length === 0) {
      return { urls: [], message: 'No files uploaded' };
    }
    const urls = await Promise.all(
      files.map(file => {
        const folder = file.mimetype.startsWith('image/') ? 'images' : 'documents';
        return this.r2Service.uploadFile(file, folder);
      })
    );
    console.log('[PropertiesController] Uploaded files, returning URLs:', urls);
    return { urls };
  }


  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.LISTER, UserRole.PROPERTY_MANAGER, UserRole.ADMIN)
  @Post()
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    try {
      console.log('[PROPERTIES CONTROLLER] Create request received:', {
        title: createPropertyDto.title,
        propertyType: createPropertyDto.propertyType,
        user: req.user,
      });
      return this.propertiesService.create(createPropertyDto, req.user.sub);
    } catch (error) {
      console.error('[PROPERTIES CONTROLLER] Error in create endpoint:', error);
      throw error;
    }
  }


  @Get()
  findAll(@Query() queryDto: QueryPropertyDto) {
    return this.propertiesService.findAll(queryDto);
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('my/properties')
  findMyProperties(@Request() req) {
    return this.propertiesService.findByOwnerId(req.user.sub);
  }


  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.LISTER, UserRole.PROPERTY_MANAGER, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req,
  ) {
    return this.propertiesService.update(
      id,
      updatePropertyDto,
      req.user.sub,
      req.user.role,
    );
  }


  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.LISTER, UserRole.PROPERTY_MANAGER, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.propertiesService.remove(id, req.user.sub, req.user.role);
  }
}
