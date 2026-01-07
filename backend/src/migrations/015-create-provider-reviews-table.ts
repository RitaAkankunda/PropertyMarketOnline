import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateProviderReviewsTable1700000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'provider_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'providerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isHidden',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create unique index: one review per user per provider
    await queryRunner.createIndex(
      'provider_reviews',
      new TableIndex({
        name: 'IDX_provider_reviews_provider_reviewer',
        columnNames: ['providerId', 'reviewerId'],
        isUnique: true,
      }),
    );

    // Create foreign key to providers table
    await queryRunner.createForeignKey(
      'provider_reviews',
      new TableForeignKey({
        columnNames: ['providerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'providers',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'provider_reviews',
      new TableForeignKey({
        columnNames: ['reviewerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create index for faster queries
    await queryRunner.createIndex(
      'provider_reviews',
      new TableIndex({
        name: 'IDX_provider_reviews_provider',
        columnNames: ['providerId'],
      }),
    );

    await queryRunner.createIndex(
      'provider_reviews',
      new TableIndex({
        name: 'IDX_provider_reviews_reviewer',
        columnNames: ['reviewerId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('provider_reviews');
  }
}

