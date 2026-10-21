import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE property_status_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      from_status property_status,
      to_status property_status NOT NULL,
      changed_by UUID NOT NULL REFERENCES users(id),
      changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_status_history_property ON property_status_history(property_id);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_status_history_property;');
  pgm.sql('DROP TABLE IF EXISTS property_status_history;');
}
