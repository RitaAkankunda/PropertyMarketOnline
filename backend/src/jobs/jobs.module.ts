import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { UsersModule } from 'src/users/users.module';
import { R2Service } from 'src/common/r2.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    UsersModule,
    MulterModule.register({
      storage: memoryStorage(), // Use memory storage to get file.buffer
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, R2Service],
  exports: [JobsService],
})
export class JobsModule {}

