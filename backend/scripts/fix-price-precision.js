const { Client } = require('pg');
require('dotenv').config();

async function fixPricePrecision() {
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

    // Check current column definition
    const checkResult = await client.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name='properties' AND column_name='price'
    `);

    if (checkResult.rows.length > 0) {
      const current = checkResult.rows[0];
      console.log('Current price column definition:');
      console.log(`  Type: ${current.data_type}`);
      console.log(`  Precision: ${current.numeric_precision}`);
      console.log(`  Scale: ${current.numeric_scale}\n`);

      if (current.numeric_precision < 18) {
        console.log('Updating price column to support larger values...');
        
        // Change the column type to support larger values
        await client.query(`
          ALTER TABLE properties 
          ALTER COLUMN price TYPE numeric(18, 2);
        `);
        
        console.log('✅ Successfully updated price column to numeric(18, 2)');
        console.log('   This now supports prices up to 999,999,999,999,999,999.99');
      } else {
        console.log('✅ Price column already has sufficient precision');
      }
    } else {
      console.log('❌ Price column not found');
    }

    await client.end();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPricePrecision();

