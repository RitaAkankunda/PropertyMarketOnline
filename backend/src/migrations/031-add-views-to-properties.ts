import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddViewsToProperties1736709000031 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add views column to properties table
    await queryRunner.addColumn('properties', new TableColumn({
      name: 'views',
      type: 'int',
      default: 0,
      isNullable: false,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('properties', 'views');
  }
}
