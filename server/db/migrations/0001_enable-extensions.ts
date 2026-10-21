import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "postgis";');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP EXTENSION IF EXISTS "postgis";');
  pgm.sql('DROP EXTENSION IF EXISTS "uuid-ossp";');
}
