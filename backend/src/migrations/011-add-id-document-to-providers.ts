import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIdDocumentToProviders1700000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'providers',
      new TableColumn({
        name: 'idDocumentUrl',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('providers', 'idDocumentUrl');
  }
}

