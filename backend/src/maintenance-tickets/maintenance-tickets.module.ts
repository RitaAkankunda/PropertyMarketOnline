import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceTicketsService } from './maintenance-tickets.service';
import { MaintenanceTicketsController } from './maintenance-tickets.controller';
import { MaintenanceTicket } from './entities/maintenance-ticket.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceTicket]), UsersModule],
  controllers: [MaintenanceTicketsController],
  providers: [MaintenanceTicketsService],
  exports: [MaintenanceTicketsService],
})
export class MaintenanceTicketsModule {}

