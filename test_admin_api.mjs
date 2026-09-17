async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@drivemate.com',
        password: 'adminpassword123'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login successful', loginRes.status);
    if (!loginData.data) {
       console.log('No data', loginData);
       return;
    }
    const token = loginData.data.token;
    
    console.log('Testing /api/admin/stats');
    const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
      headers: { 'x-auth-token': token }
    });
    console.log('Stats successful', statsRes.status);

    console.log('Testing /api/admin/recent-rides');
    const ridesRes = await fetch('http://localhost:5000/api/admin/recent-rides', {
      headers: { 'x-auth-token': token }
    });
    console.log('Recent rides successful', ridesRes.status);

  } catch (err) {
    console.error('Error:', err);
  }
}
test();
