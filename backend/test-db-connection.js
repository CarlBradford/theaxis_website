#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { logger } = require('./src/utils/logger');

// Database connection test
async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic connection successful');

    // Test user table access
    console.log('👥 Testing user table access...');
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible - ${userCount} users found`);

    // Test article table access
    console.log('📰 Testing article table access...');
    const articleCount = await prisma.article.count();
    console.log(`✅ Article table accessible - ${articleCount} articles found`);

    // Test connection pool
    console.log('🏊 Testing connection pool...');
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(prisma.$queryRaw`SELECT ${i} as test`);
    }
    await Promise.all(promises);
    console.log('✅ Connection pool working correctly');

    // Test long-running query
    console.log('⏱️ Testing long-running query...');
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT pg_sleep(2)`;
    const duration = Date.now() - startTime;
    console.log(`✅ Long-running query completed in ${duration}ms`);

    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    // Provide specific error guidance
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Solution: Make sure PostgreSQL is running on localhost:5432');
    } else if (error.code === 'P1001') {
      console.log('💡 Solution: Check if the database server is running and accessible');
    } else if (error.code === 'P1002') {
      console.log('💡 Solution: Check your DATABASE_URL in .env file');
    } else if (error.code === 'P1003') {
      console.log('💡 Solution: Database does not exist - run migrations first');
    } else if (error.code === 'P1017') {
      console.log('💡 Solution: Database connection closed - check connection pool settings');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Connection monitoring
async function monitorConnections() {
  console.log('📊 Monitoring database connections...');
  
  const prisma = new PrismaClient();
  
  try {
    // Get connection info
    const connectionInfo = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    console.log('📈 Connection Statistics:', connectionInfo[0]);
    
    // Get database size
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
    `;
    
    console.log('💾 Database Size:', dbSize[0].database_size);
    
  } catch (error) {
    console.error('❌ Connection monitoring failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await testDatabaseConnection();
      break;
    case 'monitor':
      await monitorConnections();
      break;
    case 'help':
      console.log(`
🔧 Database Connection Troubleshooting Tool

Usage:
  node test-db-connection.js test     - Test database connection
  node test-db-connection.js monitor - Monitor connection statistics
  node test-db-connection.js help   - Show this help

Common Issues:
  - ECONNREFUSED: PostgreSQL not running
  - P1001: Database server not accessible
  - P1002: Invalid DATABASE_URL
  - P1003: Database doesn't exist
  - P1017: Connection pool exhausted
      `);
      break;
    default:
      console.log('❌ Unknown command. Use "help" for usage information.');
      process.exit(1);
  }
}

main().catch(console.error);