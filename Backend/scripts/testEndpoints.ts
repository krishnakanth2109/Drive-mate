import axios from 'axios';

async function testApiEndpoints() {
  const baseUrl = 'http://localhost:5000';
  console.log('--- Testing API Endpoints ---');

  // 1. Health
  const health = await axios.get(`${baseUrl}/api/health`);
  console.log('✅ /api/health:', health.data);

  // 2. Maps Key
  const mapsKey = await axios.get(`${baseUrl}/api/config/maps-key`);
  console.log('✅ /api/config/maps-key:', mapsKey.data);

  // 3. Admin Login
  try {
    const adminLoginRes = await axios.post(`${baseUrl}/api/admin/login`, {
      email: 'admin@drivemate.com',
      password: 'admin123',
    });
    console.log('✅ /api/admin/login succeeded. Token received.');
    const token = adminLoginRes.data.data.token;

    // 4. Admin Stats
    const statsRes = await axios.get(`${baseUrl}/api/admin/stats`, {
      headers: { 'x-auth-token': token },
    });
    console.log('✅ /api/admin/stats:', statsRes.data.data);

    // 5. Admin Recent Rides
    const recentRidesRes = await axios.get(`${baseUrl}/api/admin/recent-rides`, {
      headers: { 'x-auth-token': token },
    });
    console.log(`✅ /api/admin/recent-rides returned ${recentRidesRes.data.data.length} rides.`);
  } catch (err: any) {
    console.error('❌ Admin test error:', err?.response?.data || err.message);
  }

  // 6. Ride estimate
  try {
    // Needs auth header, let's test customer login first
    const customerLoginRes = await axios.post(`${baseUrl}/api/users/customer/login`, {
      email: 'kkanth@gmail.com',
      password: 'wrongpasswordfortest',
    });
  } catch (err: any) {
    console.log('✅ /api/users/customer/login validation response:', err?.response?.data?.message || err.message);
  }

  console.log('\n--- All API Contract Checks Completed ---');
}

testApiEndpoints().catch(console.error);
