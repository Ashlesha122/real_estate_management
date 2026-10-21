import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE site_visits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      property_id UUID NOT NULL REFERENCES properties(id),
      buyer_id UUID NOT NULL REFERENCES users(id),
      handler_id UUID NOT NULL REFERENCES users(id),
      scheduled_at TIMESTAMPTZ NOT NULL,
      duration_minutes INT NOT NULL DEFAULT 30,
      mode visit_mode NOT NULL DEFAULT 'IN_PERSON',
      status visit_status NOT NULL DEFAULT 'PROPOSED',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_handler_slot UNIQUE(handler_id, scheduled_at)
    );
  `);
  pgm.sql('CREATE INDEX idx_visits_inquiry ON site_visits(inquiry_id);');
  pgm.sql('CREATE INDEX idx_visits_buyer ON site_visits(buyer_id);');
  pgm.sql('CREATE INDEX idx_visits_handler ON site_visits(handler_id);');
  pgm.sql('CREATE INDEX idx_visits_status ON site_visits(status);');
  pgm.sql('CREATE INDEX idx_visits_scheduled ON site_visits(scheduled_at);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_visits_scheduled;');
  pgm.sql('DROP INDEX IF EXISTS idx_visits_status;');
  pgm.sql('DROP INDEX IF EXISTS idx_visits_handler;');
  pgm.sql('DROP INDEX IF EXISTS idx_visits_buyer;');
  pgm.sql('DROP INDEX IF EXISTS idx_visits_inquiry;');
  pgm.sql('DROP TABLE IF EXISTS site_visits;');
}
