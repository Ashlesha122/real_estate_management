const BASE = 'http://localhost:3000/api/v1';

async function runTests() {
  console.log('=== TEST 1: Direct Authentication Without Verification Code ===');
  const email = `direct_auth_${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Direct User',
      email,
      phone: '+919876543210',
      password: 'EstateFlow#2026',
      role: 'BUYER',
    }),
  });

  const regData = await regRes.json();
  console.log('Register Status:', regRes.status);
  console.log('User phoneVerified in response:', regData.user?.phoneVerified);

  if (regRes.status !== 201 || !regData.user?.phoneVerified) {
    throw new Error('Registration did not produce verified user');
  }

  // Directly access authenticated protected endpoint without ever touching /auth/verify-otp
  const meRes = await fetch(`${BASE}/users/me`, {
    headers: { Authorization: `Bearer ${regData.accessToken}` },
  });
  const meData = await meRes.json();
  console.log('Direct /users/me Status:', meRes.status, 'Verified:', meData.phoneVerified);

  if (meRes.status !== 200 || !meData.phoneVerified) {
    throw new Error('Protected endpoint failed for directly authenticated user');
  }
  console.log('✅ TEST 1 PASSED: Verification code removed for authentication!\n');

  console.log('=== TEST 2: Forgot Password & Reset Flow ===');
  // 1. Request forgot password
  const forgotRes = await fetch(`${BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const forgotData = await forgotRes.json();
  console.log('Forgot Password Status:', forgotRes.status, 'Message:', forgotData.message, 'devResetCode:', forgotData.devResetCode);

  if (forgotRes.status !== 200 || !forgotData.devResetCode) {
    throw new Error('Forgot password request failed or missing reset code');
  }

  // 2. Reset password
  const resetRes = await fetch(`${BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      code: forgotData.devResetCode,
      newPassword: 'BrandNewPassword#2026',
    }),
  });
  const resetData = await resetRes.json();
  console.log('Reset Password Status:', resetRes.status, 'Message:', resetData.message);

  if (resetRes.status !== 200) {
    throw new Error('Reset password failed');
  }

  // 3. Login with old password (must fail)
  const oldLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'EstateFlow#2026' }),
  });
  console.log('Old Password Login Status (expected 401):', oldLoginRes.status);
  if (oldLoginRes.status !== 401) {
    throw new Error('Old password should not work after reset');
  }

  // 4. Login with new password (must succeed)
  const newLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'BrandNewPassword#2026' }),
  });
  const newLoginData = await newLoginRes.json();
  console.log('New Password Login Status (expected 200):', newLoginRes.status, 'Token:', !!newLoginData.accessToken);

  if (newLoginRes.status !== 200 || !newLoginData.accessToken) {
    throw new Error('New password login failed');
  }

  console.log('✅ TEST 2 PASSED: Forgot Password & Reset Flow working 100% smoothly!\n');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
