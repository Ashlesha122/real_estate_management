import axios from 'axios';

const BASE = 'http://localhost:3000/api/v1';

async function runTests() {
  console.log('🚀 Starting Comprehensive EstateFlow E2E API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err: any) {
      console.log('❌ FAIL');
      console.error('   Error:', err.response?.data || err.message);
      failed++;
    }
  }

  let buyerToken = '';
  let ownerToken = '';
  let brokerToken = '';
  let buyerId = '';
  let ownerId = '';
  let brokerId = '';
  let createdPropId = '';
  let createdInquiryId = '';
  let createdVisitId = '';
  let createdLeaseId = '';
  let createdSavedSearchId = '';

  // 1. Demo Login Check
  await test('Login with pre-seeded Owner account', async () => {
    const res = await axios.post(`${BASE}/auth/login`, {
      email: 'owner@estateflow.com',
      password: 'Password123!',
    });
    if (!res.data.accessToken || !res.data.user) throw new Error('Missing token or user');
    ownerToken = res.data.accessToken;
    ownerId = res.data.user.id;
  });

  await test('Login with pre-seeded Buyer account', async () => {
    const res = await axios.post(`${BASE}/auth/login`, {
      email: 'buyer@estateflow.com',
      password: 'Password123!',
    });
    if (!res.data.accessToken) throw new Error('Missing token');
    buyerToken = res.data.accessToken;
    buyerId = res.data.user.id;
  });

  await test('Login with pre-seeded Broker account', async () => {
    const res = await axios.post(`${BASE}/auth/login`, {
      email: 'broker@estateflow.com',
      password: 'Password123!',
    });
    if (!res.data.accessToken) throw new Error('Missing token');
    brokerToken = res.data.accessToken;
    brokerId = res.data.user.id;
  });

  // 2. Register New User Flow
  const testEmail = `newuser_${Date.now()}@example.com`;
  let newUserToken = '';
  await test('Register new Buyer user', async () => {
    const res = await axios.post(`${BASE}/auth/register`, {
      email: testEmail,
      password: 'Password123!',
      fullName: 'Startup QA Tester',
      phone: '+919999988888',
      role: 'BUYER',
    });
    if (!res.data.accessToken) throw new Error('Missing token');
    newUserToken = res.data.accessToken;
  });

  await test('Direct authentication without verification code', async () => {
    const res = await axios.get(`${BASE}/users/me`, {
      headers: { Authorization: `Bearer ${newUserToken}` },
    });
    if (res.data.phoneVerified !== true) throw new Error('User not directly verified');
  });

  await test('Fetch current user profile /users/me', async () => {
    const res = await axios.get(`${BASE}/users/me`, {
      headers: { Authorization: `Bearer ${newUserToken}` },
    });
    if (res.data.phoneVerified !== true) throw new Error('phoneVerified is not true');
  });

  await test('Update profile /users/me', async () => {
    const res = await axios.patch(
      `${BASE}/users/me`,
      { fullName: 'Startup QA Tester Updated', contactPreference: 'WHATSAPP' },
      { headers: { Authorization: `Bearer ${newUserToken}` } }
    );
    if (res.data.fullName !== 'Startup QA Tester Updated') throw new Error('Name not updated');
  });

  // 3. Search and Filtering
  let firstPropId = '';
  await test('Public Search active properties', async () => {
    const res = await axios.get(`${BASE}/search?limit=5`);
    if (!res.data.data || res.data.data.length === 0) throw new Error('No properties returned');
    firstPropId = res.data.data[0].id;
  });

  await test('Public Search with filters: purpose=RENT, city=Mumbai', async () => {
    const res = await axios.get(`${BASE}/search?purpose=RENT&city=Mumbai`);
    if (!res.data.data) throw new Error('Search failed');
  });

  await test('Search with Bounding Box /search/bbox', async () => {
    const res = await axios.get(`${BASE}/search/bbox?north=30&south=10&east=85&west=70`);
    if (!res.data.data) throw new Error('BBox search failed');
  });

  await test('Get Property Detail /properties/:id/detail', async () => {
    const res = await axios.get(`${BASE}/properties/${firstPropId}/detail`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (!res.data.id || res.data.view_count === undefined) throw new Error('Detail view failed');
  });

  // 4. Wishlist Flow
  await test('Add property to Wishlist', async () => {
    await axios.post(
      `${BASE}/wishlist/${firstPropId}`,
      {},
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
  });

  await test('Fetch Wishlist', async () => {
    const res = await axios.get(`${BASE}/wishlist`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (!res.data.data || res.data.data.length === 0) throw new Error('Wishlist empty');
  });

  await test('Compare Wishlisted properties', async () => {
    const res = await axios.get(`${BASE}/wishlist/compare?ids=${firstPropId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Compare returned empty');
  });

  // 5. Property Creation & Publishing Flow (Owner)
  await test('Owner creates draft property', async () => {
    const res = await axios.post(
      `${BASE}/properties`,
      {
        title: 'New Luxury Penthouse Indiranagar',
        type: 'APARTMENT',
        purpose: 'SALE',
        askingPrice: 35000000,
        securityDeposit: 0,
        description: 'Brand new luxury penthouse with private terrace in Indiranagar, Bangalore.',
        areaSqft: 3200,
        carpetAreaSqft: 2800,
        bedrooms: 4,
        bathrooms: 4,
        floorLevel: 10,
        totalFloors: 12,
        furnishing: 'FULLY_FURNISHED',
        parking: 2,
        amenities: ['Gym', 'Swimming Pool', 'Security', 'Power Backup'],
        streetAddress: '100 Feet Road, Indiranagar',
        city: 'Bangalore',
        locality: 'Indiranagar',
        postalCode: '560038',
        latitude: 12.9716,
        longitude: 77.6412,
        handlingMode: 'DIRECT',
      },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    if (!res.data.id) throw new Error('Property creation failed');
    createdPropId = res.data.id;
  });

  await test('Owner uploads media to property', async () => {
    const res = await axios.post(
      `${BASE}/properties/${createdPropId}/media`,
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'IMAGE',
        isCover: true,
      },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    if (!res.data) throw new Error('Media upload failed');
  });

  await test('Owner publishes property', async () => {
    const res = await axios.post(
      `${BASE}/properties/${createdPropId}/publish`,
      {},
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    if (res.data.status !== 'ACTIVE') throw new Error('Publish status not ACTIVE');
  });

  await test('Owner gets My Listings', async () => {
    const res = await axios.get(`${BASE}/properties/my`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (!res.data.data || res.data.data.length === 0) throw new Error('My listings empty');
  });

  // 6. Inquiry & Lead Flow
  await test('Buyer submits Inquiry on newly published property', async () => {
    const res = await axios.post(
      `${BASE}/inquiries`,
      {
        propertyId: createdPropId,
        message: 'Hello, I am interested in scheduling a site visit this weekend!',
        contactMode: 'CALL',
      },
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
    if (!res.data.id) throw new Error('Inquiry creation failed');
    createdInquiryId = res.data.id;
  });

  await test('Buyer views My Inquiries', async () => {
    const res = await axios.get(`${BASE}/inquiries/my`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (!res.data.data || res.data.data.length === 0) throw new Error('My inquiries empty');
  });

  await test('Owner views Leads Board /leads', async () => {
    const res = await axios.get(`${BASE}/leads`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (!res.data.data || res.data.data.length === 0) throw new Error('Leads board empty');
  });

  await test('Owner adds note to lead', async () => {
    const res = await axios.post(
      `${BASE}/leads/${createdInquiryId}/notes`,
      { body: 'Called client, very interested in pricing negotiations.' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    if (!res.data) throw new Error('Failed to add note');
  });

  await test('Owner moves lead stage to SITE_VISIT_SCHEDULED', async () => {
    const res = await axios.patch(
      `${BASE}/leads/${createdInquiryId}`,
      { stage: 'SITE_VISIT_SCHEDULED' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    if (res.data.stage !== 'SITE_VISIT_SCHEDULED') throw new Error('Lead stage not updated');
  });

  // 7. Site Visits Flow
  const visitDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  await test('Buyer requests site visit', async () => {
    const res = await axios.post(
      `${BASE}/visits`,
      {
        inquiryId: createdInquiryId,
        scheduledAt: visitDate,
        mode: 'IN_PERSON',
        notes: 'Looking forward to meeting.',
      },
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
    if (!res.data.id) throw new Error('Visit creation failed');
    createdVisitId = res.data.id;
  });

  await test('Buyer views My Visits', async () => {
    const res = await axios.get(`${BASE}/visits/my`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (!res.data.data || res.data.data.length === 0) throw new Error('My visits empty');
  });

  await test('Owner views Handler Visits', async () => {
    const res = await axios.get(`${BASE}/visits/handler`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (!res.data.data || res.data.data.length === 0) throw new Error('Handler visits empty');
  });

  await test('Owner confirms site visit', async () => {
    const res = await axios.patch(
      `${BASE}/visits/${createdVisitId}`,
      { status: 'CONFIRMED' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    if (res.data.status !== 'CONFIRMED') throw new Error('Visit confirmation failed');
  });

  // 8. Availability Flow
  await test('Owner sets Availability Rules', async () => {
    const res = await axios.put(
      `${BASE}/availability/rules`,
      {
        rules: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },
        ],
      },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Rules setting failed');
  });

  await test('Get Handler Available Slots for booking', async () => {
    const futureMonday = new Date();
    futureMonday.setDate(futureMonday.getDate() + ((1 + 7 - futureMonday.getDay()) % 7 || 7));
    const dateStr = futureMonday.toISOString().split('T')[0];

    const res = await axios.get(`${BASE}/availability/${ownerId}/slots?date=${dateStr}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (!Array.isArray(res.data)) throw new Error('Slots fetch failed');
  });

  // 9. Lease Records Flow
  await test('Owner creates Lease / Sale Record', async () => {
    const res = await axios.post(
      `${BASE}/lease-records`,
      {
        propertyId: createdPropId,
        counterpartyName: 'Rahul Verma',
        counterpartyPhone: '+919876543299',
        recordType: 'SALE',
        startDate: new Date().toISOString().split('T')[0],
        amount: 34500000,
        notes: 'Final sale agreement signed, registration scheduled next month.',
      },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    if (!res.data.id) throw new Error('Lease record creation failed');
    createdLeaseId = res.data.id;
  });

  await test('Owner fetches Lease Records', async () => {
    const res = await axios.get(`${BASE}/lease-records`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (!res.data.data || res.data.data.length === 0) throw new Error('Lease records empty');
  });

  // 10. Saved Search Flow
  await test('Buyer creates Saved Search', async () => {
    const res = await axios.post(
      `${BASE}/saved-searches`,
      {
        name: 'Bangalore 3BHK Rentals',
        filters: { city: 'Bangalore', bedrooms: 3, purpose: 'RENT' },
        notify: true,
      },
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
    if (!res.data.id) throw new Error('Saved search creation failed');
    createdSavedSearchId = res.data.id;
  });

  await test('Buyer lists Saved Searches', async () => {
    const res = await axios.get(`${BASE}/saved-searches`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('Saved searches empty');
  });

  await test('Buyer deletes Saved Search', async () => {
    await axios.delete(`${BASE}/saved-searches/${createdSavedSearchId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
  });

  // 11. Notifications Flow
  await test('Fetch user notifications', async () => {
    const res = await axios.get(`${BASE}/notifications`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (!res.data.data) throw new Error('Notifications list failed');
  });

  await test('Fetch unread notifications count', async () => {
    const res = await axios.get(`${BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (res.data.count === undefined) throw new Error('Unread count failed');
  });

  await test('Mark notifications as read', async () => {
    await axios.post(
      `${BASE}/notifications/read`,
      { all: true },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
  });

  // 12. Broker Directory Flow
  await test('Owner queries Brokers Directory', async () => {
    const res = await axios.get(`${BASE}/brokers`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (!res.data.data) throw new Error('Brokers list failed');
  });

  // 13. Remove from Wishlist
  await test('Remove property from Wishlist', async () => {
    await axios.delete(`${BASE}/wishlist/${firstPropId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
  });

  console.log(`\n================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
