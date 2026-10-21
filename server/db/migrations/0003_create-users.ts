import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role user_role NOT NULL,
      phone_verified BOOLEAN NOT NULL DEFAULT false,
      contact_preference contact_mode NOT NULL DEFAULT 'CALL',
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_users_email ON users(email);');
  pgm.sql('CREATE INDEX idx_users_role ON users(role);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_users_role;');
  pgm.sql('DROP INDEX IF EXISTS idx_users_email;');
  pgm.sql('DROP TABLE IF EXISTS users;');
}
