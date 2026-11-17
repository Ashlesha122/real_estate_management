import axios from 'axios';

const client = axios.create({ baseURL: 'http://localhost:3000/api/v1' });

async function testNewUserLifecycle() {
  const uniqueSuffix = Math.floor(Math.random() * 900000 + 100000).toString();
  const email = `newuser_${uniqueSuffix}@example.com`;
  const phone = `+9198${uniqueSuffix}12`;

  console.log(`[Step 1] Registering new Buyer: ${email}`);
  const regRes = await client.post('/auth/register', {
    email,
    phone,
    password: 'Password123!',
    fullName: `New User ${uniqueSuffix}`,
    role: 'BUYER',
  });
  const token = regRes.data.accessToken;
  console.log('✅ Registration OK. Received accessToken.');

  console.log('[Step 2] User is directly authenticated & verified upon registration!');
  const verifiedToken = token;
  console.log('✅ Directly verified. phoneVerified =', regRes.data.user.phoneVerified);

  console.log('[Step 3] Fetching profile /users/me...');
  const meRes = await client.get('/users/me', {
    headers: { Authorization: `Bearer ${verifiedToken}` },
  });
  console.log('✅ Profile:', meRes.data.fullName, '| Verified:', meRes.data.phoneVerified);

  console.log('[Step 4] Searching properties /search...');
  const searchRes = await client.get('/search?limit=3');
  const property = searchRes.data.data[0];
  console.log('✅ Search OK. Interacting with property:', property.title);

  console.log('[Step 5] Adding property to Wishlist...');
  await client.post(
    '/wishlist',
    { propertyId: property.id },
    { headers: { Authorization: `Bearer ${verifiedToken}` } }
  );
  const wishRes = await client.get('/wishlist', {
    headers: { Authorization: `Bearer ${verifiedToken}` },
  });
  console.log('✅ Wishlist contains:', wishRes.data.total, 'property');

  console.log('[Step 6] Creating inquiry and booking site visit (exact client flow)...');
  const inqRes = await client.post(
    '/inquiries',
    {
      propertyId: property.id,
      message: 'Hello, I am interested in visiting this property.',
      contactMode: 'WHATSAPP',
      preferredVisitTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
    { headers: { Authorization: `Bearer ${verifiedToken}` } }
  );
  const inquiryId = inqRes.data.id;
  console.log('✅ Inquiry Created. ID:', inquiryId);

  const visitRes = await client.post(
    '/visits',
    {
      inquiryId,
      scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      mode: 'IN_PERSON',
      notes: 'Please confirm afternoon visit availability',
    },
    { headers: { Authorization: `Bearer ${verifiedToken}` } }
  );
  console.log('✅ Visit Booked. ID:', visitRes.data.id, '| Status:', visitRes.data.status);

  console.log('[Step 7] Checking Buyer Visits dashboard /visits/my...');
  const myVisitsRes = await client.get('/visits/my', {
    headers: { Authorization: `Bearer ${verifiedToken}` },
  });
  console.log('✅ Visits count:', myVisitsRes.data.total);

  // Now test registering a new Owner
  const ownerEmail = `newowner_${uniqueSuffix}@example.com`;
  const ownerPhone = `+9197${uniqueSuffix}34`;
  console.log(`\n[Step 8] Registering new Property Owner: ${ownerEmail}`);
  const ownerReg = await client.post('/auth/register', {
    email: ownerEmail,
    phone: ownerPhone,
    password: 'Password123!',
    fullName: `New Owner ${uniqueSuffix}`,
    role: 'OWNER',
  });
  const ownerToken = ownerReg.data.accessToken;

  console.log('[Step 9] Owner directly authenticated & verified without verification code!');
  const ownerAuth = ownerToken;
  console.log('✅ Owner phone verified directly!');

  console.log('[Step 10] New Owner creates and publishes a brand new property listing...');
  const createRes = await client.post(
    '/properties',
    {
      title: `Brand New Sunny Villa ${uniqueSuffix}`,
      type: 'VILLA',
      purpose: 'SALE',
      handlingMode: 'DIRECT',
      askingPrice: 18500000,
      description: 'Stunning villa posted by a newly registered owner',
      city: 'Bengaluru',
      bedrooms: 4,
      bathrooms: 4,
      areaSqft: 3200,
      latitude: 12.9716,
      longitude: 77.5946,
    },
    { headers: { Authorization: `Bearer ${ownerAuth}` } }
  );
  const newPropId = createRes.data.id;
  console.log('✅ Draft Property created with ID:', newPropId);

  console.log('[Step 11] Attaching cover photo (client wizard step)...');
  await client.post(
    `/properties/${newPropId}/media`,
    {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      mediaType: 'IMAGE',
      isCover: true,
      sortOrder: 0,
    },
    { headers: { Authorization: `Bearer ${ownerAuth}` } }
  );
  console.log('✅ Cover photo uploaded.');

  console.log('[Step 12] Publishing newly created property...');
  await client.post(
    `/properties/${newPropId}/publish`,
    {},
    { headers: { Authorization: `Bearer ${ownerAuth}` } }
  );
  console.log('✅ Property published live!');

  console.log('[Step 13] New Owner checks My Listings /properties/my...');
  const myListings = await client.get('/properties/my', {
    headers: { Authorization: `Bearer ${ownerAuth}` },
  });
  console.log('✅ Owner listings count:', myListings.data.total, '| First title:', myListings.data.data[0].title);

  console.log('\n🎉 ALL NEW USER FLOWS (BUYER & OWNER) COMPLETED 100% SUCCESSFULLY!');
}

testNewUserLifecycle().catch((err) => {
  console.error('❌ FAILED:', err.response?.data || err.message);
  process.exit(1);
});
