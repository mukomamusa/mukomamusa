const http = require('http');

// First, login as company to get a token
const loginData = JSON.stringify({
  email: 'info@juldan.com', // Juldan Motors
  password: 'password123'
});

console.log('🔐 Testing Route Deactivate Functionality...\n');

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const result = JSON.parse(data);
      console.log('✅ Login successful as:', result.user.company_name || result.user.name);
      testRouteDeactivate(result.token);
    } else {
      console.log('❌ Login failed:', data);
    }
  });
});

loginReq.on('error', (e) => {
  console.log('❌ Error connecting to server:', e.message);
  console.log('   Make sure the dev server is running (npm run dev)');
});

loginReq.write(loginData);
loginReq.end();

function testRouteDeactivate(token) {
  // First get routes to find one to test
  const getOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/company/routes',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  const getReq = http.request(getOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const result = JSON.parse(data);
        const routes = result.routes || [];
        console.log(`\n📋 Found ${routes.length} routes`);
        
        if (routes.length > 0) {
          const testRoute = routes[0];
          console.log(`\n🔄 Testing with route: ${testRoute.origin} → ${testRoute.destination}`);
          console.log(`   Current status: ${testRoute.status}`);
          
          const newStatus = testRoute.status === 'active' ? 'inactive' : 'active';
          toggleRouteStatus(token, testRoute.id, newStatus, testRoute.status);
        } else {
          console.log('⚠️ No routes found to test');
        }
      } else {
        console.log('❌ Failed to get routes:', data);
      }
    });
  });

  getReq.on('error', (e) => console.log('❌ Error:', e.message));
  getReq.end();
}

function toggleRouteStatus(token, routeId, newStatus, originalStatus) {
  const updateData = JSON.stringify({ status: newStatus });
  
  const updateOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/company/routes/${routeId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': updateData.length,
      'Authorization': `Bearer ${token}`
    }
  };

  console.log(`\n⏳ Changing status from "${originalStatus}" to "${newStatus}"...`);

  const updateReq = http.request(updateOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const result = JSON.parse(data);
        console.log('✅ Status update successful!');
        console.log(`   New status: ${result.route.status}`);
        
        // Revert back to original status
        console.log(`\n🔄 Reverting back to "${originalStatus}"...`);
        revertStatus(token, routeId, originalStatus);
      } else {
        console.log('❌ Status update failed:', data);
      }
    });
  });

  updateReq.on('error', (e) => console.log('❌ Error:', e.message));
  updateReq.write(updateData);
  updateReq.end();
}

function revertStatus(token, routeId, originalStatus) {
  const updateData = JSON.stringify({ status: originalStatus });
  
  const updateOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/company/routes/${routeId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': updateData.length,
      'Authorization': `Bearer ${token}`
    }
  };

  const updateReq = http.request(updateOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Reverted to original status');
        console.log('\n🎉 All tests passed! Route deactivate/activate works correctly.');
      } else {
        console.log('⚠️ Revert failed:', data);
      }
    });
  });

  updateReq.on('error', (e) => console.log('❌ Error:', e.message));
  updateReq.write(updateData);
  updateReq.end();
}
