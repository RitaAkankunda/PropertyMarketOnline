// Script to check if a user exists and their role
// Usage: node scripts/check-user.js <email>

const { Client } = require('pg');
require('dotenv').config();

async function checkUser(email) {
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

    const result = await client.query(
      'SELECT id, email, "firstName", "lastName", role, "createdAt" FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`❌ User with email "${email}" NOT FOUND in database`);
      console.log('\n💡 To create this user:');
      console.log('   1. Go to http://localhost:3000/auth/register');
      console.log('   2. Register with this email');
      console.log('   3. Then promote to admin using: POST /users/admin/seed');
    } else {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      
      if (user.role !== 'admin') {
        console.log('\n⚠️  User is NOT an admin');
        console.log('💡 To promote to admin, use:');
        console.log(`   POST http://localhost:3001/api/users/admin/seed`);
        console.log(`   Headers: x-seed-token: <your-token>`);
        console.log(`   Body: { "email": "${email}" }`);
      } else {
        console.log('\n✅ User is an ADMIN');
      }
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/check-user.js <email>');
  console.log('Example: node scripts/check-user.js admin@example.com');
  process.exit(1);
}

checkUser(email);

