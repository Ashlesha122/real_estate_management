import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE property_media (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      media_type media_type NOT NULL DEFAULT 'IMAGE',
      sort_order INT NOT NULL DEFAULT 0,
      is_cover BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_media_property ON property_media(property_id);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_media_property;');
  pgm.sql('DROP TABLE IF EXISTS property_media;');
}
