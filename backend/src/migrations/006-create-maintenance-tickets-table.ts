import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMaintenanceTicketsTable1700000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'maintenance_tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['electrical', 'plumbing', 'hvac', 'security', 'structural', 'appliance', 'internet', 'other'],
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'urgent'],
            default: "'medium'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'assigned', 'in_progress', 'completed', 'rejected'],
            default: "'pending'",
          },
          {
            name: 'property',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'tenantPhone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'images',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'assignedProviderId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'escrowAmount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'maintenance_tickets',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'maintenance_tickets',
      new TableForeignKey({
        columnNames: ['assignedProviderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'maintenance_tickets',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'maintenance_tickets',
      new TableIndex({
        name: 'IDX_MAINTENANCE_TICKETS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'maintenance_tickets',
      new TableIndex({
        name: 'IDX_MAINTENANCE_TICKETS_CATEGORY',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'maintenance_tickets',
      new TableIndex({
        name: 'IDX_MAINTENANCE_TICKETS_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'maintenance_tickets',
      new TableIndex({
        name: 'IDX_MAINTENANCE_TICKETS_OWNER',
        columnNames: ['ownerId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('maintenance_tickets');
  }
}

