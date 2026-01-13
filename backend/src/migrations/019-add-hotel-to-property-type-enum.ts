import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHotelToPropertyTypeEnum1736614800019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'hotel' to the property type enum if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'hotel' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'properties_propertytype_enum'
          )
        ) THEN
          ALTER TYPE properties_propertytype_enum ADD VALUE 'hotel';
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
