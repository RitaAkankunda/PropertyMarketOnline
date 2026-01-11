-- Direct SQL to make userId nullable in bookings table
ALTER TABLE "bookings" ALTER COLUMN "userId" DROP NOT NULL;
