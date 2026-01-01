import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsverifiedToUsers1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isVerified column to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "isVerified" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove isVerified column
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "isVerified";
    `);
  }
}

