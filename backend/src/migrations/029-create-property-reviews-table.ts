import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePropertyReviewsTable1736707000029 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'property_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'propertyId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reviewerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'bookingId',
            type: 'uuid',
            isNullable: true,
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
            name: 'cleanlinessRating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'locationRating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'valueRating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'communicationRating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'ownerResponse',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'respondedAt',
            type: 'timestamptz',
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

    // Create unique index: one review per user per property
    await queryRunner.createIndex(
      'property_reviews',
      new TableIndex({
        name: 'IDX_property_reviews_property_reviewer',
        columnNames: ['propertyId', 'reviewerId'],
        isUnique: true,
      }),
    );

    // Create unique index: one review per booking (using raw SQL for WHERE clause)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_property_reviews_booking" 
      ON "property_reviews" ("bookingId") 
      WHERE "bookingId" IS NOT NULL
    `);

    // Create foreign key to properties table
    await queryRunner.createForeignKey(
      'property_reviews',
      new TableForeignKey({
        columnNames: ['propertyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'properties',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to users table (reviewer)
    await queryRunner.createForeignKey(
      'property_reviews',
      new TableForeignKey({
        columnNames: ['reviewerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to bookings table (optional)
    await queryRunner.createForeignKey(
      'property_reviews',
      new TableForeignKey({
        columnNames: ['bookingId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bookings',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes for faster queries
    await queryRunner.createIndex(
      'property_reviews',
      new TableIndex({
        name: 'IDX_property_reviews_property',
        columnNames: ['propertyId'],
      }),
    );

    await queryRunner.createIndex(
      'property_reviews',
      new TableIndex({
        name: 'IDX_property_reviews_reviewer',
        columnNames: ['reviewerId'],
      }),
    );

    await queryRunner.createIndex(
      'property_reviews',
      new TableIndex({
        name: 'IDX_property_reviews_rating',
        columnNames: ['rating'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('property_reviews');
  }
}
