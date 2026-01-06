import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePostgis1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: Dropping extensions can be dangerous, so we'll leave it commented
    // await queryRunner.query(`DROP EXTENSION IF EXISTS postgis;`);
  }
}











