import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AddProviderResponseDto } from './dto/add-provider-response.dto';

@Controller('providers')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Specific routes must come before :providerId routes to avoid conflicts

  /**
   * Get a single review by ID (public)
   */
  @Get('reviews/:reviewId')
  async getReview(@Param('reviewId') reviewId: string) {
    return await this.reviewsService.getReviewById(reviewId);
  }

  /**
   * Update a review
   */
  @Patch('reviews/:reviewId')
  @UseGuards(AuthGuard('jwt'))
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() updateDto: UpdateReviewDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    return await this.reviewsService.updateReview(reviewId, userId, updateDto);
  }

  /**
   * Delete a review
   */
  @Delete('reviews/:reviewId')
  @UseGuards(AuthGuard('jwt'))
  async deleteReview(
    @Param('reviewId') reviewId: string,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    const isAdmin = req.user?.role === 'admin';
    await this.reviewsService.deleteReview(reviewId, userId, isAdmin);
    return { message: 'Review deleted successfully' };
  }

  /**
   * Admin: Verify a review
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('reviews/:reviewId/verify')
  async verifyReview(@Param('reviewId') reviewId: string) {
    return await this.reviewsService.verifyReview(reviewId);
  }

  /**
   * Admin: Hide a review
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('reviews/:reviewId/hide')
  async hideReview(@Param('reviewId') reviewId: string) {
    return await this.reviewsService.hideReview(reviewId);
  }

  /**
   * Admin: Unhide a review
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('reviews/:reviewId/unhide')
  async unhideReview(@Param('reviewId') reviewId: string) {
    return await this.reviewsService.unhideReview(reviewId);
  }

  // Provider-specific routes

  /**
   * Create a review for a provider
   */
  @Post(':providerId/reviews')
  @UseGuards(AuthGuard('jwt'))
  async createReview(
    @Param('providerId') providerId: string,
    @Body() createDto: CreateReviewDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    return await this.reviewsService.createReview(providerId, userId, createDto);
  }

  /**
   * Get all reviews for a provider (public)
   */
  @Get(':providerId/reviews')
  async getProviderReviews(
    @Param('providerId') providerId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize) : 10;
    return await this.reviewsService.getProviderReviews(providerId, pageNum, pageSizeNum);
  }

  /**
   * Get user's review for a provider (if exists)
   */
  @Get(':providerId/reviews/my')
  @UseGuards(AuthGuard('jwt'))
  async getMyReviewForProvider(
    @Param('providerId') providerId: string,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    const review = await this.reviewsService.getUserReviewForProvider(providerId, userId);
    if (!review) {
      throw new BadRequestException('You have not reviewed this provider yet');
    }

    return review;
  }

  /**
   * Provider responds to a review
   */
  @Post('reviews/:reviewId/response')
  @UseGuards(AuthGuard('jwt'))
  async addProviderResponse(
    @Param('reviewId') reviewId: string,
    @Body() responseDto: AddProviderResponseDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    return await this.reviewsService.addProviderResponse(reviewId, userId, responseDto);
  }

  /**
   * Provider updates their response to a review
   */
  @Patch('reviews/:reviewId/response')
  @UseGuards(AuthGuard('jwt'))
  async updateProviderResponse(
    @Param('reviewId') reviewId: string,
    @Body() responseDto: AddProviderResponseDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    return await this.reviewsService.updateProviderResponse(reviewId, userId, responseDto);
  }
}

