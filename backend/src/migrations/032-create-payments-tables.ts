import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsTables1705000000032 implements MigrationInterface {
  name = 'CreatePaymentsTables1705000000032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_status enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_status_enum" AS ENUM (
          'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create payment_type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_type_enum" AS ENUM (
          'booking', 'rent', 'deposit', 'viewing', 'service_fee', 'commission', 'refund'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create payment_method_type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_method_type_enum" AS ENUM (
          'mtn_momo', 'airtel_money', 'card', 'bank_transfer', 'cash'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create payments table
    await queryRunner.query(`
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
    await queryRunner.query(`
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

    // Add foreign key constraints with existence checks
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_payments_userId'
        ) THEN
          ALTER TABLE "payments" 
          ADD CONSTRAINT "FK_payments_userId" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_payments_propertyId'
        ) THEN
          ALTER TABLE "payments" 
          ADD CONSTRAINT "FK_payments_propertyId" 
          FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_payments_bookingId'
        ) THEN
          ALTER TABLE "payments" 
          ADD CONSTRAINT "FK_payments_bookingId" 
          FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_payment_methods_userId'
        ) THEN
          ALTER TABLE "payment_methods" 
          ADD CONSTRAINT "FK_payment_methods_userId" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_userId" ON "payments" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_status" ON "payments" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_userId_createdAt" ON "payments" ("userId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_status_createdAt" ON "payments" ("status", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_methods_userId" ON "payment_methods" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_methods_userId_isDefault" ON "payment_methods" ("userId", "isDefault")
    `);

    console.log('✅ Payments tables created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_methods_userId_isDefault"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_methods_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_userId_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_userId"`);

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT IF EXISTS "FK_payment_methods_userId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_bookingId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_propertyId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_userId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_methods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);

    console.log('✅ Payments tables dropped successfully');
  }
}
