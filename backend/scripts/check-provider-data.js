const { Client } = require('pg');
require('dotenv').config();

async function checkProviderData() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_HOST?.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const result = await client.query(`
      SELECT 
        id, 
        "businessName", 
        "serviceTypes",
        pg_typeof("serviceTypes") as array_type
      FROM providers 
      LIMIT 5
    `);

    console.log('📋 Providers in database:');
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ${row.businessName}:`);
      console.log(`   serviceTypes: ${JSON.stringify(row.serviceTypes)}`);
      console.log(`   Type: ${row.array_type}`);
      console.log(`   Is Array: ${Array.isArray(row.serviceTypes)}`);
      
      // Test the filter query
      if (row.serviceTypes && row.serviceTypes.length > 0) {
        const testType = row.serviceTypes[0];
        console.log(`   First service type: "${testType}"`);
        
        // Test if 'plumber' would match
        const testQuery = `SELECT :serviceType = ANY("serviceTypes") as matches FROM providers WHERE id = :id`;
      }
    });

    // Test the filter query
    console.log('\n🔍 Testing filter queries:');
    const testQueries = ['plumber', 'electrician', 'interior_designer'];
    
    for (const testType of testQueries) {
      try {
        const filterResult = await client.query(
          `SELECT COUNT(*) as count FROM providers WHERE $1::text = ANY("serviceTypes")`,
          [testType]
        );
        console.log(`   "${testType}": ${filterResult.rows[0].count} providers`);
      } catch (err) {
        console.log(`   "${testType}": Error - ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkProviderData();

