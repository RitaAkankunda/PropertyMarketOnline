import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddHotelAndPropertyFields1736700000025 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'bathrooms',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'parking',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'area',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'areaUnit',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'yearBuilt',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'furnished',
        type: 'boolean',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'amenities',
        type: 'text',
        isNullable: true,
      }),
    );

    // Hotel-specific fields
    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'totalRooms',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'starRating',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'checkInTime',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'checkOutTime',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('properties', 'checkOutTime');
    await queryRunner.dropColumn('properties', 'checkInTime');
    await queryRunner.dropColumn('properties', 'starRating');
    await queryRunner.dropColumn('properties', 'totalRooms');
    await queryRunner.dropColumn('properties', 'amenities');
    await queryRunner.dropColumn('properties', 'furnished');
    await queryRunner.dropColumn('properties', 'yearBuilt');
    await queryRunner.dropColumn('properties', 'areaUnit');
    await queryRunner.dropColumn('properties', 'area');
    await queryRunner.dropColumn('properties', 'parking');
    await queryRunner.dropColumn('properties', 'bathrooms');
  }
}
