// Simple Node.js script to add listingType to properties table
// Run with: node scripts/add-listing-type.js

const { Client } = require('pg');
require('dotenv').config();

async function addListingType() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'propertymarket',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create the enum type if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'properties_listingtype_enum') THEN
          CREATE TYPE properties_listingtype_enum AS ENUM ('sale', 'rent', 'lease');
          RAISE NOTICE 'Created enum type properties_listingtype_enum';
        ELSE
          RAISE NOTICE 'Enum type properties_listingtype_enum already exists';
        END IF;
      END $$;
    `);
    console.log('✅ Enum type checked/created');

    // Check if column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='properties' AND column_name='listingType';
    `);

    if (columnCheck.rows.length === 0) {
      // Add listingType column with default value
      await client.query(`
        ALTER TABLE properties 
        ADD COLUMN "listingType" properties_listingtype_enum NOT NULL DEFAULT 'sale';
      `);
      console.log('✅ Added listingType column to properties table');
    } else {
      console.log('✅ listingType column already exists');
    }

    await client.end();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addListingType();

