// Simple Node.js script to add 'office' to the enum
// Run with: node scripts/add-office-enum-simple.js

const { Client } = require('pg');
require('dotenv').config();

async function addOfficeToEnum() {
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

    // Check if 'office' already exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'office' 
        AND enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'properties_propertytype_enum'
        )
      ) as exists;
    `);

    if (checkResult.rows[0].exists) {
      console.log('✅ "office" already exists in the enum');
    } else {
      // Add 'office' to the enum
      await client.query(`
        ALTER TYPE properties_propertytype_enum ADD VALUE 'office';
      `);
      console.log('✅ Successfully added "office" to the enum');
    }

    await client.end();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addOfficeToEnum();

