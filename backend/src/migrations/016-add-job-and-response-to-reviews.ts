import { MigrationInterface, QueryRunner, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

export class AddJobAndResponseToReviews1700000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add jobId column
    await queryRunner.addColumn(
      'provider_reviews',
      new TableColumn({
        name: 'jobId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add providerResponse column
    await queryRunner.addColumn(
      'provider_reviews',
      new TableColumn({
        name: 'providerResponse',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add respondedAt column
    await queryRunner.addColumn(
      'provider_reviews',
      new TableColumn({
        name: 'respondedAt',
        type: 'timestamptz',
        isNullable: true,
      }),
    );

    // Create unique index for jobId (one review per job)
    await queryRunner.createIndex(
      'provider_reviews',
      new TableIndex({
        name: 'IDX_provider_reviews_job',
        columnNames: ['jobId'],
        isUnique: true,
        where: '"jobId" IS NOT NULL', // Only enforce uniqueness for non-null jobIds
      }),
    );

    // Create foreign key to jobs table
    await queryRunner.createForeignKey(
      'provider_reviews',
      new TableForeignKey({
        columnNames: ['jobId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'jobs',
        onDelete: 'SET NULL', // If job is deleted, keep review but remove job link
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('provider_reviews');
    const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('jobId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('provider_reviews', foreignKey);
    }

    // Drop index
    await queryRunner.dropIndex('provider_reviews', 'IDX_provider_reviews_job');

    // Drop columns
    await queryRunner.dropColumn('provider_reviews', 'respondedAt');
    await queryRunner.dropColumn('provider_reviews', 'providerResponse');
    await queryRunner.dropColumn('provider_reviews', 'jobId');
  }
}

