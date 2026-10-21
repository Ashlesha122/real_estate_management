import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE lease_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      property_id UUID NOT NULL REFERENCES properties(id),
      tenant_id UUID REFERENCES users(id),
      counterparty_name VARCHAR(255) NOT NULL,
      counterparty_phone VARCHAR(20),
      record_type record_type NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
      notes TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (end_date IS NULL OR end_date >= start_date)
    );
  `);
  pgm.sql('CREATE INDEX idx_lease_property ON lease_records(property_id);');
  pgm.sql('CREATE INDEX idx_lease_tenant ON lease_records(tenant_id);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_lease_tenant;');
  pgm.sql('DROP INDEX IF EXISTS idx_lease_property;');
  pgm.sql('DROP TABLE IF EXISTS lease_records;');
}
