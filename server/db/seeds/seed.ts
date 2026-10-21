import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface UserRow {
  id: string;
}

interface PropertyRow {
  id: string;
}

interface InquiryRow {
  id: string;
}

// ---------------------------------------------------------------------------
// City coordinates for realistic property locations
// ---------------------------------------------------------------------------
const CITIES: { name: string; lat: number; lng: number; localities: string[]; postalPrefixes: string[] }[] = [
  {
    name: 'Mumbai',
    lat: 19.076,
    lng: 72.8777,
    localities: ['Bandra West', 'Andheri East', 'Juhu', 'Powai', 'Worli', 'Lower Parel', 'Dadar', 'Goregaon'],
    postalPrefixes: ['400050', '400069', '400049', '400076', '400018', '400013', '400028', '400104'],
  },
  {
    name: 'Delhi',
    lat: 28.6139,
    lng: 77.209,
    localities: ['Dwarka', 'Vasant Kunj', 'Saket', 'Hauz Khas', 'Greater Kailash', 'Janakpuri', 'Rohini'],
    postalPrefixes: ['110075', '110070', '110017', '110016', '110048', '110058', '110085'],
  },
  {
    name: 'Bangalore',
    lat: 12.9716,
    lng: 77.5946,
    localities: ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Jayanagar', 'Marathahalli', 'Electronic City'],
    postalPrefixes: ['560066', '560034', '560038', '560102', '560041', '560037', '560100'],
  },
  {
    name: 'Hyderabad',
    lat: 17.385,
    lng: 78.4867,
    localities: ['Gachibowli', 'HITEC City', 'Jubilee Hills', 'Banjara Hills', 'Kondapur', 'Madhapur'],
    postalPrefixes: ['500032', '500081', '500033', '500034', '500084', '500081'],
  },
  {
    name: 'Chennai',
    lat: 13.0827,
    lng: 80.2707,
    localities: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'OMR', 'Nungambakkam', 'Guindy'],
    postalPrefixes: ['600017', '600040', '600020', '600042', '600119', '600034', '600032'],
  },
  {
    name: 'Pune',
    lat: 18.5204,
    lng: 73.8567,
    localities: ['Koregaon Park', 'Viman Nagar', 'Hinjewadi', 'Kharadi', 'Baner', 'Wakad', 'Hadapsar'],
    postalPrefixes: ['411001', '411014', '411057', '411014', '411045', '411057', '411028'],
  },
];

const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL', 'PG', 'FARMHOUSE'] as const;
const PURPOSES = ['SELL', 'RENT'] as const;
const FURNISHING = ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'] as const;
const AMENITIES_POOL = [
  'Swimming Pool', 'Gym', 'Club House', 'Power Backup', 'Parking', 'Security',
  'Lift', 'Garden', 'Children Play Area', 'Rain Water Harvesting', 'CCTV',
  'Fire Safety', 'Intercom', 'Piped Gas', 'Wi-Fi', 'EV Charging',
];

// Deterministic random using simple seed
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, precision: number = 4): number {
  const val = rand() * (max - min) + min;
  const factor = Math.pow(10, precision);
  return Math.round(val * factor) / factor;
}

function pickAmenities(): string[] {
  const count = randomInt(3, 8);
  const shuffled = [...AMENITIES_POOL].sort(() => rand() - 0.5);
  return shuffled.slice(0, count);
}

// ---------------------------------------------------------------------------
// Property data generator
// ---------------------------------------------------------------------------
interface PropertySeed {
  title: string;
  description: string;
  type: string;
  purpose: string;
  asking_price: number;
  security_deposit: number | null;
  area_sqft: number;
  carpet_area_sqft: number;
  bedrooms: number;
  bathrooms: number;
  floor_level: number;
  total_floors: number;
  furnishing: string;
  parking: number;
  amenities: string[];
  street_address: string;
  city: string;
  locality: string;
  postal_code: string;
  lat: number;
  lng: number;
  status: string;
  handling_mode: string;
}

