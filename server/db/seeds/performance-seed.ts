import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------------------------------------------------------------------------
// City coordinates for realistic property locations across India
// ---------------------------------------------------------------------------
const CITIES = [
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, localities: ['Bandra', 'Andheri', 'Juhu', 'Powai', 'Worli', 'Lower Parel', 'Dadar', 'Goregaon', 'Malad', 'Kandivali'] },
  { name: 'Delhi', lat: 28.6139, lng: 77.209, localities: ['Dwarka', 'Vasant Kunj', 'Saket', 'Hauz Khas', 'Greater Kailash', 'Rohini', 'Pitampura', 'Lajpat Nagar'] },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, localities: ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Jayanagar', 'Marathahalli', 'Electronic City', 'Yelahanka'] },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867, localities: ['Gachibowli', 'HITEC City', 'Jubilee Hills', 'Banjara Hills', 'Kondapur', 'Madhapur', 'Kukatpally', 'Miyapur'] },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, localities: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'OMR', 'Nungambakkam', 'Guindy', 'Tambaram'] },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, localities: ['Koregaon Park', 'Viman Nagar', 'Hinjewadi', 'Kharadi', 'Baner', 'Wakad', 'Hadapsar', 'Aundh'] },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, localities: ['Salt Lake', 'New Town', 'Park Street', 'Ballygunge', 'Alipore', 'Howrah', 'Dum Dum'] },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, localities: ['SG Highway', 'Prahlad Nagar', 'Satellite', 'Vastrapur', 'Bodakdev', 'Navrangpura'] },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, localities: ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'Jagatpura', 'C-Scheme', 'Tonk Road'] },
  { name: 'Gurgaon', lat: 28.4595, lng: 77.0266, localities: ['Golf Course Road', 'Sohna Road', 'MG Road', 'Sector 56', 'Sector 49', 'DLF Phase 1', 'DLF Phase 5'] },
];

const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL', 'PG', 'FARMHOUSE'] as const;
const PURPOSES = ['SELL', 'RENT'] as const;
const FURNISHING = ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'] as const;
const AMENITIES_POOL = [
  'Swimming Pool', 'Gym', 'Club House', 'Power Backup', 'Parking', 'Security',
  'Lift', 'Garden', 'Children Play Area', 'Rain Water Harvesting', 'CCTV',
  'Fire Safety', 'Intercom', 'Piped Gas', 'Wi-Fi', 'EV Charging', 'Jogging Track',
  'Tennis Court', 'Badminton Court', 'Library', 'Spa', 'Multipurpose Hall',
];

