import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE properties (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      owner_id UUID NOT NULL REFERENCES users(id),
      broker_id UUID REFERENCES users(id),
      handling_mode handling_mode NOT NULL DEFAULT 'DIRECT',
      title VARCHAR(500) NOT NULL,
      description TEXT,
      type property_type NOT NULL,
      purpose property_purpose NOT NULL,
      asking_price NUMERIC(14,2) NOT NULL CHECK (asking_price > 0),
      security_deposit NUMERIC(14,2) CHECK (security_deposit >= 0),
      area_sqft NUMERIC(10,2) CHECK (area_sqft > 0),
      carpet_area_sqft NUMERIC(10,2) CHECK (carpet_area_sqft > 0),
      bedrooms INT CHECK (bedrooms >= 0 AND bedrooms <= 50),
      bathrooms INT CHECK (bathrooms >= 0 AND bathrooms <= 50),
      floor_level INT,
      total_floors INT CHECK (total_floors > 0 AND total_floors <= 200),
      furnishing furnishing_status,
      parking INT DEFAULT 0 CHECK (parking >= 0),
      amenities TEXT[] DEFAULT '{}',
      street_address TEXT,
      city VARCHAR(255),
      locality VARCHAR(255),
      postal_code VARCHAR(20),
      location GEOGRAPHY(Point, 4326),
      status property_status NOT NULL DEFAULT 'DRAFT',
      view_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ
    );
  `);
  pgm.sql('CREATE INDEX idx_properties_owner ON properties(owner_id);');
  pgm.sql('CREATE INDEX idx_properties_broker ON properties(broker_id);');
  pgm.sql('CREATE INDEX idx_properties_status ON properties(status);');
  pgm.sql('CREATE INDEX idx_properties_type ON properties(type);');
  pgm.sql('CREATE INDEX idx_properties_purpose ON properties(purpose);');
  pgm.sql('CREATE INDEX idx_properties_city ON properties(city);');
  pgm.sql('CREATE INDEX idx_properties_price ON properties(asking_price);');
  pgm.sql('CREATE INDEX idx_properties_location ON properties USING GIST(location);');
  pgm.sql(`CREATE INDEX idx_properties_active_search ON properties(status, type, purpose, asking_price) WHERE status = 'ACTIVE';`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('DROP INDEX IF EXISTS idx_properties_active_search;');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_location;');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_price;');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_city;');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_purpose;');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_type;');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_status;');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_broker;');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_owner;');
  pgm.sql('DROP TABLE IF EXISTS properties;');
}
