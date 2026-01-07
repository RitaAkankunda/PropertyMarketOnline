import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Provider } from '../providers/entities/provider.entity';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AddProviderResponseDto } from './dto/add-provider-response.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  /**
   * Create a new review for a provider
   * If jobId is provided, validates that the job is completed and belongs to the reviewer
   */
  async createReview(providerId: string, reviewerId: string, createDto: CreateReviewDto): Promise<Review> {
    // Check if provider exists
    const provider = await this.providerRepository.findOne({ where: { id: providerId } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // If jobId is provided, validate the job
    if (createDto.jobId) {
      const job = await this.jobRepository.findOne({
        where: { id: createDto.jobId },
        relations: ['client', 'provider'],
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // Validate job is completed
      if (job.status !== JobStatus.COMPLETED) {
        throw new BadRequestException('You can only review providers for completed jobs');
      }

      // Validate job belongs to the reviewer (client)
      if (job.clientId !== reviewerId) {
        throw new ForbiddenException('You can only review providers for jobs you created');
      }

      // Validate job is assigned to this provider
      if (job.providerId !== provider.userId) {
        throw new BadRequestException('This job is not assigned to the specified provider');
      }

      // Check if review already exists for this job
      const existingJobReview = await this.reviewRepository.findOne({
        where: { jobId: createDto.jobId },
      });

      if (existingJobReview) {
        throw new BadRequestException('You have already reviewed this job');
      }
    }

    // Check if user already reviewed this provider (general review)
    const existingReview = await this.reviewRepository.findOne({
      where: { providerId, reviewerId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this provider. You can update your existing review instead.');
    }

    // Prevent providers from reviewing themselves
    if (provider.userId === reviewerId) {
      throw new BadRequestException('You cannot review your own provider profile');
    }

    // Create review
    const review = this.reviewRepository.create({
      providerId,
      reviewerId,
      jobId: createDto.jobId || null,
      rating: createDto.rating,
      comment: createDto.comment || null,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Recalculate provider rating
    await this.recalculateProviderRating(providerId);

    // Load with relations for response
    return await this.reviewRepository.findOne({
      where: { id: savedReview.id },
      relations: ['reviewer', 'provider', 'job'],
    });
  }

  /**
   * Get all reviews for a provider
   */
  async getProviderReviews(providerId: string, page: number = 1, pageSize: number = 10) {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { providerId, isHidden: false },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: reviews,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single review by ID
   */
  async getReviewById(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['reviewer', 'provider'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  /**
   * Get user's review for a provider (if exists)
   */
  async getUserReviewForProvider(providerId: string, userId: string): Promise<Review | null> {
    return await this.reviewRepository.findOne({
      where: { providerId, reviewerId: userId },
      relations: ['reviewer', 'provider'],
    });
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: string, userId: string, updateDto: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['provider'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the reviewer can update their review
    if (review.reviewerId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Update fields
    if (updateDto.rating !== undefined) {
      review.rating = updateDto.rating;
    }
    if (updateDto.comment !== undefined) {
      review.comment = updateDto.comment || null;
    }

    const updatedReview = await this.reviewRepository.save(review);

    // Recalculate provider rating
    await this.recalculateProviderRating(review.providerId);

    // Load with relations for response
    return await this.reviewRepository.findOne({
      where: { id: updatedReview.id },
      relations: ['reviewer', 'provider'],
    });
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['provider'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the reviewer or admin can delete
    if (review.reviewerId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const providerId = review.providerId;

    await this.reviewRepository.remove(review);

    // Recalculate provider rating
    await this.recalculateProviderRating(providerId);
  }

  /**
   * Recalculate provider's average rating and review count
   */
  async recalculateProviderRating(providerId: string): Promise<void> {
    const reviews = await this.reviewRepository.find({
      where: { providerId, isHidden: false },
    });

    const provider = await this.providerRepository.findOne({ where: { id: providerId } });
    if (!provider) {
      return;
    }

    if (reviews.length === 0) {
      provider.rating = 0;
      provider.reviewCount = 0;
    } else {
      const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
      provider.rating = Number((totalRating / reviews.length).toFixed(2));
      provider.reviewCount = reviews.length;
    }

    await this.providerRepository.save(provider);
  }

  /**
   * Admin: Verify a review
   */
  async verifyReview(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isVerified = true;
    return await this.reviewRepository.save(review);
  }

  /**
   * Admin: Hide a review
   */
  async hideReview(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isHidden = true;
    const updatedReview = await this.reviewRepository.save(review);

    // Recalculate provider rating (hidden reviews don't count)
    await this.recalculateProviderRating(review.providerId);

    return updatedReview;
  }

  /**
   * Admin: Unhide a review
   */
  async unhideReview(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isHidden = false;
    const updatedReview = await this.reviewRepository.save(review);

    // Recalculate provider rating
    await this.recalculateProviderRating(review.providerId);

    return updatedReview;
  }

  /**
   * Provider responds to a review
   */
  async addProviderResponse(reviewId: string, providerUserId: string, responseDto: AddProviderResponseDto): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['provider'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Verify the provider owns this review
    if (review.provider.userId !== providerUserId) {
      throw new ForbiddenException('You can only respond to reviews for your own provider profile');
    }

    // Check if already responded
    if (review.providerResponse) {
      throw new BadRequestException('You have already responded to this review. You can update your response by editing it.');
    }

    review.providerResponse = responseDto.response;
    review.respondedAt = new Date();

    return await this.reviewRepository.save(review);
  }

  /**
   * Provider updates their response to a review
   */
  async updateProviderResponse(reviewId: string, providerUserId: string, responseDto: AddProviderResponseDto): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['provider'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Verify the provider owns this review
    if (review.provider.userId !== providerUserId) {
      throw new ForbiddenException('You can only update responses to reviews for your own provider profile');
    }

    review.providerResponse = responseDto.response;
    review.respondedAt = new Date();

    return await this.reviewRepository.save(review);
  }
}

