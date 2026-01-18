import { DataSource } from 'typeorm';

export async function createPaymentsTables(dataSource: DataSource): Promise<void> {
  console.log('[PAYMENTS] Checking/creating payments tables...');

  try {
    // Create payment_status enum
    await dataSource.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_status_enum" AS ENUM (
          'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create payment_type enum
    await dataSource.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_type_enum" AS ENUM (
          'booking', 'rent', 'deposit', 'viewing', 'service_fee', 'commission', 'refund'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create payment_method_type enum
    await dataSource.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_method_type_enum" AS ENUM (
          'mtn_momo', 'airtel_money', 'card', 'bank_transfer', 'cash'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create payments table
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "propertyId" uuid,
        "bookingId" uuid,
        "type" "payment_type_enum" NOT NULL,
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "paymentMethod" "payment_method_type_enum" NOT NULL,
        "amount" decimal(18,2) NOT NULL,
        "currency" varchar NOT NULL DEFAULT 'UGX',
        "transactionRef" varchar,
        "externalRef" varchar,
        "phoneNumber" varchar,
        "description" text,
        "metadata" jsonb,
        "failureReason" text,
        "refundedAmount" decimal(18,2),
        "refundedAt" timestamp,
        "refundReason" varchar,
        "receiptNumber" varchar UNIQUE,
        "completedAt" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    // Create payment_methods table
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "payment_methods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" "payment_method_type_enum" NOT NULL,
        "name" varchar NOT NULL,
        "phoneNumber" varchar,
        "last4" varchar,
        "cardBrand" varchar,
        "expiryMonth" integer,
        "expiryYear" integer,
        "bankName" varchar,
        "accountNumber" varchar,
        "isDefault" boolean NOT NULL DEFAULT false,
        "isVerified" boolean NOT NULL DEFAULT false,
        "stripePaymentMethodId" varchar,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_methods" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints (only if they don't exist)
    await dataSource.query(`
      DO $$ BEGIN
        ALTER TABLE "payments" 
        ADD CONSTRAINT "FK_payments_userId" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await dataSource.query(`
      DO $$ BEGIN
        ALTER TABLE "payments" 
        ADD CONSTRAINT "FK_payments_propertyId" 
        FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await dataSource.query(`
      DO $$ BEGIN
        ALTER TABLE "payments" 
        ADD CONSTRAINT "FK_payments_bookingId" 
        FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await dataSource.query(`
      DO $$ BEGIN
        ALTER TABLE "payment_methods" 
        ADD CONSTRAINT "FK_payment_methods_userId" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create indexes for better query performance
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_userId" ON "payments" ("userId")
    `);

    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_status" ON "payments" ("status")
    `);

    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_userId_createdAt" ON "payments" ("userId", "createdAt")
    `);

    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_status_createdAt" ON "payments" ("status", "createdAt")
    `);

    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_methods_userId" ON "payment_methods" ("userId")
    `);

    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_methods_userId_isDefault" ON "payment_methods" ("userId", "isDefault")
    `);

    console.log('[PAYMENTS] ✅ Payments tables ready');
  } catch (error) {
    console.error('[PAYMENTS] ❌ Error creating payments tables:', error.message);
    throw error;
  }
}
