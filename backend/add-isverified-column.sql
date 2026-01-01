-- Add isVerified column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "isVerified" boolean NOT NULL DEFAULT false;

