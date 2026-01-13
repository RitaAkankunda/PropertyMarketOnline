import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyReviewsService } from './property-reviews.service';
import { PropertyReviewsController } from './property-reviews.controller';
import { PropertyReview } from './entities/property-review.entity';
import { Property } from 'src/properties/entities/property.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyReview, Property, Booking])],
  controllers: [PropertyReviewsController],
  providers: [PropertyReviewsService],
  exports: [PropertyReviewsService],
})
export class PropertyReviewsModule {}
