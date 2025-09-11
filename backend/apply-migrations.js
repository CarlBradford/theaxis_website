const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigrations() {
  console.log('🚀 Starting database migration and seeding...');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Apply schema changes using db push
    console.log('📝 Applying schema changes...');
    const { execSync } = require('child_process');
    
    try {
      execSync('npx prisma db push', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Schema changes applied successfully');
    } catch (error) {
      console.log('⚠️  Schema push failed, trying alternative approach...');
      // Try to run the migration SQL files directly
      await runMigrationSQL();
    }
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Prisma client generated');
    
    // Run seed script
    console.log('🌱 Running seed script...');
    execSync('npm run db:seed', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Seed script completed');
    
    // Verify data
    await verifyData();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function runMigrationSQL() {
  console.log('📄 Running migration SQL files...');
  
  const migrationFiles = [
    '20250115000001_add_default_categories/migration.sql',
    '20250115000002_add_default_tags/migration.sql',
    '20250115000003_add_default_users/migration.sql',
    '20250115000004_add_sample_content/migration.sql',
    '20250115000005_content_management_phase_update/migration.sql',
    '20250115000006_remove_seo_excerpt_layout_artist/migration.sql',
    '20250115000007_add_essential_article_fields/migration.sql',
    '20250115000008_add_comprehensive_mock_data/migration.sql'
  ];
  
  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, 'prisma', 'migrations', file);
    if (fs.existsSync(filePath)) {
      console.log(`📄 Running ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ ${file} completed`);
    }
  }
}

async function verifyData() {
  console.log('🔍 Verifying data migration...');
  
  try {
    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);
    
    // Check articles
    const articleCount = await prisma.article.count();
    console.log(`📰 Articles in database: ${articleCount}`);
    
    // Check categories
    const categoryCount = await prisma.category.count();
    console.log(`📂 Categories in database: ${categoryCount}`);
    
    // Check tags
    const tagCount = await prisma.tag.count();
    console.log(`🏷️  Tags in database: ${tagCount}`);
    
    // Check article authors
    const articleAuthorCount = await prisma.articleAuthor.count();
    console.log(`✍️  Article authors in database: ${articleAuthorCount}`);
    
    // Check analytics
    const analyticsCount = await prisma.articleAnalytics.count();
    console.log(`📊 Analytics records in database: ${analyticsCount}`);
    
    console.log('\n🎉 Migration and seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👤 Admin: admin@theaxis.local / admin123');
    console.log('👑 Editor-in-Chief: eic@theaxis.local / eic123');
    console.log('📰 Section Head: section@theaxis.local / section123');
    console.log('✍️ Publication Staff: staff@theaxis.local / staff123');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the migration
applyMigrations()
  .catch((error) => {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  });
