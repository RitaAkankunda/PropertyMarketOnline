import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertTimestampsToTimestamptz1700000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Convert all timestamp columns to timestamptz (timestamp with timezone)
    // Existing timestamps were stored in the server's local timezone (EAT, UTC+3)
    // We need to convert them to UTC by treating them as EAT and converting to UTC
    
    // Convert users table timestamps
    // Assuming existing timestamps are in EAT (UTC+3), convert to UTC
    // AT TIME ZONE 'Africa/Nairobi' treats the timestamp as EAT and converts to UTC
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN "createdAt" TYPE timestamptz USING ("createdAt" AT TIME ZONE 'Africa/Nairobi'),
      ALTER COLUMN "updatedAt" TYPE timestamptz USING ("updatedAt" AT TIME ZONE 'Africa/Nairobi');
    `);

    // Convert providers table timestamps
    await queryRunner.query(`
      ALTER TABLE providers 
      ALTER COLUMN "createdAt" TYPE timestamptz USING ("createdAt" AT TIME ZONE 'Africa/Nairobi'),
      ALTER COLUMN "updatedAt" TYPE timestamptz USING ("updatedAt" AT TIME ZONE 'Africa/Nairobi');
    `);

    // Convert properties table timestamps (if exists)
    const propertiesTable = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'properties'
      );
    `);
    
    if (propertiesTable[0]?.exists) {
      await queryRunner.query(`
        ALTER TABLE properties 
        ALTER COLUMN "createdAt" TYPE timestamptz USING ("createdAt" AT TIME ZONE 'Africa/Nairobi'),
        ALTER COLUMN "updatedAt" TYPE timestamptz USING ("updatedAt" AT TIME ZONE 'Africa/Nairobi');
      `);
    }

    // Convert jobs table timestamps (if exists)
    const jobsTable = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs'
      );
    `);
    
    if (jobsTable[0]?.exists) {
      await queryRunner.query(`
        ALTER TABLE jobs 
        ALTER COLUMN "createdAt" TYPE timestamptz USING ("createdAt" AT TIME ZONE 'Africa/Nairobi'),
        ALTER COLUMN "updatedAt" TYPE timestamptz USING ("updatedAt" AT TIME ZONE 'Africa/Nairobi');
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert timestamptz back to timestamp (without timezone)
    // Note: This will lose timezone information
    
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN "createdAt" TYPE timestamp USING "createdAt",
      ALTER COLUMN "updatedAt" TYPE timestamp USING "updatedAt";
    `);

    await queryRunner.query(`
      ALTER TABLE providers 
      ALTER COLUMN "createdAt" TYPE timestamp USING "createdAt",
      ALTER COLUMN "updatedAt" TYPE timestamp USING "updatedAt";
    `);

    const propertiesTable = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'properties'
      );
    `);
    
    if (propertiesTable[0]?.exists) {
      await queryRunner.query(`
        ALTER TABLE properties 
        ALTER COLUMN "createdAt" TYPE timestamp USING "createdAt",
        ALTER COLUMN "updatedAt" TYPE timestamp USING "updatedAt";
      `);
    }

    const jobsTable = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs'
      );
    `);
    
    if (jobsTable[0]?.exists) {
      await queryRunner.query(`
        ALTER TABLE jobs 
        ALTER COLUMN "createdAt" TYPE timestamp USING "createdAt",
        ALTER COLUMN "updatedAt" TYPE timestamp USING "updatedAt";
      `);
    }
  }
}

