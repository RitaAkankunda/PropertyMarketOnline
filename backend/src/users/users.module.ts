import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { PropertiesModule } from '../properties/properties.module';
import { Provider } from '../providers/entities/provider.entity';
import { ProviderVerificationRequest } from '../providers/entities/provider-verification-request.entity';
import { R2Service } from '../common/r2.service';
import { Booking } from '../bookings/entities/booking.entity';
import { Property } from '../properties/entities/property.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Provider, ProviderVerificationRequest, Booking, Property]),
    PropertiesModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, R2Service],
  exports: [UsersService],
})
export class UsersModule {}
