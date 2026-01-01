
import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { R2Service } from '../common/r2.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property]),
    MulterModule.register({
      storage: memoryStorage(), // Use memory storage to get file.buffer
    }),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, R2Service],
  exports: [PropertiesService], // ← Added this export
})
export class PropertiesModule {}
