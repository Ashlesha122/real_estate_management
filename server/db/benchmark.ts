import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

// ---------------------------------------------------------------------------
// City center coordinates for random query points
// ---------------------------------------------------------------------------
const CITIES = [
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Gurgaon', lat: 28.4595, lng: 77.0266 },
];

const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL', 'PG', 'FARMHOUSE'];
const PURPOSES = ['SELL', 'RENT'];

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// ---------------------------------------------------------------------------
// Percentile calculator
// ---------------------------------------------------------------------------
function percentile(sortedArr: number[], p: number): number {
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, index)];
}

function formatMs(ms: number): string {
  return ms.toFixed(2) + 'ms';
}

// ---------------------------------------------------------------------------
// Benchmark: Spatial queries (ST_DWithin, 5km radius with filters)
// ---------------------------------------------------------------------------
async function benchmarkSpatialQueries(iterations: number): Promise<number[]> {
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const city = randomFromArray(CITIES);
    const lat = city.lat + randomFloat(-0.03, 0.03);
    const lng = city.lng + randomFloat(-0.03, 0.03);
    const type = randomFromArray(PROPERTY_TYPES);
    const purpose = randomFromArray(PURPOSES);
    const radiusMeters = 5000; // 5km

    const start = performance.now();
    await pool.query(
      `SELECT id, title, asking_price, city, locality,
              ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_m
       FROM properties
       WHERE status = 'ACTIVE'
         AND type = $3
         AND purpose = $4
         AND ST_DWithin(
           location,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $5
         )
       ORDER BY distance_m ASC
       LIMIT 20`,
      [lng, lat, type, purpose, radiusMeters],
    );
    const duration = performance.now() - start;
    latencies.push(duration);
  }

  return latencies;
}

// ---------------------------------------------------------------------------
// Benchmark: Bounding box queries
// ---------------------------------------------------------------------------
async function benchmarkBoundingBoxQueries(iterations: number): Promise<number[]> {
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const city = randomFromArray(CITIES);
    const halfDeg = 0.045; // ~5km in degrees
    const minLat = city.lat - halfDeg + randomFloat(-0.02, 0.02);
    const maxLat = city.lat + halfDeg + randomFloat(-0.02, 0.02);
    const minLng = city.lng - halfDeg + randomFloat(-0.02, 0.02);
    const maxLng = city.lng + halfDeg + randomFloat(-0.02, 0.02);

    const start = performance.now();
    await pool.query(
      `SELECT id, title, asking_price, city, locality
       FROM properties
       WHERE status = 'ACTIVE'
         AND location && ST_MakeEnvelope($1, $2, $3, $4, 4326)::geography
       ORDER BY asking_price ASC
       LIMIT 50`,
      [minLng, minLat, maxLng, maxLat],
    );
    const duration = performance.now() - start;
    latencies.push(duration);
  }

  return latencies;
}

// ---------------------------------------------------------------------------
// Benchmark: Text-search + price-range combo
// ---------------------------------------------------------------------------
async function benchmarkFilterQueries(iterations: number): Promise<number[]> {
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const city = randomFromArray(CITIES);
    const minPrice = randomFloat(1000000, 5000000);
    const maxPrice = minPrice + randomFloat(5000000, 50000000);
    const bedrooms = Math.floor(randomFloat(1, 4));

    const start = performance.now();
    await pool.query(
      `SELECT id, title, asking_price, city, bedrooms, area_sqft
       FROM properties
       WHERE status = 'ACTIVE'
         AND city = $1
         AND asking_price BETWEEN $2 AND $3
         AND bedrooms >= $4
       ORDER BY asking_price ASC
       LIMIT 20`,
      [city.name, minPrice, maxPrice, bedrooms],
    );
    const duration = performance.now() - start;
    latencies.push(duration);
  }

  return latencies;
}

