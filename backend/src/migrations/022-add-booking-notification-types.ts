import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingNotificationTypes1736614800022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find the actual enum type name used by TypeORM
    const enumResult = await queryRunner.query(`
      SELECT t.typname 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE e.enumlabel = 'job_created' 
      LIMIT 1;
    `);

    if (enumResult && enumResult.length > 0) {
      const enumTypeName = enumResult[0].typname;
      
      // Add new notification types to the enum
      await queryRunner.query(`
        ALTER TYPE "${enumTypeName}" 
        ADD VALUE IF NOT EXISTS 'booking_created';
      `);
      
      await queryRunner.query(`
        ALTER TYPE "${enumTypeName}" 
        ADD VALUE IF NOT EXISTS 'booking_confirmed';
      `);
      
      await queryRunner.query(`
        ALTER TYPE "${enumTypeName}" 
        ADD VALUE IF NOT EXISTS 'booking_cancelled';
      `);
      
      await queryRunner.query(`
        ALTER TYPE "${enumTypeName}" 
        ADD VALUE IF NOT EXISTS 'booking_status_updated';
      `);
    } else {
      console.warn('[MIGRATION] Could not find notification enum type. Skipping enum value addition.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This migration cannot be fully reversed without recreating the enum
    console.warn('Cannot remove enum values. Manual intervention required if rollback is needed.');
  }
}
