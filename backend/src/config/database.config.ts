import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { Job } from '../jobs/entities/job.entity';
import { MaintenanceTicket } from '../maintenance-tickets/entities/maintenance-ticket.entity';
import { Provider } from '../providers/entities/provider.entity';
import { ProviderVerificationRequest } from '../providers/entities/provider-verification-request.entity';
import { ServiceCategory } from '../categories/entities/service-category.entity';
import { Review } from '../reviews/entities/review.entity';
import { Conversation } from '../messages/entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbHost = this.configService.get<string>('DB_HOST', 'localhost');
    const isSupabase = dbHost?.includes('supabase');

    return {
      type: 'postgres',
      host: dbHost,
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_DATABASE', 'propertymarket'),
      entities: [User, Property, Job, MaintenanceTicket, Provider, ProviderVerificationRequest, ServiceCategory, Review, Conversation, Message],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: false, // Disabled - use migrations
      logging: this.configService.get<string>('NODE_ENV') === 'development',
      ssl: isSupabase ? { rejectUnauthorized: false } : false,
      extra: {
        // PostGIS extension will be enabled via migration
        // Run: CREATE EXTENSION IF NOT EXISTS postgis;
        // Set timezone to UTC for PostgreSQL connection
        // This ensures all timestamps are interpreted as UTC
        connectionLimit: 10,
      },
      // Note: Timezone is set to UTC in AppModule.onModuleInit()
      // This ensures all queries use UTC timezone
    };
  }
}







