import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { ProvidersModule } from './providers/providers.module';
import { PaymentsModule } from './payments/payments.module';
import { JobsModule } from './jobs/jobs.module';
import { MaintenanceTicketsModule } from './maintenance-tickets/maintenance-tickets.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DatabaseConfig } from './config/database.config';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { createMessagesTables } from './messages/create-tables';
import { BookingsModule } from './bookings/bookings.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PropertyReviewsModule } from './property-reviews/property-reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    UsersModule,
    AuthModule,
    PropertiesModule,
    ProvidersModule,
    PaymentsModule,
    JobsModule,
    MaintenanceTicketsModule,
    CategoriesModule,
    ReviewsModule,
    HealthModule,
    NotificationsModule,
    MessagesModule,
    BookingsModule,
    FavoritesModule,
    PropertyReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Set timezone to UTC for all database connections
    // This ensures all timestamps are stored and retrieved in UTC
    try {
      await this.dataSource.query("SET timezone = 'UTC'");
      console.log('[APP MODULE] Database timezone set to UTC');
      
      // Create messages tables if they don't exist
      await createMessagesTables(this.dataSource);
    } catch (error) {
      console.warn('[APP MODULE] Failed to set database timezone to UTC:', error.message);
    }
  }
}
