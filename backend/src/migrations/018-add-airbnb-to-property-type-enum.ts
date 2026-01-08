import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAirbnbToPropertyTypeEnum1736294400018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'airbnb' to the property type enum if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'airbnb' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'properties_propertytype_enum'
          )
        ) THEN
          ALTER TYPE properties_propertytype_enum ADD VALUE 'airbnb';
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
