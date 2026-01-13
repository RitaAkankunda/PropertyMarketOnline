import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPriceBreakdownFields1736708000030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add price breakdown fields to properties table
    await queryRunner.addColumns('properties', [
      new TableColumn({
        name: 'basePrice',
        type: 'decimal',
        precision: 18,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'serviceFee',
        type: 'decimal',
        precision: 18,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'tax',
        type: 'decimal',
        precision: 18,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'otherFees',
        type: 'decimal',
        precision: 18,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'priceBreakdown',
        type: 'text',
        isNullable: true,
      }),
    ]);

    // Set basePrice to current price for existing properties
    await queryRunner.query(`
      UPDATE properties 
      SET "basePrice" = price 
      WHERE "basePrice" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('properties', [
      'basePrice',
      'serviceFee',
      'tax',
      'otherFees',
      'priceBreakdown',
    ]);
  }
}
