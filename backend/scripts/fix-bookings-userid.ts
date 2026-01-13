import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../.env') });

async function fixBookingsUserId() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const isSupabase = dbHost?.includes('supabase');

  console.log('🔧 Connecting to database...');
  console.log('   Host:', dbHost);
  console.log('   Database:', process.env.DB_DATABASE || 'propertymarket');

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
    console.log('✅ Database connected');

    // Run the SQL to make userId nullable
    await dataSource.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "userId" DROP NOT NULL;
    `);

    console.log('✅ Successfully made userId column nullable in bookings table');
    
    // Verify the change
    const result = await dataSource.query(`
      SELECT 
        column_name, 
        is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'userId';
    `);
    
    console.log('📊 Column status:', result[0]);
    
    await dataSource.destroy();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixBookingsUserId();
