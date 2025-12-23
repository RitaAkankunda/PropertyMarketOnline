import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addOfficeToEnum() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'propertymarket',
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Check if 'office' already exists in the enum
    const result = await dataSource.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'office' 
        AND enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'properties_propertytype_enum'
        )
      ) as exists;
    `);

    if (result[0].exists) {
      console.log('✅ "office" already exists in the enum');
    } else {
      // Add 'office' to the enum
      await dataSource.query(`
        ALTER TYPE properties_propertytype_enum ADD VALUE 'office';
      `);
      console.log('✅ Successfully added "office" to the enum');
    }

    await dataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addOfficeToEnum();

