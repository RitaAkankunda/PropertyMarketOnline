import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateJobsTable1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for job status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "job_status_enum" AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'jobs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'clientId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'providerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'serviceType',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'images',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'location',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'scheduledDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'scheduledTime',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'job_status_enum',
            default: "'pending'",
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'UGX'",
          },
          {
            name: 'depositPaid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'review',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cancellationReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'jobs',
      new TableForeignKey({
        columnNames: ['clientId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'jobs',
      new TableForeignKey({
        columnNames: ['providerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_jobs_clientId" ON "jobs" ("clientId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_jobs_providerId" ON "jobs" ("providerId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_jobs_status" ON "jobs" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_jobs_serviceType" ON "jobs" ("serviceType");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('jobs');
    await queryRunner.query(`DROP TYPE IF EXISTS "job_status_enum";`);
  }
}

