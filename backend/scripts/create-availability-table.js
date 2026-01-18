// Script to create property_availability_blocks table
require('dotenv').config();
const { Client } = require('pg');

async function createTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'propertymarket',
    ssl: process.env.DB_HOST?.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create table
    await client.query(`
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
    console.log('Table created (or already exists)');

    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_availability_blocks_property_dates"
      ON "property_availability_blocks" ("propertyId", "startDate", "endDate")
    `);
    console.log('Index created');

    // Add foreign keys (ignore errors if already exist)
    try {
      await client.query(`
        ALTER TABLE "property_availability_blocks"
        ADD CONSTRAINT "FK_property_availability_blocks_property"
        FOREIGN KEY ("propertyId") REFERENCES "properties"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);
      console.log('Property FK added');
    } catch (e) {
      if (e.code === '42710') {
        console.log('Property FK already exists');
      } else {
        throw e;
      }
    }

    try {
      await client.query(`
        ALTER TABLE "property_availability_blocks"
        ADD CONSTRAINT "FK_property_availability_blocks_user"
        FOREIGN KEY ("createdById") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
      `);
      console.log('User FK added');
    } catch (e) {
      if (e.code === '42710') {
        console.log('User FK already exists');
      } else {
        throw e;
      }
    }

    console.log('Done! property_availability_blocks table is ready.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTable();
