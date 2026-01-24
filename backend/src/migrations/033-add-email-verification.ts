import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailVerificationToUsers1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerificationToken',
        type: 'varchar',
        isNullable: true,
        comment: 'Unique token for email verification',
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerificationTokenExpires',
        type: 'timestamptz',
        isNullable: true,
        comment: 'Expiration time for verification token',
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerifiedAt',
        type: 'timestamptz',
        isNullable: true,
        comment: 'Timestamp when email was verified',
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'isEmailVerified',
        type: 'boolean',
        default: false,
        comment: 'Whether email has been verified',
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerificationAttempts',
        type: 'int',
        default: 0,
        comment: 'Number of failed verification attempts',
      }),
    );

    // Create index for faster token lookups (use double quotes for case sensitivity)
    await queryRunner.query(
      `CREATE INDEX idx_users_email_verification_token ON users ("emailVerificationToken")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'idx_users_email_verification_token');
    await queryRunner.dropColumn('users', 'emailVerificationAttempts');
    await queryRunner.dropColumn('users', 'isEmailVerified');
    await queryRunner.dropColumn('users', 'emailVerifiedAt');
    await queryRunner.dropColumn('users', 'emailVerificationTokenExpires');
    await queryRunner.dropColumn('users', 'emailVerificationToken');
  }
}
