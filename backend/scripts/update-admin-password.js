// Script to update admin password
const { Client } = require('pg');
require('dotenv').config();

async function updateAdminPassword() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const hashedPassword = '$2b$10$MSKJsM95LX37CvsoWriu.eZLar5FX1WidiBPat8.YDCUhBB4tCOpq';

    const result = await client.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, 'admin@propertymarket.com']
    );

    console.log('✅ Admin password updated successfully');
    console.log('📧 Email: admin@propertymarket.com');
    console.log('🔑 Password: Secure123');
    console.log('📊 Rows affected:', result.rowCount);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateAdminPassword();