import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE saved_searches (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      filters JSONB NOT NULL,
      center_lat DOUBLE PRECISION,
      center_lng DOUBLE PRECISION,
      radius_km DOUBLE PRECISION,
      notify BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_saved_searches_user;');
  pgm.sql('DROP TABLE IF EXISTS saved_searches;');
}
