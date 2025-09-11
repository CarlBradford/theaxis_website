const axios = require('axios');

async function testLoginEndpoint() {
  try {
    console.log('🔍 Testing login endpoint...');
    
    const loginData = {
      usernameOrEmail: 'admin@theaxis.local',
      password: 'admin123'
    };
    
    console.log('📤 Sending login request:', loginData);
    
    const response = await axios.post('http://localhost:3001/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Wait a moment for server to start, then test
setTimeout(() => {
  testLoginEndpoint();
}, 3000);
