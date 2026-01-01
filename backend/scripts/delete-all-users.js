// Script to delete all users from the database
// Usage: node scripts/delete-all-users.js

const { Client } = require('pg');
require('dotenv').config();

async function deleteAllUsers() {
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

    // Get count of users before deletion
    const countResult = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = countResult.rows[0].count;
    console.log(`📊 Found ${userCount} users in database`);

    // Get count of properties
    const propCountResult = await client.query('SELECT COUNT(*) as count FROM properties');
    const propCount = propCountResult.rows[0].count;
    console.log(`📊 Found ${propCount} properties in database`);

    if (userCount === 0) {
      console.log('ℹ️  No users to delete');
      await client.end();
      return;
    }

    // Delete all properties first (due to foreign key constraint)
    if (propCount > 0) {
      await client.query('DELETE FROM properties');
      console.log('✅ All properties deleted successfully');
    }

    // Delete all users
    await client.query('DELETE FROM users');
    console.log('✅ All users deleted successfully');

    // Verify deletion
    const verifyResult = await client.query('SELECT COUNT(*) as count FROM users');
    const remainingCount = verifyResult.rows[0].count;
    console.log(`📊 Remaining users: ${remainingCount}`);

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Confirm before running
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  This will delete ALL users from the database. Are you sure? (type "yes" to confirm): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    deleteAllUsers();
  } else {
    console.log('❌ Operation cancelled');
  }
  rl.close();
});