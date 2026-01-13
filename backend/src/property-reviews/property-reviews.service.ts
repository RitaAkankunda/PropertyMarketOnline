import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { PropertyReview } from './entities/property-review.entity';
import { CreatePropertyReviewDto } from './dto/create-property-review.dto';
import { UpdatePropertyReviewDto } from './dto/update-property-review.dto';
import { QueryPropertyReviewDto } from './dto/query-property-review.dto';
import { Property } from 'src/properties/entities/property.entity';
import { Booking, BookingStatus } from 'src/bookings/entities/booking.entity';

@Injectable()
export class PropertyReviewsService {
  constructor(
    @InjectRepository(PropertyReview)
    private readonly reviewRepository: Repository<PropertyReview>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(
    createReviewDto: CreatePropertyReviewDto,
    reviewerId: string,
  ): Promise<PropertyReview> {
    // Verify property exists
    const property = await this.propertyRepository.findOne({
      where: { id: createReviewDto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check if user already reviewed this property
    const existingReview = await this.reviewRepository.findOne({
      where: {
        propertyId: createReviewDto.propertyId,
        reviewerId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this property');
    }

    // If bookingId is provided, verify it belongs to the reviewer
    let isVerified = false;
    if (createReviewDto.bookingId) {
      const booking = await this.bookingRepository.findOne({
        where: {
          id: createReviewDto.bookingId,
          userId: reviewerId,
          propertyId: createReviewDto.propertyId,
          status: BookingStatus.COMPLETED,
        },
      });

      if (booking) {
        isVerified = true;
      }
    }

    // Create review
    const review = this.reviewRepository.create({
      ...createReviewDto,
      reviewerId,
      isVerified,
    });

    return await this.reviewRepository.save(review);
  }

  async findAll(query: QueryPropertyReviewDto) {
    const { page = 1, pageSize = 10, propertyId, reviewerId, minRating } = query;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<PropertyReview> = {};
    if (propertyId) {
      where.propertyId = propertyId;
    }
    if (reviewerId) {
      where.reviewerId = reviewerId;
    }
    if (minRating) {
      where.rating = minRating as any; // TypeORM will handle >= comparison
    }

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['reviewer', 'property', 'booking'],
      order: { createdAt: 'DESC' },
      skip,
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

  async findOne(id: string): Promise<PropertyReview> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer', 'property', 'booking'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByProperty(propertyId: string, query: QueryPropertyReviewDto) {
    const { page = 1, pageSize = 10, minRating } = query;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<PropertyReview> = {
      propertyId,
      isHidden: false, // Only show non-hidden reviews
    };

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    // Calculate average rating and rating breakdown
    const allReviews = await this.reviewRepository.find({
      where: { propertyId, isHidden: false },
    });

    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + Number(r.rating), 0) / allReviews.length
        : 0;

    const ratingBreakdown = {
      5: allReviews.filter((r) => Math.round(Number(r.rating)) === 5).length,
      4: allReviews.filter((r) => Math.round(Number(r.rating)) === 4).length,
      3: allReviews.filter((r) => Math.round(Number(r.rating)) === 3).length,
      2: allReviews.filter((r) => Math.round(Number(r.rating)) === 2).length,
      1: allReviews.filter((r) => Math.round(Number(r.rating)) === 1).length,
    };

    // Calculate category averages
    const categoryAverages = {
      cleanliness: this.calculateCategoryAverage(allReviews, 'cleanlinessRating'),
      location: this.calculateCategoryAverage(allReviews, 'locationRating'),
      value: this.calculateCategoryAverage(allReviews, 'valueRating'),
      communication: this.calculateCategoryAverage(allReviews, 'communicationRating'),
    };

    return {
      data: reviews,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      statistics: {
        averageRating: Number(averageRating.toFixed(2)),
        totalReviews: allReviews.length,
        ratingBreakdown,
        categoryAverages,
      },
    };
  }

  private calculateCategoryAverage(
    reviews: PropertyReview[],
    category: string,
  ): number {
    const reviewsWithCategory = reviews.filter(
      (r) => (r as any)[category] !== null && (r as any)[category] !== undefined,
    );

    if (reviewsWithCategory.length === 0) return 0;

    const sum = reviewsWithCategory.reduce(
      (acc, r) => acc + Number((r as any)[category]),
      0,
    );
    return Number((sum / reviewsWithCategory.length).toFixed(2));
  }

  async update(
    id: string,
    updateReviewDto: UpdatePropertyReviewDto,
    userId: string,
  ): Promise<PropertyReview> {
    const review = await this.findOne(id);

    // Only reviewer can update their review
    if (review.reviewerId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, updateReviewDto);
    return await this.reviewRepository.save(review);
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.findOne(id);

    // Only reviewer can delete their review
    if (review.reviewerId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.remove(review);
  }

  async addOwnerResponse(
    reviewId: string,
    response: string,
    ownerId: string,
  ): Promise<PropertyReview> {
    const review = await this.findOne(reviewId);

    // Verify the owner owns the property
    const property = await this.propertyRepository.findOne({
      where: { id: review.propertyId, ownerId },
    });

    if (!property) {
      throw new ForbiddenException('You can only respond to reviews for your properties');
    }

    review.ownerResponse = response;
    review.respondedAt = new Date();

    return await this.reviewRepository.save(review);
  }
}
