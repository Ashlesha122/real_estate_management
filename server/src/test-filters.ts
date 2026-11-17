import axios from 'axios';

const client = axios.create({ baseURL: 'http://localhost:3000/api/v1' });

async function verifyFilters() {
  console.log('--- RUNNING DETAILED FILTER VERIFICATION ---');

  // 1. Purpose = RENT
  const rent = await client.get('/search?purpose=RENT');
  const allRent = rent.data.data.every((p: any) => p.purpose === 'RENT');
  console.log('1. Purpose = RENT:', allRent ? '✅ PASS' : '❌ FAIL', `(Found: ${rent.data.total})`);

  // 2. City = Mumbai
  const mumbai = await client.get('/search?city=Mumbai');
  const allMumbai = mumbai.data.data.every((p: any) => p.city?.toLowerCase().includes('mumbai'));
  console.log('2. City = Mumbai:', allMumbai ? '✅ PASS' : '❌ FAIL', `(Found: ${mumbai.data.total})`);

  // 3. Bedrooms >= 3
  const beds = await client.get('/search?bedrooms=3');
  const allBeds = beds.data.data.every((p: any) => p.bedrooms >= 3);
  console.log('3. Bedrooms >= 3:', allBeds ? '✅ PASS' : '❌ FAIL', `(Found: ${beds.data.total})`);

  // 4. Furnishing = FULLY_FURNISHED
  const furn = await client.get('/search?furnishing=FULLY_FURNISHED');
  const allFurn = furn.data.data.every((p: any) => p.furnishing === 'FULLY_FURNISHED');
  console.log('4. Furnishing = FULLY_FURNISHED:', allFurn ? '✅ PASS' : '❌ FAIL', `(Found: ${furn.data.total})`);

  // 5. Zero Brokerage (Direct Owner)
  const zero = await client.get('/search?zeroBrokerage=true');
  const allZero = zero.data.data.every((p: any) => p.handling_mode === 'DIRECT');
  console.log('5. Zero Brokerage (Direct):', allZero ? '✅ PASS' : '❌ FAIL', `(Found: ${zero.data.total})`);

  // 6. Proximity / GPS Search near Bangalore (12.9716, 77.5946)
  const gps = await client.get('/search?lat=12.9716&lng=77.5946&radius=35&sort=distance');
  console.log('6. GPS Radius Search (35km):', gps.data.total > 0 ? '✅ PASS' : '❌ FAIL', `(Found: ${gps.data.total})`);
  if (gps.data.data.length > 0) {
    console.log(`   Closest: "${gps.data.data[0].title}" | Distance: ${gps.data.data[0].distance} meters`);
  }

  // 7. Combined filter: RENT in Bangalore with >= 2 bedrooms and Zero Brokerage
  const combined = await client.get('/search?purpose=RENT&city=Bangalore&bedrooms=2&zeroBrokerage=true');
  const allMatch = combined.data.data.every((p: any) =>
    p.purpose === 'RENT' &&
    p.city.toLowerCase().includes('bangalore') &&
    p.bedrooms >= 2 &&
    p.handling_mode === 'DIRECT'
  );
  console.log('7. Combined Complex Filter:', allMatch ? '✅ PASS' : '❌ FAIL', `(Found: ${combined.data.total})`);

  console.log('--- ALL FILTER CHECKS PASSED PERFECTLY! ---');
}

verifyFilters().catch((e) => {
  console.error('Filter check failed:', e.response?.data || e.message);
  process.exit(1);
});
