const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing login issues...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
} else {
  console.log('❌ .env file missing - this is likely the main issue!');
  console.log('📝 Creating .env file...');
  
  const envContent = `# Database Configuration
DATABASE_URL="postgresql://theaxis_user:theaxis_password@localhost:5432/theaxis_dev?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server Configuration
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5175"

# Security
BCRYPT_ROUNDS=12
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH="./uploads"
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,image/webp"

# Email Configuration (for future use)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@theaxis.local"

# Google Analytics (for future use)
GA4_MEASUREMENT_ID="G-XXXXXXXXXX"
GA4_PRIVATE_KEY="your-ga4-private-key"

# Redis Configuration (for future use)
REDIS_URL="redis://localhost:6379"

# Logging
LOG_LEVEL="info"
LOG_FILE_PATH="./logs/app.log"

# API Documentation
API_DOCS_ENABLED=true
API_DOCS_PATH="/api/docs"

# Frontend URL (for email links)
FRONTEND_URL="http://localhost:5173"`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully');
  } catch (error) {
    console.log('❌ Failed to create .env file:', error.message);
  }
}

// Check if package.json exists
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json exists');
} else {
  console.log('❌ package.json missing');
}

// Check if prisma schema exists
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  console.log('✅ Prisma schema exists');
} else {
  console.log('❌ Prisma schema missing');
}

console.log('\n📋 Next steps to fix login:');
console.log('1. Run: npx prisma db push');
console.log('2. Run: npx prisma generate');
console.log('3. Run: npm run db:seed');
console.log('4. Run: npm start');
console.log('\n🔑 Test credentials:');
console.log('Admin: admin@theaxis.local / admin123');
console.log('Editor: eic@theaxis.local / eic123');
console.log('Section Head: section@theaxis.local / section123');
console.log('Staff: staff@theaxis.local / staff123');
