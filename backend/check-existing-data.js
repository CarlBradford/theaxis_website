const { PrismaClient } = require('@prisma/client');

async function checkExistingData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking existing data after schema fixes...\n');
    
    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { email: true, username: true, role: true, isActive: true }
      });
      console.log('📋 Available users:');
      users.forEach(user => {
        console.log(`  ${user.email} (${user.username}) - ${user.role} - Active: ${user.isActive}`);
      });
    }
    
    // Check articles
    const articleCount = await prisma.article.count();
    console.log(`\n📰 Articles: ${articleCount}`);
    
    if (articleCount > 0) {
      const articles = await prisma.article.findMany({
        select: { id: true, title: true, status: true, authorId: true }
      });
      console.log('📋 Available articles:');
      articles.forEach(article => {
        console.log(`  ${article.id} - ${article.title} (${article.status})`);
      });
    }
    
    // Check categories
    const categoryCount = await prisma.category.count();
    console.log(`\n📂 Categories: ${categoryCount}`);
    
    // Check tags
    const tagCount = await prisma.tag.count();
    console.log(`🏷️  Tags: ${tagCount}`);
    
    console.log('\n✅ Data verification complete!');
    
    if (userCount > 0 && articleCount > 0) {
      console.log('\n🎉 All data is still there - no need to reseed!');
      console.log('\n🔑 You can login with:');
      console.log('  admin@theaxis.local / admin123');
      console.log('  eic@theaxis.local / eic123');
      console.log('  section@theaxis.local / section123');
      console.log('  staff@theaxis.local / staff123');
    } else {
      console.log('\n⚠️  Some data is missing - you may need to reseed');
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingData();
