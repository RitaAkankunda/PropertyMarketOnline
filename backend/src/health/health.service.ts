import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check() {
    let dbStatus = 'disconnected';
    let postgisEnabled = false;

    try {
      // Check database connection
      if (this.dataSource.isInitialized) {
        dbStatus = 'connected';

        // Check if PostGIS extension is enabled
        const result = await this.dataSource.query(
          "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis') as postgis_enabled",
        );
        postgisEnabled = result[0]?.postgis_enabled || false;
      }
    } catch (error) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        postgis: postgisEnabled ? 'enabled' : 'disabled',
      },
    };
  }
}











