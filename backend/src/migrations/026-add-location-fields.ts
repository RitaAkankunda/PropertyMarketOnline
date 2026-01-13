import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLocationFields1736705000026 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'region',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'city',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'district',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'county',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'subcounty',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'parish',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'village',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('properties', 'village');
    await queryRunner.dropColumn('properties', 'parish');
    await queryRunner.dropColumn('properties', 'subcounty');
    await queryRunner.dropColumn('properties', 'county');
    await queryRunner.dropColumn('properties', 'district');
    await queryRunner.dropColumn('properties', 'city');
    await queryRunner.dropColumn('properties', 'region');
  }
}
