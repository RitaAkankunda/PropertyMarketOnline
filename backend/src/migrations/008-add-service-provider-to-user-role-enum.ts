import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceProviderToUserRoleEnum1700000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'service_provider' to the users role enum if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'service_provider' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'users_role_enum'
          )
        ) THEN
          ALTER TYPE users_role_enum ADD VALUE 'service_provider';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // You would need to recreate the enum or use a different approach
    // For now, we'll leave this empty as removing enum values is complex
    console.warn('Removing enum values is not supported. Manual database intervention required.');
  }
}

