const config = require('./src/config');

console.log('=== Backend Configuration ===');
console.log('Max file size (bytes):', config.upload.maxFileSize);
console.log('Max file size (MB):', Math.round(config.upload.maxFileSize / (1024 * 1024)));
console.log('Upload path:', config.upload.path);
console.log('Environment MAX_FILE_SIZE:', process.env.MAX_FILE_SIZE || 'Not set');
console.log('================================');
