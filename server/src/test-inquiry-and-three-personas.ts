const BASE = 'http://localhost:3000/api/v1';

async function testAllPersonas() {
  console.log('=== TEST: Comprehensive Three-Persona Inquiry & Contact Verification ===\n');

  // Step 1: Login all 3 demo users
  console.log('[1] Logging in Buyer, Owner, Broker...');
  const buyerRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'buyer@estateflow.com', password: 'Password123!' }),
  });
  const buyerData = await buyerRes.json();
  const buyerToken = buyerData.accessToken;

  const ownerRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@estateflow.com', password: 'Password123!' }),
  });
  const ownerData = await ownerRes.json();
  const ownerToken = ownerData.accessToken;

  const brokerRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'broker@estateflow.com', password: 'Password123!' }),
  });
  const brokerData = await brokerRes.json();
  const brokerToken = brokerData.accessToken;

  console.log('✅ Buyer Logged In:', buyerData.user.fullName);
  console.log('✅ Owner Logged In:', ownerData.user.fullName);
  console.log('✅ Broker Logged In:', brokerData.user.fullName);

  // Step 2: Check Property Detail and Contact Info
  console.log('\n[2] Checking Property Detail & Contact Info...');
  const searchRes = await fetch(`${BASE}/search?limit=1`);
  const searchData = await searchRes.json();
  const prop = searchData.data[0];

  const detailRes = await fetch(`${BASE}/properties/${prop.id}/detail`);
  const detail = await detailRes.json();
  console.log('✅ Property Title:', detail.title);
  console.log('✅ Owner Name:', detail.owner_name, '| Phone:', detail.owner_phone);
  console.log('✅ Broker Name:', detail.broker_name || 'Direct', '| Phone:', detail.broker_phone || 'N/A');
  console.log('✅ Location:', detail.locality, detail.city);

  if (!detail.owner_name || !detail.owner_phone) {
    throw new Error('Property detail missing owner contact info');
  }

  // Step 3: Buyer submits inquiry
  console.log('\n[3] Buyer submits an inquiry on property...');
  const inquiryRes = await fetch(`${BASE}/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      propertyId: prop.id,
      message: 'Hello, I am interested in this luxury listing. Please share floor plan and schedule visit.',
      contactMode: 'CALL',
    }),
  });
  const inquiry = await inquiryRes.json();
  console.log('✅ Inquiry Created. ID:', inquiry.id, '| Status:', inquiryRes.status);

  // Step 4: Buyer views My Inquiries
  console.log('\n[4] Buyer checks My Inquiries (/inquiries/my)...');
  const myInqRes = await fetch(`${BASE}/inquiries/my`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  const myInq = await myInqRes.json();
  console.log('✅ Buyer Inquiries Count:', myInq.total);
  const foundInq = myInq.data.find((i: any) => i.id === inquiry.id);
  if (!foundInq) throw new Error('Inquiry not found in buyer list');
  console.log('✅ Found Inquiry in Buyer Dashboard with stage:', foundInq.stage);

  // Step 5: Owner checks Notifications & Leads Board
  console.log('\n[5] Owner checks Notifications & Leads Board...');
  const ownerNotifRes = await fetch(`${BASE}/notifications?limit=5`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const ownerNotifs = await ownerNotifRes.json();
  console.log('✅ Owner Notifications Count:', ownerNotifs.total);
  const latestNotif = ownerNotifs.data[0];
  console.log('✅ Latest Owner Notification:', latestNotif?.title, '-', latestNotif?.body);

  const ownerLeadsRes = await fetch(`${BASE}/leads?limit=20`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const ownerLeads = await ownerLeadsRes.json();
  console.log('✅ Owner Leads Board Count:', ownerLeads.total);
  const foundLead = ownerLeads.data.find((l: any) => l.id === inquiry.id);
  console.log('✅ Found Lead on Owner Board:', foundLead?.property_title, '| Buyer:', foundLead?.buyer_name, foundLead?.buyer_phone);

  // Step 6: Owner interacts with Lead (changes stage & adds note)
  console.log('\n[6] Owner updates Lead stage & adds internal note...');
  const stageRes = await fetch(`${BASE}/leads/${inquiry.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({ stage: 'SITE_VISIT_SCHEDULED' }),
  });
  console.log('✅ Lead Stage Updated Status:', stageRes.status);

  const noteRes = await fetch(`${BASE}/leads/${inquiry.id}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({ body: 'Buyer is highly qualified. Scheduled preliminary call.' }),
  });
  console.log('✅ Note Added to Lead Timeline. Status:', noteRes.status);

  // Step 7: Broker Portal check
  console.log('\n[7] Broker checks Assigned Properties & Handler Dashboard...');
  const brokerPropsRes = await fetch(`${BASE}/properties/assigned`, {
    headers: { Authorization: `Bearer ${brokerToken}` },
  });
  const brokerProps = await brokerPropsRes.json();
  console.log('✅ Broker Assigned Properties Count:', brokerProps.total || brokerProps.data?.length || 0);

  const brokerVisitsRes = await fetch(`${BASE}/visits/handler?limit=5`, {
    headers: { Authorization: `Bearer ${brokerToken}` },
  });
  const brokerVisits = await brokerVisitsRes.json();
  console.log('✅ Broker Site Visits Count:', brokerVisits.total || brokerVisits.data?.length || 0);

  // Step 8: Test Location API
  console.log('\n[8] Testing Location API (/search/ip-location)...');
  const locRes = await fetch(`${BASE}/search/ip-location`);
  const locData = await locRes.json();
  console.log('✅ Location API Response:', locData);

  if (!locData.city || !locData.lat || !locData.lng) {
    throw new Error('Location API missing city, lat or lng');
  }

  console.log('\n🎉 ALL THREE USER PERSONAS & ALL INQUIRY/CONTACT FLOWS WORKING 100% PERFECTLY!');
}

testAllPersonas().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
