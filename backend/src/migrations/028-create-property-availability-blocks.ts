import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePropertyAvailabilityBlocks1700000028000 implements MigrationInterface {
  name = 'CreatePropertyAvailabilityBlocks1700000028000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "property_availability_blocks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "propertyId" uuid NOT NULL,
        "createdById" uuid,
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "reason" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_property_availability_blocks" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_availability_blocks_property_dates"
      ON "property_availability_blocks" ("propertyId", "startDate", "endDate")
    `);

    // Only add constraints if they don't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_property_availability_blocks_property'
        ) THEN
          ALTER TABLE "property_availability_blocks"
          ADD CONSTRAINT "FK_property_availability_blocks_property"
          FOREIGN KEY ("propertyId") REFERENCES "properties"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_property_availability_blocks_user'
        ) THEN
          ALTER TABLE "property_availability_blocks"
          ADD CONSTRAINT "FK_property_availability_blocks_user"
          FOREIGN KEY ("createdById") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "property_availability_blocks" DROP CONSTRAINT "FK_property_availability_blocks_user"`);
    await queryRunner.query(`ALTER TABLE "property_availability_blocks" DROP CONSTRAINT "FK_property_availability_blocks_property"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_property_availability_blocks_property_dates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "property_availability_blocks"`);
  }
}
