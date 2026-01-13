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
import { PropertyReviewsService } from './property-reviews.service';
import { CreatePropertyReviewDto } from './dto/create-property-review.dto';
import { UpdatePropertyReviewDto } from './dto/update-property-review.dto';
import { QueryPropertyReviewDto } from './dto/query-property-review.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('property-reviews')
export class PropertyReviewsController {
  constructor(private readonly propertyReviewsService: PropertyReviewsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createReviewDto: CreatePropertyReviewDto, @Request() req) {
    return this.propertyReviewsService.create(createReviewDto, req.user.id);
  }

  @Get()
  findAll(@Query() query: QueryPropertyReviewDto) {
    return this.propertyReviewsService.findAll(query);
  }

  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query() query: QueryPropertyReviewDto,
  ) {
    return this.propertyReviewsService.findByProperty(propertyId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertyReviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdatePropertyReviewDto,
    @Request() req,
  ) {
    return this.propertyReviewsService.update(id, updateReviewDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string, @Request() req) {
    return this.propertyReviewsService.remove(id, req.user.id);
  }

  @Post(':id/owner-response')
  @UseGuards(AuthGuard('jwt'))
  addOwnerResponse(
    @Param('id') id: string,
    @Body() body: { response: string },
    @Request() req,
  ) {
    return this.propertyReviewsService.addOwnerResponse(id, body.response, req.user.id);
  }
}
