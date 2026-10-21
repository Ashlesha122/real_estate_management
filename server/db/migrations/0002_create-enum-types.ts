import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`CREATE TYPE user_role AS ENUM ('BUYER', 'OWNER', 'BROKER');`);
  pgm.sql(`CREATE TYPE property_type AS ENUM ('APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL', 'PG', 'FARMHOUSE');`);
  pgm.sql(`CREATE TYPE property_purpose AS ENUM ('SELL', 'RENT');`);
  pgm.sql(`CREATE TYPE property_status AS ENUM ('DRAFT', 'ACTIVE', 'UNDER_OFFER', 'SOLD', 'RENTED', 'INACTIVE');`);
  pgm.sql(`CREATE TYPE handling_mode AS ENUM ('DIRECT', 'BROKER_ASSISTED');`);
  pgm.sql(`CREATE TYPE furnishing_status AS ENUM ('UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED');`);
  pgm.sql(`CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'FLOOR_PLAN', 'DOCUMENT');`);
  pgm.sql(`CREATE TYPE contact_mode AS ENUM ('CALL', 'EMAIL', 'WHATSAPP', 'CHAT');`);
  pgm.sql(`CREATE TYPE lead_stage AS ENUM ('NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'VISITED', 'NEGOTIATION', 'WON', 'LOST');`);
  pgm.sql(`CREATE TYPE visit_status AS ENUM ('PROPOSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');`);
  pgm.sql(`CREATE TYPE visit_mode AS ENUM ('IN_PERSON', 'VIDEO_CALL');`);
  pgm.sql(`CREATE TYPE record_type AS ENUM ('LEASE', 'SALE');`);
  pgm.sql(`CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');`);
  pgm.sql(`CREATE TYPE notification_type AS ENUM ('INQUIRY_RECEIVED', 'VISIT_SCHEDULED', 'VISIT_REMINDER', 'VISIT_CANCELLED', 'PROPERTY_UPDATE', 'LEAD_UPDATE', 'SYSTEM');`);
  pgm.sql(`CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP TYPE IF EXISTS notification_status;');
  pgm.sql('DROP TYPE IF EXISTS notification_type;');
  pgm.sql('DROP TYPE IF EXISTS notification_channel;');
  pgm.sql('DROP TYPE IF EXISTS record_type;');
  pgm.sql('DROP TYPE IF EXISTS visit_mode;');
  pgm.sql('DROP TYPE IF EXISTS visit_status;');
  pgm.sql('DROP TYPE IF EXISTS lead_stage;');
  pgm.sql('DROP TYPE IF EXISTS contact_mode;');
  pgm.sql('DROP TYPE IF EXISTS media_type;');
  pgm.sql('DROP TYPE IF EXISTS furnishing_status;');
  pgm.sql('DROP TYPE IF EXISTS handling_mode;');
  pgm.sql('DROP TYPE IF EXISTS property_status;');
  pgm.sql('DROP TYPE IF EXISTS property_purpose;');
  pgm.sql('DROP TYPE IF EXISTS property_type;');
  pgm.sql('DROP TYPE IF EXISTS user_role;');
}
