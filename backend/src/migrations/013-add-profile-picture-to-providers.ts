import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProfilePictureToProviders1700000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'providers',
      new TableColumn({
        name: 'profilePicture',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('providers', 'profilePicture');
  }
}

