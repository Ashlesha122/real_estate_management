import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE inquiry_notes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_inquiry_notes_inquiry ON inquiry_notes(inquiry_id);');

  pgm.sql(`
    CREATE TABLE inquiry_activities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      actor_id UUID NOT NULL REFERENCES users(id),
      event_type VARCHAR(100) NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_inquiry_activities_inquiry ON inquiry_activities(inquiry_id);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_inquiry_activities_inquiry;');
  pgm.sql('DROP TABLE IF EXISTS inquiry_activities;');
  pgm.sql('DROP INDEX IF EXISTS idx_inquiry_notes_inquiry;');
  pgm.sql('DROP TABLE IF EXISTS inquiry_notes;');
}
