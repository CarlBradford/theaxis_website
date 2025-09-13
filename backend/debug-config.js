// Test script to check configuration
console.log('Testing configuration...');

try {
  const config = require('./src/config');
  console.log('✅ Config loaded successfully');
  console.log('Max file size (bytes):', config.upload.maxFileSize);
  console.log('Max file size (MB):', config.upload.maxFileSize / (1024 * 1024));
  console.log('Environment MAX_FILE_SIZE:', process.env.MAX_FILE_SIZE || 'Not set');
} catch (error) {
  console.error('❌ Error loading config:', error.message);
}
