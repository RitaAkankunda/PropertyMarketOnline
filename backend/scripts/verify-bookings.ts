import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../.env') });

async function verifyBookings() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const isSupabase = dbHost?.includes('supabase');

  const dataSource = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'propertymarket',
    ssl: isSupabase ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    // Count total bookings
    const totalCount = await dataSource.query('SELECT COUNT(*) as count FROM bookings');
    console.log(`📊 Total bookings in database: ${totalCount[0].count}\n`);

    // Get recent bookings
    const recentBookings = await dataSource.query(`
      SELECT 
        id,
        "propertyId",
        "userId",
        type,
        status,
        name,
        email,
        phone,
        "scheduledDate",
        "scheduledTime",
        "createdAt"
      FROM bookings
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);

    if (recentBookings.length === 0) {
      console.log('⚠️  No bookings found in database');
    } else {
      console.log(`📋 Recent bookings (last ${recentBookings.length}):\n`);
      recentBookings.forEach((booking: any, index: number) => {
        console.log(`${index + 1}. Booking ID: ${booking.id}`);
        console.log(`   Property ID: ${booking.propertyId}`);
        console.log(`   User ID: ${booking.userId || 'null (guest booking)'}`);
        console.log(`   Type: ${booking.type}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Name: ${booking.name}`);
        console.log(`   Email: ${booking.email}`);
        console.log(`   Phone: ${booking.phone}`);
        console.log(`   Scheduled: ${booking.scheduledDate || 'N/A'} at ${booking.scheduledTime || 'N/A'}`);
        console.log(`   Created: ${booking.createdAt}`);
        console.log('');
      });
    }

    // Count by type
    const byType = await dataSource.query(`
      SELECT type, COUNT(*) as count
      FROM bookings
      GROUP BY type
    `);
    console.log('📈 Bookings by type:');
    byType.forEach((row: any) => {
      console.log(`   ${row.type}: ${row.count}`);
    });
    console.log('');

    // Count guest vs authenticated bookings
    const guestCount = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE "userId" IS NULL
    `);
    const authCount = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE "userId" IS NOT NULL
    `);
    console.log('👥 Bookings by user type:');
    console.log(`   Guest bookings: ${guestCount[0].count}`);
    console.log(`   Authenticated bookings: ${authCount[0].count}`);

    await dataSource.destroy();
    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyBookings();
