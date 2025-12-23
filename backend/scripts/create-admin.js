// Script to create an admin user directly
// Usage: node scripts/create-admin.js <email> <password> <firstName> <lastName>

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdmin(email, password, firstName, lastName) {
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

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      console.log(`⚠️  User with email "${email}" already exists`);
      console.log(`   Current role: ${user.role}`);
      
      if (user.role === 'admin') {
        console.log('✅ User is already an admin');
        await client.end();
        return;
      }

      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE users SET role = $1, password = $2, "firstName" = $3, "lastName" = $4 WHERE email = $5',
        ['admin', hashedPassword, firstName, lastName, email]
      );
      console.log('✅ Updated existing user to admin');
      await client.end();
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await client.query(
      `INSERT INTO users (email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, "firstName", "lastName", role`,
      [email, hashedPassword, firstName, lastName, 'admin']
    );

    const newUser = result.rows[0];
    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.firstName} ${newUser.lastName}`);
    console.log(`   Role: ${newUser.role}`);
    console.log('\n🎉 You can now login at: http://localhost:3000/auth/login');

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
const password = process.argv[3];
const firstName = process.argv[4];
const lastName = process.argv[5];

if (!email || !password || !firstName || !lastName) {
  console.log('Usage: node scripts/create-admin.js <email> <password> <firstName> <lastName>');
  console.log('\nExample:');
  console.log('  node scripts/create-admin.js admin@example.com MySecurePass123 John Doe');
  process.exit(1);
}

createAdmin(email, password, firstName, lastName);

