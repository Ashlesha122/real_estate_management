import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type notification_type NOT NULL,
      title VARCHAR(500) NOT NULL,
      body TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT false,
      data JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_notifications_user ON notifications(user_id);');
  pgm.sql(`CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;`);

  pgm.sql(`
    CREATE TABLE notification_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      notification_id UUID REFERENCES notifications(id),
      user_id UUID NOT NULL REFERENCES users(id),
      channel notification_channel NOT NULL,
      recipient VARCHAR(255) NOT NULL,
      template VARCHAR(255) NOT NULL,
      payload_summary TEXT,
      status notification_status NOT NULL DEFAULT 'PENDING',
      attempts INT NOT NULL DEFAULT 0,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql('CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);');
  pgm.sql('CREATE INDEX idx_notification_logs_status ON notification_logs(status);');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_notification_logs_status;');
  pgm.sql('DROP INDEX IF EXISTS idx_notification_logs_user;');
  pgm.sql('DROP TABLE IF EXISTS notification_logs;');
  pgm.sql('DROP INDEX IF EXISTS idx_notifications_unread;');
  pgm.sql('DROP INDEX IF EXISTS idx_notifications_user;');
  pgm.sql('DROP TABLE IF EXISTS notifications;');
}
