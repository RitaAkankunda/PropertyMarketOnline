import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../.env') });

async function verifyBookingNotifications() {
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

    // Get the most recent booking
    const recentBooking = await dataSource.query(`
      SELECT 
        id,
        "propertyId",
        "userId",
        type,
        name,
        email,
        "createdAt"
      FROM bookings
      ORDER BY "createdAt" DESC
      LIMIT 1
    `);

    if (recentBooking.length === 0) {
      console.log('⚠️  No bookings found');
      await dataSource.destroy();
      return;
    }

    const booking = recentBooking[0];
    console.log('📋 Most recent booking:');
    console.log(`   Booking ID: ${booking.id}`);
    console.log(`   Property ID: ${booking.propertyId}`);
    console.log(`   Type: ${booking.type}`);
    console.log(`   Guest: ${booking.name} (${booking.email})`);
    console.log(`   Created: ${booking.createdAt}\n`);

    // Get property owner
    const property = await dataSource.query(`
      SELECT 
        id,
        title,
        "ownerId"
      FROM properties
      WHERE id = $1
    `, [booking.propertyId]);

    if (property.length === 0) {
      console.log('❌ Property not found!');
      await dataSource.destroy();
      return;
    }

    const propertyData = property[0];
    console.log('🏠 Property details:');
    console.log(`   Property: ${propertyData.title}`);
    console.log(`   Owner ID: ${propertyData.ownerId}\n`);

    // Check for notifications for this owner
    // Note: Enum values in database are lowercase (booking_created, not BOOKING_CREATED)
    const notifications = await dataSource.query(`
      SELECT 
        id,
        "userId",
        type,
        title,
        message,
        data,
        "isRead",
        "createdAt"
      FROM notifications
      WHERE "userId" = $1
        AND type = 'booking_created'
        AND (data->>'bookingId')::text = $2
      ORDER BY "createdAt" DESC
    `, [propertyData.ownerId, booking.id]);

    if (notifications.length === 0) {
      console.log('⚠️  No notification found for this booking!');
      console.log(`   Expected notification for owner: ${propertyData.ownerId}`);
      console.log(`   Expected booking ID in notification data: ${booking.id}\n`);
      
      // Check if there are any BOOKING_CREATED notifications at all
      const anyBookingNotifications = await dataSource.query(`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE type = 'BOOKING_CREATED'
      `);
      console.log(`   Total BOOKING_CREATED notifications in database: ${anyBookingNotifications[0].count}`);
      
      // Check recent notifications for this owner
      const ownerNotifications = await dataSource.query(`
        SELECT 
          id,
          type,
          title,
          message,
          "createdAt"
        FROM notifications
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 5
      `, [propertyData.ownerId]);
      
      if (ownerNotifications.length > 0) {
        console.log(`\n   Recent notifications for this owner (${ownerNotifications.length}):`);
        ownerNotifications.forEach((n: any, idx: number) => {
          console.log(`   ${idx + 1}. ${n.type}: ${n.title} (${n.createdAt})`);
        });
      }
    } else {
      const notification = notifications[0];
      console.log('✅ Notification found!');
      console.log(`   Notification ID: ${notification.id}`);
      console.log(`   Type: ${notification.type}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Is Read: ${notification.isRead}`);
      console.log(`   Created: ${notification.createdAt}`);
      console.log(`   Data: ${JSON.stringify(notification.data, null, 2)}`);
    }

    // Count all notifications for this owner
    const totalNotifications = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE "userId" = $1
    `, [propertyData.ownerId]);
    console.log(`\n📊 Total notifications for property owner: ${totalNotifications[0].count}`);

    await dataSource.destroy();
    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyBookingNotifications();
