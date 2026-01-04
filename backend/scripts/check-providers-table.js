const { Client } = require('pg');
require('dotenv').config();

async function checkProvidersTable() {
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
    console.log('✅ Connected to database');

    // Check if providers table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'providers'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Providers table exists');
      
      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'providers'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Table columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      // Check if there are any providers
      const count = await client.query('SELECT COUNT(*) FROM providers');
      console.log(`\n📊 Total providers: ${count.rows[0].count}`);

      // Check foreign key constraint
      const fkCheck = await client.query(`
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'providers';
      `);

      if (fkCheck.rows.length > 0) {
        console.log('\n🔗 Foreign keys:');
        fkCheck.rows.forEach(fk => {
          console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
    } else {
      console.log('❌ Providers table does NOT exist!');
      console.log('   Run migration: npm run migration:run');
    }

    // Check if users table exists (needed for foreign key)
    const usersCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (usersCheck.rows[0].exists) {
      console.log('\n✅ Users table exists');
    } else {
      console.log('\n❌ Users table does NOT exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

checkProvidersTable();