function randomFromArray<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmenities(): string[] {
  const count = randomInt(3, 10);
  const shuffled = [...AMENITIES_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ---------------------------------------------------------------------------
// Build a batch of property VALUES tuples
// ---------------------------------------------------------------------------
function buildBatch(ownerId: string, batchSize: number, startIndex: number): { text: string; values: unknown[] } {
  const placeholders: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  for (let i = 0; i < batchSize; i++) {
    const city = CITIES[(startIndex + i) % CITIES.length];
    const locality = randomFromArray(city.localities);
    const type = randomFromArray(PROPERTY_TYPES);
    const purpose = randomFromArray(PURPOSES);
    const furnishing = randomFromArray(FURNISHING);

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

    askingPrice = purpose === 'RENT' ? randomInt(5000, 200000) : randomInt(2000000, 150000000);
    const securityDeposit = purpose === 'RENT' ? askingPrice * 2 : null;
    const carpetArea = Math.round(areaSqft * 0.8);
    const floorLevel = type === 'PLOT' || type === 'FARMHOUSE' ? 0 : randomInt(1, 20);
    const totalFloors = type === 'PLOT' ? 1 : randomInt(3, 30);
    const parking = randomInt(0, 3);
    const amenities = randomAmenities();
    const lat = city.lat + (Math.random() - 0.5) * 0.1;
    const lng = city.lng + (Math.random() - 0.5) * 0.1;
    const streetAddress = `${randomInt(1, 999)}, ${locality} Road`;
    const postalCode = `${randomInt(100000, 999999)}`;
    const title = `${type.charAt(0) + type.slice(1).toLowerCase()} in ${locality}, ${city.name} #${startIndex + i + 1}`;

    // 19 regular params + ST_MakePoint uses 2 params = 21 params per row
    const p = paramIdx;
    placeholders.push(`(
      $${p}, NULL, 'DIRECT', $${p + 1}, $${p + 2}, $${p + 3}, $${p + 4},
      $${p + 5}, $${p + 6}, $${p + 7}, $${p + 8},
      $${p + 9}, $${p + 10}, $${p + 11}, $${p + 12}, $${p + 13},
      $${p + 14}, $${p + 15}, $${p + 16}, $${p + 17}, $${p + 18}, $${p + 19},
      ST_SetSRID(ST_MakePoint($${p + 20}, $${p + 21}), 4326)::geography,
      'ACTIVE', 0, NOW(), NOW(), NOW()
    )`);

    values.push(
      ownerId,           // owner_id
      title,             // title
      `Performance test property #${startIndex + i + 1} in ${locality}, ${city.name}.`, // description
      type,              // type
      purpose,           // purpose
      askingPrice,       // asking_price
      securityDeposit,   // security_deposit
      areaSqft,          // area_sqft
      carpetArea,        // carpet_area_sqft
      bedrooms,          // bedrooms
      bathrooms,         // bathrooms
      floorLevel,        // floor_level
      totalFloors,       // total_floors
      furnishing,        // furnishing
      parking,           // parking
      amenities,         // amenities
      streetAddress,     // street_address
      city.name,         // city
      locality,          // locality
      postalCode,        // postal_code
      lng,               // longitude (X)
      lat,               // latitude (Y)
    );

    paramIdx += 22;
  }

  const text = `
    INSERT INTO properties (
      owner_id, broker_id, handling_mode, title, description, type, purpose,
      asking_price, security_deposit, area_sqft, carpet_area_sqft,
      bedrooms, bathrooms, floor_level, total_floors, furnishing,
      parking, amenities, street_address, city, locality, postal_code,
      location, status, view_count, created_at, updated_at, published_at
    ) VALUES ${placeholders.join(',\n')}
  `;

  return { text, values };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function performanceSeed(): Promise<void> {
  const client = await pool.connect();
  const TOTAL = 10000;
  const BATCH_SIZE = 500;
  const totalBatches = Math.ceil(TOTAL / BATCH_SIZE);

  console.log(`\n🚀 Performance Seed: Generating ${TOTAL.toLocaleString()} property listings\n`);
  const overallStart = Date.now();

  try {
    // Ensure we have a perf-test owner
    const ownerResult = await client.query<{ id: string }>(
      `INSERT INTO users (email, phone, password_hash, full_name, role, phone_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      ['perftest@estateflow.com', '+910000000000', '$2a$12$placeholder_hash_for_perf_seed', 'Performance Tester', 'OWNER', true],
    );
    const ownerId = ownerResult.rows[0].id;
    console.log(`  👤 Perf-test owner: ${ownerId}`);

    for (let batch = 0; batch < totalBatches; batch++) {
      const remaining = TOTAL - batch * BATCH_SIZE;
      const currentBatchSize = Math.min(BATCH_SIZE, remaining);
      const startIndex = batch * BATCH_SIZE;

      const batchStart = Date.now();
      const { text, values } = buildBatch(ownerId, currentBatchSize, startIndex);
      await client.query(text, values);
      const batchDuration = Date.now() - batchStart;

      const progress = Math.round(((batch + 1) / totalBatches) * 100);
      const inserted = Math.min((batch + 1) * BATCH_SIZE, TOTAL);
      console.log(
        `  📦 Batch ${batch + 1}/${totalBatches}: Inserted ${currentBatchSize} rows (${inserted.toLocaleString()} total) in ${batchDuration}ms [${progress}%]`,
      );
    }

    const totalDuration = Date.now() - overallStart;
    const rate = Math.round(TOTAL / (totalDuration / 1000));
    console.log(`\n  ⏱️  Total time: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`  📊 Insert rate: ~${rate.toLocaleString()} rows/sec`);

    // Run ANALYZE to update planner statistics
    console.log('\n  📈 Running ANALYZE on properties table...');
    const analyzeStart = Date.now();
    await client.query('ANALYZE properties;');
    console.log(`  ✅ ANALYZE completed in ${Date.now() - analyzeStart}ms`);

    // Quick count verification
    const countResult = await client.query<{ count: string }>('SELECT COUNT(*) as count FROM properties;');
    console.log(`\n  🏠 Total properties in database: ${parseInt(countResult.rows[0].count, 10).toLocaleString()}`);

    console.log('\n🎉 Performance seed completed!\n');
  } catch (err) {
    console.error('❌ Performance seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

performanceSeed().catch(() => process.exit(1));
