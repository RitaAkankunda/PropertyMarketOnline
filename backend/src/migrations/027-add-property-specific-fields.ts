import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertySpecificFields1736706000027 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Land-specific fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "landUseType" varchar`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "topography" varchar`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "roadAccess" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "waterAvailability" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "electricityAvailability" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "titleType" varchar`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "soilQuality" varchar`);

    // Commercial-specific fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "totalFloors" integer`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "frontageWidth" decimal(10,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "ceilingHeight" decimal(10,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "loadingBays" integer`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "footTrafficLevel" varchar`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "threePhasePower" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "hvacSystem" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "fireSafety" boolean`);

    // Warehouse-specific fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "clearHeight" decimal(10,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "loadingDocks" integer`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "driveInAccess" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "floorLoadCapacity" decimal(10,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "columnSpacing" decimal(10,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "officeArea" decimal(10,2)`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "coldStorage" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "rampAccess" boolean`);

    // Office-specific fields
    await queryRunner.query(`ALTER TABLE "properties" ADD "workstationCapacity" integer`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "meetingRooms" integer`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "receptionArea" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "elevator" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "conferenceRoom" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "serverRoom" boolean`);
    await queryRunner.query(`ALTER TABLE "properties" ADD "cafeteria" boolean`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop property-specific fields
    // Land fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "landUseType"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "topography"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "roadAccess"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "waterAvailability"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "electricityAvailability"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "titleType"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "soilQuality"`);

    // Commercial fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "totalFloors"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "frontageWidth"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "ceilingHeight"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "loadingBays"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "footTrafficLevel"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "threePhasePower"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "hvacSystem"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "fireSafety"`);

    // Warehouse fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "clearHeight"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "loadingDocks"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "driveInAccess"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "floorLoadCapacity"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "columnSpacing"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "officeArea"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "coldStorage"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "rampAccess"`);

    // Office fields
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "workstationCapacity"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "meetingRooms"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "receptionArea"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "elevator"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "conferenceRoom"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "serverRoom"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "cafeteria"`);
  }
}
