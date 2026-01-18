import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePropertyViewsTable1705000019000 implements MigrationInterface {
  name = 'CreatePropertyViewsTable1705000019000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "property_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "propertyId" uuid NOT NULL,
        "viewerId" uuid,
        "ipAddress" varchar,
        "userAgent" varchar,
        "referrer" varchar,
        "sessionId" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_property_views" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key to properties
    await queryRunner.query(`
      ALTER TABLE "property_views" 
      ADD CONSTRAINT "FK_property_views_property" 
      FOREIGN KEY ("propertyId") 
      REFERENCES "properties"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `).catch(() => {
      console.log('FK_property_views_property already exists or properties table missing');
    });

    // Add foreign key to users (optional viewer)
    await queryRunner.query(`
      ALTER TABLE "property_views" 
      ADD CONSTRAINT "FK_property_views_viewer" 
      FOREIGN KEY ("viewerId") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `).catch(() => {
      console.log('FK_property_views_viewer already exists');
    });

    // Create indexes for efficient queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_views_propertyId" 
      ON "property_views" ("propertyId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_views_createdAt" 
      ON "property_views" ("createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_views_propertyId_createdAt" 
      ON "property_views" ("propertyId", "createdAt")
    `);

    console.log('✅ property_views table created with indexes');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "property_views"`);
  }
}
