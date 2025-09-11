const axios = require('axios');

async function testCORS() {
  try {
    console.log('🔍 Testing CORS configuration...\n');
    
    console.log('📤 Testing login endpoint with CORS...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      usernameOrEmail: 'admin@theaxis.local',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    });
    
    console.log('✅ CORS test successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ CORS test failed:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('❌ No response received - server might not be running');
      console.log('Make sure to start the backend server: npm start');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Wait a moment for server to restart, then test
setTimeout(() => {
  testCORS();
}, 2000);
