import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE availability_rules (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      handler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      CHECK (end_time > start_time),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_avail_rules_handler ON availability_rules(handler_id);');

  pgm.sql(`
    CREATE TABLE availability_blocks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      handler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_date DATE NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(handler_id, blocked_date)
    );
  `);
  pgm.sql('CREATE INDEX idx_avail_blocks_handler ON availability_blocks(handler_id);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_avail_blocks_handler;');
  pgm.sql('DROP TABLE IF EXISTS availability_blocks;');
  pgm.sql('DROP INDEX IF EXISTS idx_avail_rules_handler;');
  pgm.sql('DROP TABLE IF EXISTS availability_rules;');
}
