import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { R2Service } from '../common/r2.service';
import { EmailService } from '../common/email.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Provider } from './entities/provider.entity';
import { ProviderVerificationRequest } from './entities/provider-verification-request.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, ProviderVerificationRequest, User]),
    UsersModule,
    AuthModule,
    MulterModule.register({
      storage: memoryStorage(), // Use memory storage to get file.buffer
    }),
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService, R2Service, EmailService],
  exports: [ProvidersService],
})
export class ProvidersModule {}