import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyPricingFields1736706100028 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hotel-specific pricing fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "standardRoomRate" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "peakSeasonRate" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "offPeakSeasonRate" decimal(18,2)`);

    // Airbnb-specific pricing fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "nightlyRate" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "weeklyRate" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "monthlyRate" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "cleaningFee" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "securityDeposit" decimal(18,2)`);

    // Land-specific pricing fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "pricePerAcre" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "pricePerHectare" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "totalLandPrice" decimal(18,2)`);

    // Commercial-specific pricing fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "pricePerSqm" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "serviceCharge" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "commercialDeposit" decimal(18,2)`);

    // Warehouse-specific pricing fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "warehouseLeaseRate" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "warehousePricePerSqm" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "warehouseDeposit" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "utilitiesIncluded" boolean`);

    // Office-specific pricing fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "pricePerWorkstation" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "officePricePerSqm" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "sharedFacilitiesCost" decimal(18,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "officeUtilitiesIncluded" boolean`);

    // General pricing fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "currency" varchar`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "negotiable" boolean`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Hotel pricing fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "standardRoomRate"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "peakSeasonRate"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "offPeakSeasonRate"`);

    // Airbnb pricing fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "nightlyRate"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "weeklyRate"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "monthlyRate"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "cleaningFee"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "securityDeposit"`);

    // Land pricing fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "pricePerAcre"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "pricePerHectare"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "totalLandPrice"`);

    // Commercial pricing fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "pricePerSqm"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "serviceCharge"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "commercialDeposit"`);

    // Warehouse pricing fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "warehouseLeaseRate"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "warehousePricePerSqm"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "warehouseDeposit"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "utilitiesIncluded"`);

    // Office pricing fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "pricePerWorkstation"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "officePricePerSqm"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "sharedFacilitiesCost"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "officeUtilitiesIncluded"`);

    // General pricing fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "currency"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "negotiable"`);
  }
}
