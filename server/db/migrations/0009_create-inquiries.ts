import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE inquiries (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      property_id UUID NOT NULL REFERENCES properties(id),
      buyer_id UUID NOT NULL REFERENCES users(id),
      handler_id UUID NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      contact_mode contact_mode NOT NULL DEFAULT 'CALL',
      preferred_visit_time TIMESTAMPTZ,
      stage lead_stage NOT NULL DEFAULT 'NEW',
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_inquiries_property ON inquiries(property_id);');
  pgm.sql('CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);');
  pgm.sql('CREATE INDEX idx_inquiries_handler ON inquiries(handler_id);');
  pgm.sql('CREATE INDEX idx_inquiries_stage ON inquiries(stage);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_inquiries_stage;');
  pgm.sql('DROP INDEX IF EXISTS idx_inquiries_handler;');
  pgm.sql('DROP INDEX IF EXISTS idx_inquiries_buyer;');
  pgm.sql('DROP INDEX IF EXISTS idx_inquiries_property;');
  pgm.sql('DROP TABLE IF EXISTS inquiries;');
}
