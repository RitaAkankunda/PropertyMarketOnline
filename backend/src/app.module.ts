import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { ProvidersModule } from './providers/providers.module';
import { PaymentsModule } from './payments/payments.module';
import { JobsModule } from './jobs/jobs.module';
import { MaintenanceTicketsModule } from './maintenance-tickets/maintenance-tickets.module';
import { DatabaseConfig } from './config/database.config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
    HealthModule,
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
    } catch (error) {
      console.warn('[APP MODULE] Failed to set database timezone to UTC:', error.message);
    }
  }
}
