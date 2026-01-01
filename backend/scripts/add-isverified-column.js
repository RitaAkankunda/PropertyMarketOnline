const { Client } = require('pg');
require('dotenv').config();

async function addIsVerifiedColumn() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'propertymarket',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='isVerified'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Column "isVerified" already exists in users table');
    } else {
      // Add the column
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN "isVerified" boolean NOT NULL DEFAULT false;
      `);
      console.log('✅ Successfully added "isVerified" column to users table');
    }

    await client.end();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addIsVerifiedColumn();

