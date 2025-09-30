const axios = require('axios');

async function testSimple() {
  try {
    console.log('🧪 Testing endpoint directly...');
    const response = await axios.get('http://localhost:3001/api/admin/settings/colors', {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Response Status:', error.response.status);
      console.log('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('❌ No response received - server not running or unreachable');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testSimple();
