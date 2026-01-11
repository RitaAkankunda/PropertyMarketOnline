import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserIdNullableInBookings1736614800023 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make userId nullable in bookings table using raw SQL
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "userId" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert userId to not nullable (but this might fail if there are null values)
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "userId" SET NOT NULL;
    `);
  }
}
