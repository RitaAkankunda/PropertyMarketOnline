import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProvidersTable1700000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'providers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'businessName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'serviceTypes',
            type: 'text',
            isArray: true,
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'pricing',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'availability',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'portfolio',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'certifications',
            type: 'jsonb',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0,
          },
          {
            name: 'reviewCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'completedJobs',
            type: 'integer',
            default: 0,
          },
          {
            name: 'isVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isKycVerified',
            type: 'boolean',
            default: false,
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

    // Create foreign key
    await queryRunner.createForeignKey(
      'providers',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'providers',
      new TableIndex({
        name: 'IDX_PROVIDERS_USER_ID',
        columnNames: ['userId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'providers',
      new TableIndex({
        name: 'IDX_PROVIDERS_VERIFIED',
        columnNames: ['isVerified'],
      }),
    );

    await queryRunner.createIndex(
      'providers',
      new TableIndex({
        name: 'IDX_PROVIDERS_RATING',
        columnNames: ['rating'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('providers');
  }
}

