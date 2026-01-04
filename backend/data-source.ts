import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

const dbHost = process.env.DB_HOST || 'localhost';
const isSupabase = dbHost?.includes('supabase');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'propertymarket',
  entities: [path.join(__dirname, 'src/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'src/migrations/*{.ts,.js}')],
  synchronize: false, // Always false for migrations
  logging: true,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
});

