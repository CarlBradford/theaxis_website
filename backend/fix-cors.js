const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing CORS configuration...\n');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found existing .env file');
} else {
  console.log('❌ .env file not found');
  process.exit(1);
}

// Fix CORS_ORIGIN to match frontend port
const fixedEnvContent = envContent.replace(
  /CORS_ORIGIN="http:\/\/localhost:5175"/,
  'CORS_ORIGIN="http://localhost:5173"'
);

if (fixedEnvContent !== envContent) {
  fs.writeFileSync(envPath, fixedEnvContent);
  console.log('✅ Fixed CORS_ORIGIN to http://localhost:5173');
} else {
  console.log('⚠️  CORS_ORIGIN already correct or not found');
}

console.log('\n📋 Updated .env configuration:');
console.log('CORS_ORIGIN="http://localhost:5173"');
console.log('PORT=3001');
console.log('NODE_ENV="development"');

console.log('\n🔄 Please restart your backend server for changes to take effect:');
console.log('1. Stop the current backend server (Ctrl+C)');
console.log('2. Run: npm start');
console.log('\n🌐 Your frontend should now be able to connect to the backend!');
