// Script to create a new admin user directly (admin-only endpoint)
// Usage: node scripts/create-admin-user.js <email> <password> <firstName> <lastName>

const axios = require('axios');
require('dotenv').config();

async function createAdminUser(email, password, firstName, lastName) {
  const baseUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace('3001', '3002') : 'http://localhost:3002';

  // First, we need to login as an existing admin to get a token
  // For this demo, we'll assume there's an admin user with known credentials
  // In a real scenario, you'd need to provide admin credentials

  console.log('⚠️  This script requires an existing admin user to authenticate');
  console.log('Please provide admin credentials to create a new admin user via API\n');

  console.log('📋 New admin user details:');
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${firstName} ${lastName}`);
  console.log(`   Role: admin\n`);

  console.log('🔗 API Endpoint: POST /api/users/admin/users');
  console.log(`   URL: ${baseUrl}/api/users/admin/users`);
  console.log('   Headers: Authorization: Bearer <admin-jwt-token>');
  console.log('   Body:');
  console.log(`   {`);
  console.log(`     "email": "${email}",`);
  console.log(`     "password": "${password}",`);
  console.log(`     "firstName": "${firstName}",`);
  console.log(`     "lastName": "${lastName}",`);
  console.log(`     "role": "admin"`);
  console.log(`   }\n`);

  console.log('💡 To use this endpoint:');
  console.log('   1. Login as an admin user to get a JWT token');
  console.log('   2. Use the token in the Authorization header');
  console.log('   3. Make a POST request to the endpoint above');
  console.log('   4. Or use a tool like Postman/Insomnia\n');

  console.log('🔧 Alternative: Use the existing script method:');
  console.log(`   node scripts/create-admin.js ${email} ${password} ${firstName} ${lastName}`);
}

const args = process.argv.slice(2);
if (args.length !== 4) {
  console.log('Usage: node scripts/create-admin-user.js <email> <password> <firstName> <lastName>');
  console.log('Example: node scripts/create-admin-user.js newadmin@example.com mypassword123 John Doe');
  process.exit(1);
}

const [email, password, firstName, lastName] = args;
createAdminUser(email, password, firstName, lastName);