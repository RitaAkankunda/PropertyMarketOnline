/**
 * Script to create the property_views table for tracking views with timestamps
 * Run with: node scripts/create-property-views-table.js
 */

const { Client } = require('pg');
require('dotenv').config();

async function createPropertyViewsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create the property_views table
    await client.query(`
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
    console.log('✅ property_views table created');

    // Add foreign key to properties
    try {
      await client.query(`
        ALTER TABLE "property_views" 
        ADD CONSTRAINT "FK_property_views_property" 
        FOREIGN KEY ("propertyId") 
        REFERENCES "properties"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);
      console.log('✅ Added foreign key to properties');
    } catch (err) {
      if (err.code === '42710') {
        console.log('ℹ️  Foreign key FK_property_views_property already exists');
      } else {
        console.log('⚠️  Could not add FK to properties:', err.message);
      }
    }

    // Add foreign key to users (optional viewer)
    try {
      await client.query(`
        ALTER TABLE "property_views" 
        ADD CONSTRAINT "FK_property_views_viewer" 
        FOREIGN KEY ("viewerId") 
        REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
      `);
      console.log('✅ Added foreign key to users');
    } catch (err) {
      if (err.code === '42710') {
        console.log('ℹ️  Foreign key FK_property_views_viewer already exists');
      } else {
        console.log('⚠️  Could not add FK to users:', err.message);
      }
    }

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_views_propertyId" 
      ON "property_views" ("propertyId")
    `);
    console.log('✅ Index on propertyId created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_views_createdAt" 
      ON "property_views" ("createdAt")
    `);
    console.log('✅ Index on createdAt created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_views_propertyId_createdAt" 
      ON "property_views" ("propertyId", "createdAt")
    `);
    console.log('✅ Composite index on propertyId + createdAt created');

    // Show table info
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'property_views'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 property_views table structure:');
    console.table(result.rows);

    console.log('\n✅ All done! property_views table is ready for tracking views.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

createPropertyViewsTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
