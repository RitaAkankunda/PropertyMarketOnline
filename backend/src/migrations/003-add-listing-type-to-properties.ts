import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListingTypeToProperties1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the listing_type enum if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'properties_listingtype_enum') THEN
          CREATE TYPE properties_listingtype_enum AS ENUM ('sale', 'rent', 'lease');
        END IF;
      END $$;
    `);

    // Add listingType column with default value
    await queryRunner.query(`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS "listingType" properties_listingtype_enum NOT NULL DEFAULT 'sale';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the column
    await queryRunner.query(`
      ALTER TABLE properties DROP COLUMN IF EXISTS "listingType";
    `);

    // Drop the enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS properties_listingtype_enum;
    `);
  }
}