// ---------------------------------------------------------------------------
// Print results table
// ---------------------------------------------------------------------------
function printResults(name: string, latencies: number[]): void {
  const sorted = [...latencies].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length;
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);

  console.log(`  ${name}`);
  console.log(`  ${'─'.repeat(60)}`);
  console.log(`  Min: ${formatMs(min).padStart(12)}  |  Avg: ${formatMs(avg).padStart(12)}  |  Max: ${formatMs(max).padStart(12)}`);
  console.log(`  P50: ${formatMs(p50).padStart(12)}  |  P95: ${formatMs(p95).padStart(12)}  |  P99: ${formatMs(p99).padStart(12)}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function benchmark(): Promise<void> {
  const ITERATIONS = 100;
  let exitCode = 0;

  console.log('\n🏁 EstateFlow Database Benchmark');
  console.log('================================\n');

  // Check row count
  const countResult = await pool.query<{ count: string }>('SELECT COUNT(*) as count FROM properties WHERE status = \'ACTIVE\'');
  const activeCount = parseInt(countResult.rows[0].count, 10);
  console.log(`  Active properties: ${activeCount.toLocaleString()}\n`);

  if (activeCount === 0) {
    console.error('  ❌ No active properties found. Run seed:perf first.\n');
    await pool.end();
    process.exit(1);
  }

  // Warm up the connection pool
  console.log('  Warming up connection pool...\n');
  for (let i = 0; i < 5; i++) {
    await pool.query('SELECT 1');
  }

  // --- Benchmark 1: Spatial queries ---
  console.log(`  Running ${ITERATIONS} spatial queries (ST_DWithin, 5km radius + filters)...\n`);
  const spatialLatencies = await benchmarkSpatialQueries(ITERATIONS);
  printResults('Spatial Queries (ST_DWithin + filters)', spatialLatencies);

  // --- Benchmark 2: Bounding box queries ---
  console.log(`  Running ${ITERATIONS} bounding box queries...\n`);
  const bboxLatencies = await benchmarkBoundingBoxQueries(ITERATIONS);
  printResults('Bounding Box Queries', bboxLatencies);

  // --- Benchmark 3: Filter queries ---
  console.log(`  Running ${ITERATIONS} filter queries (city + price + bedrooms)...\n`);
  const filterLatencies = await benchmarkFilterQueries(ITERATIONS);
  printResults('Filter Queries (city + price + bedrooms)', filterLatencies);

  // --- Assertions ---
  console.log('  Performance Assertions');
  console.log(`  ${'─'.repeat(60)}`);

  const spatialP95 = percentile([...spatialLatencies].sort((a, b) => a - b), 95);
  const bboxP95 = percentile([...bboxLatencies].sort((a, b) => a - b), 95);
  const filterP95 = percentile([...filterLatencies].sort((a, b) => a - b), 95);

  const threshold = 200; // ms

  if (spatialP95 < threshold) {
    console.log(`  ✅ Spatial P95 (${formatMs(spatialP95)}) < ${threshold}ms`);
  } else {
    console.log(`  ❌ Spatial P95 (${formatMs(spatialP95)}) >= ${threshold}ms — FAILED`);
    exitCode = 1;
  }

  if (bboxP95 < threshold) {
    console.log(`  ✅ Bounding Box P95 (${formatMs(bboxP95)}) < ${threshold}ms`);
  } else {
    console.log(`  ❌ Bounding Box P95 (${formatMs(bboxP95)}) >= ${threshold}ms — FAILED`);
    exitCode = 1;
  }

  if (filterP95 < threshold) {
    console.log(`  ✅ Filter P95 (${formatMs(filterP95)}) < ${threshold}ms`);
  } else {
    console.log(`  ❌ Filter P95 (${formatMs(filterP95)}) >= ${threshold}ms — FAILED`);
    exitCode = 1;
  }

  console.log('');

  if (exitCode === 0) {
    console.log('  🎉 All benchmarks passed!\n');
  } else {
    console.log('  ⚠️  Some benchmarks failed. Review your indexes and query plans.\n');
  }

  await pool.end();
  process.exit(exitCode);
}

benchmark().catch((err) => {
  console.error('❌ Benchmark error:', err);
  process.exit(1);
});
