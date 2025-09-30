const axios = require('axios');

async function testEndpoints() {
  const baseURL = 'http://localhost:3001/api/admin';
  
  console.log('🧪 Testing Color Settings Endpoints...\n');
  
  try {
    // Test GET colors endpoint (no auth required for this route)
    console.log('1️⃣ Testing GET /settings/colors...');
    const getResponse = await axios.get(`${baseURL}/settings/colors`);
    console.log('✅ GET colors successful:');
    console.log(JSON.stringify(getResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ GET colors failed:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.log('No response received - server might not be running');
    } else {
      console.log('Error:', error.message);
    }
  }
  
  try {
    // Test PUT colors endpoint (requires auth)
    console.log('\n2️⃣ Testing PUT /settings/colors (will fail without auth)...');
    const putResponse = await axios.put(`${baseURL}/settings/colors`, {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        background: '#ffffff',
        textPrimary: '#1f2937',
        header: '#3b82f6',
        footer: '#6b7280'
      }
    });
    console.log('✅ PUT colors successful:', putResponse.data);
    
  } catch (error) {
    console.log('⚠️  PUT colors failed (expected without auth):');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.response.data.message}`);
    } else {
      console.log('Error:', error.message);
    }
  }
  
  try {
    // Test POST reset endpoint (requires auth)
    console.log('\n3️⃣ Testing POST /settings/colors/reset (will fail without auth)...');
    const resetResponse = await axios.post(`${baseURL}/settings/colors/reset`);
    console.log('✅ Reset colors successful:', resetResponse.data);
    
  } catch (error) {
    console.log('⚠️️  Reset colors failed (expected without auth):');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.response.data.message}`);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testEndpoints();
