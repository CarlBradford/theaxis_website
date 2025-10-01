const axios = require('axios');

// You need to get a real token from the frontend auth
// For testing, you can manually create a user token or use an existing one
async function testWithAuth() {
  const baseURL = 'http://localhost:3001/api/admin';
  
  // This is just a placeholder - you'll need a real token from login
  const authToken = 'your-auth-token-here';
  
  console.log('🧪 Testing Color Settings with Authentication...\n');
  
  if (authToken === 'your-auth-token-here') {
    console.log('❌ Please update the authToken variable with a real token from login');
    console.log('   You can get this by:');
    console.log('   1. Login to the frontend as ADMINISTRATOR or SYSTEM_ADMIN');
    console.log('   2. Open browser DevTools > Application > Local Storage');
    console.log('   3. Copy the "token" value');
    return;
  }
  
  try {
    // Test POST reset to create initial colors
    console.log('1️⃣ Testing POST /settings/colors/reset (creates initial colors)...');
    const resetResponse = await axios.post(`${baseURL}/settings/colors/reset`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Reset colors successful:');
    console.log(JSON.stringify(resetResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Reset colors failed:');
    if (error.response) {
      console.log(`Status: ${error.config.status}`);
      console.log(`Message: ${error.response.data.message}`);
    } else {
      console.log('Error:', error.message);
    }
  }
  
  try {
    // Test GET colors after reset
    console.log('\n2️⃣ Testing GET /settings/colors (after reset)...');
    const getResponse = await axios.get(`${baseURL}/settings/colors`);
    console.log('✅ GET colors successful:');
    console.log(JSON.stringify(getResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ GET colors failed:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Message: ${error.response?.data?.message}`);
  }
  
  try {
    // Test PUT colors with custom colors
    console.log('\n3️⃣ Testing PUT /settings/colors (custom colors)...');
    const putResponse = await axios.put(`${baseURL}/settings/colors`, {
      colors: {
        primary: '#215d55',
        secondary: '#656362', 
        background: '#ffffff',
        textPrimary: '#1c4643',
        header: '#215d55',
        footer: '#656362'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ PUT colors successful:');
    console.log(JSON.stringify(putResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ PUT colors failed:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Message: ${error.response?.data?.message}`);
  }
}

testWithAuth();
