import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddJobIdToMaintenanceTickets1700000000019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const table = await queryRunner.getTable('maintenance_tickets');
    const jobIdColumn = table?.findColumnByName('jobId');

    // Add jobId column if it doesn't exist
    if (!jobIdColumn) {
      await queryRunner.addColumn(
        'maintenance_tickets',
        new TableColumn({
          name: 'jobId',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }

    // Check if foreign key already exists
    const foreignKeys = table?.foreignKeys || [];
    const existingFk = foreignKeys.find(
      (fk) => fk.columnNames.indexOf('jobId') !== -1,
    );

    // Add foreign key constraint if it doesn't exist
    if (!existingFk) {
      await queryRunner.createForeignKey(
        'maintenance_tickets',
        new TableForeignKey({
          columnNames: ['jobId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'jobs',
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get the foreign key constraint name
    const table = await queryRunner.getTable('maintenance_tickets');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('jobId') !== -1,
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('maintenance_tickets', foreignKey);
    }

    await queryRunner.dropColumn('maintenance_tickets', 'jobId');
  }
}