function generateProperty(index: number, statusOverride?: string, handlingOverride?: string): PropertySeed {
  const city = CITIES[index % CITIES.length];
  const locality = pick(city.localities);
  const postal = pick(city.postalPrefixes);
  const type = pick(PROPERTY_TYPES);
  const purpose = pick(PURPOSES);
  const furnishing = pick(FURNISHING);

  let bedrooms = randomInt(1, 5);
  let bathrooms = randomInt(1, 3);
  let areaSqft = randomInt(500, 5000);
  let askingPrice: number;

  if (type === 'PLOT') {
    bedrooms = 0;
    bathrooms = 0;
    areaSqft = randomInt(1000, 10000);
  } else if (type === 'COMMERCIAL') {
    bedrooms = 0;
    bathrooms = randomInt(1, 4);
    areaSqft = randomInt(300, 8000);
  } else if (type === 'PG') {
    bedrooms = randomInt(1, 2);
    bathrooms = 1;
    areaSqft = randomInt(100, 400);
  }

  if (purpose === 'RENT') {
    askingPrice = randomInt(5000, 200000);
  } else {
    askingPrice = randomInt(2000000, 150000000);
  }

  const titles: Record<string, string[]> = {
    APARTMENT: ['Spacious Apartment', 'Modern Flat', 'Premium Apartment', 'Luxury Apartment', 'Cozy Apartment'],
    VILLA: ['Elegant Villa', 'Grand Villa', 'Luxury Villa', 'Independent House', 'Beautiful Bungalow'],
    PLOT: ['Residential Plot', 'Corner Plot', 'Premium Land Parcel', 'Development Plot'],
    COMMERCIAL: ['Office Space', 'Retail Shop', 'Commercial Floor', 'Business Centre Unit'],
    PG: ['PG Accommodation', 'Shared Living Space', 'Co-Living Room', 'Student PG'],
    FARMHOUSE: ['Weekend Farmhouse', 'Luxury Farmhouse', 'Countryside Retreat', 'Farm Villa'],
  };

  const titlePrefix = pick(titles[type] || ['Property']);

  return {
    title: `${titlePrefix} in ${locality}, ${city.name}`,
    description: `Beautiful ${type.toLowerCase().replace('_', ' ')} located in the heart of ${locality}, ${city.name}. This property offers modern amenities, excellent connectivity, and a comfortable living experience. Ideal for ${purpose === 'RENT' ? 'tenants looking for a well-maintained space' : 'buyers seeking a premium investment'}.`,
    type,
    purpose,
    asking_price: askingPrice,
    security_deposit: purpose === 'RENT' ? askingPrice * 2 : null,
    area_sqft: areaSqft,
    carpet_area_sqft: Math.round(areaSqft * 0.8),
    bedrooms,
    bathrooms,
    floor_level: type === 'PLOT' || type === 'FARMHOUSE' ? 0 : randomInt(1, 20),
    total_floors: type === 'PLOT' ? 1 : randomInt(3, 30),
    furnishing,
    parking: randomInt(0, 3),
    amenities: pickAmenities(),
    street_address: `${randomInt(1, 500)}, ${locality} Main Road`,
    city: city.name,
    locality,
    postal_code: postal,
    lat: city.lat + randomFloat(-0.05, 0.05),
    lng: city.lng + randomFloat(-0.05, 0.05),
    status: statusOverride || 'ACTIVE',
    handling_mode: handlingOverride || 'DIRECT',
  };
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting EstateFlow seed...\n');

    // -----------------------------------------------------------------------
    // Truncate all tables (idempotent)
    // -----------------------------------------------------------------------
    console.log('  🗑️  Truncating tables...');
    await client.query(`
      TRUNCATE TABLE
        notification_logs,
        notifications,
        saved_searches,
        wishlists,
        lease_records,
        site_visits,
        inquiry_activities,
        inquiry_notes,
        inquiries,
        availability_blocks,
        availability_rules,
        property_media,
        property_status_history,
        properties,
        otp_codes,
        users
      CASCADE;
    `);

    // -----------------------------------------------------------------------
    // 1. Create demo users
    // -----------------------------------------------------------------------
    console.log('  👤 Creating demo users...');
    const passwordHash = await bcrypt.hash('Password123!', 12);

    const buyerResult = await client.query<UserRow>(
      `INSERT INTO users (email, phone, password_hash, full_name, role, phone_verified, contact_preference)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['buyer@estateflow.com', '+919876543210', passwordHash, 'Rahul Sharma', 'BUYER', true, 'CALL'],
    );
    const buyerId = buyerResult.rows[0].id;

    const ownerResult = await client.query<UserRow>(
      `INSERT INTO users (email, phone, password_hash, full_name, role, phone_verified, contact_preference)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['owner@estateflow.com', '+919876543211', passwordHash, 'Priya Patel', 'OWNER', true, 'WHATSAPP'],
    );
    const ownerId = ownerResult.rows[0].id;

    const brokerResult = await client.query<UserRow>(
      `INSERT INTO users (email, phone, password_hash, full_name, role, phone_verified, contact_preference)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['broker@estateflow.com', '+919876543212', passwordHash, 'Amit Kumar', 'BROKER', true, 'CALL'],
    );
    const brokerId = brokerResult.rows[0].id;

    console.log(`    ✅ Buyer:  ${buyerId}`);
    console.log(`    ✅ Owner:  ${ownerId}`);
    console.log(`    ✅ Broker: ${brokerId}`);

    // -----------------------------------------------------------------------
    // 2. Create 40 property listings
    // -----------------------------------------------------------------------
    console.log('  🏠 Creating 40 property listings...');

    // Status distribution: 25 ACTIVE, 5 DRAFT, 3 UNDER_OFFER, 2 SOLD, 2 RENTED, 3 INACTIVE
    const statusDistribution: string[] = [
      ...Array(25).fill('ACTIVE'),
      ...Array(5).fill('DRAFT'),
      ...Array(3).fill('UNDER_OFFER'),
      ...Array(2).fill('SOLD'),
      ...Array(2).fill('RENTED'),
      ...Array(3).fill('INACTIVE'),
    ];

    // Handling: first 28 = DIRECT, next 12 = BROKER_ASSISTED
    const propertyIds: string[] = [];

    for (let i = 0; i < 40; i++) {
      const handling = i < 28 ? 'DIRECT' : 'BROKER_ASSISTED';
      const prop = generateProperty(i, statusDistribution[i], handling);
      const currentBrokerId = handling === 'BROKER_ASSISTED' ? brokerId : null;
      const publishedAt = prop.status !== 'DRAFT' ? 'NOW()' : null;

      const result = await client.query<PropertyRow>(
        `INSERT INTO properties (
          owner_id, broker_id, handling_mode, title, description, type, purpose,
          asking_price, security_deposit, area_sqft, carpet_area_sqft,
          bedrooms, bathrooms, floor_level, total_floors, furnishing,
          parking, amenities, street_address, city, locality, postal_code,
          location, status, published_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22,
          ST_SetSRID(ST_MakePoint($23, $24), 4326)::geography,
          $25, ${publishedAt ? 'NOW()' : 'NULL'}
        ) RETURNING id`,
        [
          ownerId, currentBrokerId, prop.handling_mode, prop.title, prop.description,
          prop.type, prop.purpose,
          prop.asking_price, prop.security_deposit, prop.area_sqft, prop.carpet_area_sqft,
          prop.bedrooms, prop.bathrooms, prop.floor_level, prop.total_floors, prop.furnishing,
          prop.parking, prop.amenities, prop.street_address, prop.city, prop.locality, prop.postal_code,
          prop.lng, prop.lat,
          prop.status,
        ],
      );
      propertyIds.push(result.rows[0].id);

      // Add media records for each property
      const imageCount = randomInt(1, 4);
      for (let img = 0; img < imageCount; img++) {
        await client.query(
          `INSERT INTO property_media (property_id, url, media_type, sort_order, is_cover)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            result.rows[0].id,
            `/uploads/seed/property-${i + 1}-${img + 1}.jpg`,
            'IMAGE',
            img,
            img === 0,
          ],
        );
      }

      // Add status history record
      await client.query(
        `INSERT INTO property_status_history (property_id, from_status, to_status, changed_by)
         VALUES ($1, NULL, $2, $3)`,
        [result.rows[0].id, prop.status, ownerId],
      );
    }
    console.log(`    ✅ Created ${propertyIds.length} properties with media`);

    // -----------------------------------------------------------------------
    // 3. Create 10 sample inquiries on active listings
    // -----------------------------------------------------------------------
    console.log('  📩 Creating 10 sample inquiries...');
    const activePropertyIds = propertyIds.slice(0, 25); // first 25 are ACTIVE
    const inquiryIds: string[] = [];
    const inquiryMessages = [
      'I am interested in this property. Can I schedule a visit?',
      'What is the best price you can offer? I am a serious buyer.',
      'Is this property still available? I would like to know more details.',
      'Can you share more photos and floor plan details?',
      'I would like to visit this property this weekend. Please confirm availability.',
      'Is the price negotiable? I am looking for properties in this area.',
      'How old is this property? Any renovation done recently?',
      'Is there a community maintenance charge? What are the monthly costs?',
      'Can you arrange a video tour of this property?',
      'I want to finalize this deal soon. Let us discuss the terms.',
    ];
    const stages: string[] = ['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'VISITED', 'NEGOTIATION', 'NEW', 'CONTACTED', 'NEW', 'VISIT_SCHEDULED', 'NEW'];
    const contactModes: string[] = ['CALL', 'WHATSAPP', 'EMAIL', 'CHAT', 'CALL', 'WHATSAPP', 'CALL', 'EMAIL', 'WHATSAPP', 'CALL'];

    for (let i = 0; i < 10; i++) {
      const propId = activePropertyIds[i % activePropertyIds.length];

      // Determine handler: if broker-assisted, handler is broker, else owner
      const propIndex = propertyIds.indexOf(propId);
      const handlerId = propIndex >= 28 ? brokerId : ownerId;

      const result = await client.query<InquiryRow>(
        `INSERT INTO inquiries (property_id, buyer_id, handler_id, message, contact_mode, stage, read)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [propId, buyerId, handlerId, inquiryMessages[i], contactModes[i], stages[i], i < 3],
      );
      inquiryIds.push(result.rows[0].id);

      // Add an activity record for each inquiry
      await client.query(
        `INSERT INTO inquiry_activities (inquiry_id, actor_id, event_type, metadata)
         VALUES ($1, $2, $3, $4)`,
        [result.rows[0].id, buyerId, 'INQUIRY_CREATED', JSON.stringify({ source: 'listing_page' })],
      );

      // Add a note for first 5 inquiries
      if (i < 5) {
        await client.query(
          `INSERT INTO inquiry_notes (inquiry_id, author_id, body)
           VALUES ($1, $2, $3)`,
          [result.rows[0].id, handlerId, `Follow-up note for inquiry #${i + 1}. The buyer seems ${i % 2 === 0 ? 'very interested' : 'moderately interested'}.`],
        );
      }
    }
    console.log(`    ✅ Created ${inquiryIds.length} inquiries with activities and notes`);

    // -----------------------------------------------------------------------
    // 4. Create 5 sample site visits
    // -----------------------------------------------------------------------
    console.log('  📅 Creating 5 sample site visits...');
    const visitStatuses: string[] = ['CONFIRMED', 'COMPLETED', 'PROPOSED', 'CANCELLED', 'PROPOSED'];
    const visitModes: string[] = ['IN_PERSON', 'IN_PERSON', 'VIDEO_CALL', 'IN_PERSON', 'VIDEO_CALL'];

    for (let i = 0; i < 5; i++) {
      const inquiryId = inquiryIds[i];
      const propId = activePropertyIds[i % activePropertyIds.length];
      const propIndex = propertyIds.indexOf(propId);
      const handlerId = propIndex >= 28 ? brokerId : ownerId;

      // Schedule visits at different future times to avoid unique constraint conflicts
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + i + 1);
      scheduledAt.setHours(10 + i, 0, 0, 0);

      await client.query(
        `INSERT INTO site_visits (inquiry_id, property_id, buyer_id, handler_id, scheduled_at, duration_minutes, mode, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          inquiryId, propId, buyerId, handlerId,
          scheduledAt.toISOString(),
          30,
          visitModes[i],
          visitStatuses[i],
          `Visit note: ${visitStatuses[i] === 'COMPLETED' ? 'The buyer liked the property.' : 'Pending confirmation.'}`,
        ],
      );
    }
    console.log('    ✅ Created 5 site visits');

    // -----------------------------------------------------------------------
    // 5. Create 1 sample lease record
    // -----------------------------------------------------------------------
    console.log('  📝 Creating 1 sample lease record...');
    // Pick a RENTED property (indices 30 and 31 in statusDistribution)
    const rentedPropId = propertyIds[30];
    await client.query(
      `INSERT INTO lease_records (property_id, tenant_id, counterparty_name, counterparty_phone, record_type, start_date, end_date, amount, notes, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        rentedPropId,
        buyerId,
        'Rahul Sharma',
        '+919876543210',
        'LEASE',
        '2024-01-01',
        '2025-12-31',
        45000.00,
        'Standard lease agreement with 2 month security deposit. Maintenance included.',
        true,
      ],
    );
    console.log('    ✅ Created 1 lease record');

    // -----------------------------------------------------------------------
    // 6. Create sample availability rules for owner & broker
    // -----------------------------------------------------------------------
    console.log('  ⏰ Creating availability rules...');
    // Weekdays 10am-6pm for owner
    for (let day = 1; day <= 5; day++) {
      await client.query(
        `INSERT INTO availability_rules (handler_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)`,
        [ownerId, day, '10:00', '18:00'],
      );
    }
    // Weekdays + Saturday for broker
    for (let day = 1; day <= 6; day++) {
      await client.query(
        `INSERT INTO availability_rules (handler_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)`,
        [brokerId, day, '09:00', '20:00'],
      );
    }
    console.log('    ✅ Created availability rules for owner and broker');

    // -----------------------------------------------------------------------
    // 7. Create sample notifications
    // -----------------------------------------------------------------------
    console.log('  🔔 Creating sample notifications...');
    const notificationTypes = ['INQUIRY_RECEIVED', 'VISIT_SCHEDULED', 'PROPERTY_UPDATE', 'SYSTEM'];
    const notificationTitles = [
      'New inquiry on your property',
      'Visit scheduled for tomorrow',
      'Your property listing has been updated',
      'Welcome to EstateFlow!',
    ];
    const notificationBodies = [
      'A buyer has shown interest in your property in Bandra West.',
      'A site visit has been scheduled for tomorrow at 10:00 AM.',
      'Your property listing in Koramangala is now live.',
      'Thank you for joining EstateFlow. Start listing your properties today!',
    ];

    for (let i = 0; i < 4; i++) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, read, data)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          i === 0 ? ownerId : i === 1 ? ownerId : i === 2 ? ownerId : buyerId,
          notificationTypes[i],
          notificationTitles[i],
          notificationBodies[i],
          i < 2,
          JSON.stringify({ action: 'view', entityType: 'property' }),
        ],
      );
    }
    console.log('    ✅ Created 4 sample notifications');

    // -----------------------------------------------------------------------
    // 8. Create a saved search for the buyer
    // -----------------------------------------------------------------------
    console.log('  🔍 Creating saved search...');
    await client.query(
      `INSERT INTO saved_searches (user_id, name, filters, center_lat, center_lng, radius_km, notify)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        buyerId,
        '2BHK in Mumbai under 1Cr',
        JSON.stringify({
          type: 'APARTMENT',
          purpose: 'SELL',
          city: 'Mumbai',
          minBedrooms: 2,
          maxPrice: 10000000,
        }),
        19.076,
        72.8777,
        10,
        true,
      ],
    );
    console.log('    ✅ Created 1 saved search');

    // -----------------------------------------------------------------------
    // 9. Create wishlist entries
    // -----------------------------------------------------------------------
    console.log('  ❤️  Creating wishlist entries...');
    for (let i = 0; i < 5; i++) {
      await client.query(
        `INSERT INTO wishlists (user_id, property_id) VALUES ($1, $2)`,
        [buyerId, activePropertyIds[i]],
      );
    }
    console.log('    ✅ Created 5 wishlist entries');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('  Demo Credentials:');
    console.log('  ─────────────────────────────────────────');
    console.log('  Buyer:  buyer@estateflow.com  / Password123!');
    console.log('  Owner:  owner@estateflow.com  / Password123!');
    console.log('  Broker: broker@estateflow.com / Password123!');
    console.log('  ─────────────────────────────────────────\n');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
