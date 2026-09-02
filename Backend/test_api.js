// Integration Test Script for Backend API
const BASE_URL = 'http://localhost:5000/api';

const randomString = () => Math.random().toString(36).substring(7);

async function runTests() {
  console.log('--- STARTING BACKEND INTEGRATION TESTS ---\n');
  const dummyEmail = `test_${randomString()}@example.com`;
  const dummyPassword = 'password123';
  let token = '';
  
  try {
    // 1. REGISTER CUSTOMER
    console.log(`[1/5] Registering Customer: ${dummyEmail}...`);
    let res = await fetch(`${BASE_URL}/users/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: dummyEmail,
        phone: '1234567890',
        password: dummyPassword
      })
    });
    let data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    console.log('  ✅ Success\n');

    // 2. LOGIN CUSTOMER
    console.log(`[2/5] Logging in Customer...`);
    res = await fetch(`${BASE_URL}/users/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: dummyEmail, password: dummyPassword })
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    token = data.token;
    console.log('  ✅ Success (JWT Token Received)\n');

    // 3. FETCH PROFILE BALANCES
    console.log(`[3/5] Fetching Initial Profile Balances...`);
    res = await fetch(`${BASE_URL}/profile/balances`, {
      method: 'GET',
      headers: { 'x-auth-token': token }
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch balances');
    console.log(`  ✅ Success (Wallet: ₹${data.walletBalance}, Coins: ${data.coinBalance})\n`);

    // 4. TOP-UP WALLET
    console.log(`[4/5] Topping up Wallet with ₹500...`);
    res = await fetch(`${BASE_URL}/profile/wallet/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ amount: 500, paymentMethod: 'UPI' })
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to top-up wallet');
    console.log(`  ✅ Success (New Balance: ₹${data.walletBalance})\n`);

    // 5. SUBSCRIBE TO POWER PASS
    console.log(`[5/5] Subscribing to Power Pass (Pro)...`);
    res = await fetch(`${BASE_URL}/profile/power-pass/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ tier: 'Pro', durationMonths: 3 })
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to subscribe to Power Pass');
    console.log(`  ✅ Success (Pass is now Active)\n`);

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! The backend is fully functional.');

  } catch (err) {
    console.error(`❌ TEST FAILED: ${err.message}`);
  }
}

runTests();
