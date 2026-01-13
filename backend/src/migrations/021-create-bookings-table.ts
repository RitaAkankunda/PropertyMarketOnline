import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateBookingsTable1736614800021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bookings',
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
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['viewing', 'inquiry', 'booking'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
            default: "'pending'",
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'scheduledDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'scheduledTime',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'checkInDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'checkOutDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'guests',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'moveInDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'leaseDuration',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'occupants',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'offerAmount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'financingType',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'businessType',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'spaceRequirements',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'leaseTerm',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'paymentAmount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'paymentStatus',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            isNullable: true,
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

    // Create foreign keys
    await queryRunner.createForeignKey(
      'bookings',
      new TableForeignKey({
        columnNames: ['propertyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'properties',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bookings',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'bookings',
      new TableIndex({
        name: 'IDX_bookings_propertyId',
        columnNames: ['propertyId'],
      }),
    );

    await queryRunner.createIndex(
      'bookings',
      new TableIndex({
        name: 'IDX_bookings_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'bookings',
      new TableIndex({
        name: 'IDX_bookings_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('bookings');
  }
}
