import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCompletionFieldsToJobs1700000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add completionNotes column
    await queryRunner.addColumn(
      'jobs',
      new TableColumn({
        name: 'completionNotes',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add completionPhotos column
    await queryRunner.addColumn(
      'jobs',
      new TableColumn({
        name: 'completionPhotos',
        type: 'text',
        isNullable: true,
        isArray: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('jobs', 'completionPhotos');
    await queryRunner.dropColumn('jobs', 'completionNotes');
  }
}

