/**
 * Script to add isVerified column to properties table
 * Run with: node scripts/add-isverified-column.js
 */

require('dotenv').config();
const { Client } = require('pg');

async function addIsVerifiedColumn() {
  // Get connection from environment variables
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || 5432;
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;
  
  if (!host || !user || !password || !database) {
    console.error('ERROR: Missing database configuration in environment');
    console.error('Required: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE');
    process.exit(1);
  }

  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: host.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'properties' AND column_name = 'isVerified'
    `);

    if (checkResult.rows.length > 0) {
      console.log('Column "isVerified" already exists in properties table');
      return;
    }

    // Add the column
    console.log('Adding "isVerified" column to properties table...');
    await client.query(`
      ALTER TABLE properties 
      ADD COLUMN "isVerified" BOOLEAN DEFAULT false
    `);

    console.log('✅ Successfully added "isVerified" column to properties table!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

addIsVerifiedColumn();
