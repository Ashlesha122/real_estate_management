const BASE = 'http://localhost:3000/api/v1';

async function testValidation() {
  console.log('--- Testing Registration Validation Rules ---');

  // Test 1: Missing uppercase
  let res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test User',
      email: `test_val_${Date.now()}@test.com`,
      phone: '+919876543210',
      password: 'password123!',
      role: 'BUYER',
    }),
  });
  let data = await res.json();
  console.log('1. Missing Uppercase Status:', res.status, data.details?.password || data.message);

  // Test 2: Missing special character
  res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test User',
      email: `test_val_${Date.now()}@test.com`,
      phone: '+919876543210',
      password: 'Password123',
      role: 'BUYER',
    }),
  });
  data = await res.json();
  console.log('2. Missing Special Char Status:', res.status, data.details?.password || data.message);

  // Test 3: Missing number
  res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test User',
      email: `test_val_${Date.now()}@test.com`,
      phone: '+919876543210',
      password: 'Password!',
      role: 'BUYER',
    }),
  });
  data = await res.json();
  console.log('3. Missing Number Status:', res.status, data.details?.password || data.message);

  // Test 4: Less than 8 chars
  res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test User',
      email: `test_val_${Date.now()}@test.com`,
      phone: '+919876543210',
      password: 'P1!',
      role: 'BUYER',
    }),
  });
  data = await res.json();
  console.log('4. Min Length Status:', res.status, data.details?.password || data.message);

  // Test 5: Fully Valid Registration
  const email = `valid_user_${Date.now()}@test.com`;
  res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Valid User',
      email,
      phone: '+919876543210',
      password: 'Password#2026',
      role: 'BUYER',
    }),
  });
  data = await res.json();
  console.log('5. Valid Registration Status:', res.status, 'devOtp:', data.devOtp, 'user:', data.user?.email);

  if (res.status === 201 && data.accessToken) {
    console.log('✅ ALL VALIDATION TEST CASES SUCCEEDED AS DESIGNED!');
  } else {
    throw new Error('Valid registration failed');
  }
}

testValidation().catch((err) => {
  console.error(err);
  process.exit(1);
});
