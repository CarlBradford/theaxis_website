const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('ℹ️  Note: Default categories, tags, users, and sample content are now handled by database migrations.');
  console.log('ℹ️  This seed file is kept for any additional development data you might want to add.');

  try {
    // Add sample data for Content Management Phase models
    
    // Get existing users and articles for sample data
    const users = await prisma.user.findMany();
    const articles = await prisma.article.findMany();
    
    if (users.length > 0 && articles.length > 0) {
      console.log('📝 Adding sample Content Management Phase data...');
      
      // Add sample article authors (multiple authors per article)
      for (let i = 0; i < Math.min(3, articles.length); i++) {
        const article = articles[i];
        const availableUsers = users.filter(u => u.id !== article.authorId);
        
        if (availableUsers.length > 0) {
          // Add a co-author
          await prisma.articleAuthor.create({
            data: {
              articleId: article.id,
              userId: availableUsers[0].id,
              role: 'Co-Author',
              order: 1
            }
          });
        }
      }
      
      // Add sample view history
      for (let i = 0; i < Math.min(5, articles.length); i++) {
        const article = articles[i];
        const randomUsers = users.slice(0, Math.floor(Math.random() * 3) + 1);
        
        for (const user of randomUsers) {
          await prisma.articleViewHistory.create({
            data: {
              articleId: article.id,
              userId: user.id,
              viewedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
              ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
        }
      }
      
      // Add sample like/dislike history
      for (let i = 0; i < Math.min(3, articles.length); i++) {
        const article = articles[i];
        const randomUsers = users.slice(0, Math.floor(Math.random() * 2) + 1);
        
        for (const user of randomUsers) {
          await prisma.articleLikeHistory.create({
            data: {
              articleId: article.id,
              userId: user.id,
              isLike: Math.random() > 0.3, // 70% chance of like
              likedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Random time in last 3 days
              ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
        }
      }
      
      // Add sample review feedback
      const editors = users.filter(u => u.role === 'EDITOR_IN_CHIEF' || u.role === 'SECTION_HEAD');
      if (editors.length > 0) {
        for (let i = 0; i < Math.min(2, articles.length); i++) {
          const article = articles[i];
          const editor = editors[Math.floor(Math.random() * editors.length)];
          
          await prisma.reviewFeedback.create({
            data: {
              articleId: article.id,
              reviewerId: editor.id,
              feedback: 'Great article! Minor grammar fixes needed.',
              feedbackType: 'COMMENT',
              isApproved: null
            }
          });
        }
      }
      
      // Add sample analytics data
      for (let i = 0; i < Math.min(3, articles.length); i++) {
        const article = articles[i];
        
        // Add analytics for the last 7 days
        for (let day = 0; day < 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          date.setHours(0, 0, 0, 0);
          
          await prisma.articleAnalytics.create({
            data: {
              articleId: article.id,
              date: date,
              views: Math.floor(Math.random() * 100) + 10,
              likes: Math.floor(Math.random() * 20) + 1,
              dislikes: Math.floor(Math.random() * 5),
              comments: Math.floor(Math.random() * 10),
              socialShares: Math.floor(Math.random() * 15),
              uniqueVisitors: Math.floor(Math.random() * 50) + 5,
              avgTimeOnPage: Math.random() * 300 + 30, // 30-330 seconds
              bounceRate: Math.random() * 0.4 + 0.1 // 10-50%
            }
          });
        }
      }
      
      console.log('✅ Sample Content Management Phase data added successfully!');
    }
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials (now permanent via migrations):');
    console.log('👤 Admin: admin@theaxis.local / admin123');
    console.log('👑 Editor-in-Chief: eic@theaxis.local / eic123');
    console.log('📰 Section Head: section@theaxis.local / section123');
    console.log('✍️ Publication Staff: staff@theaxis.local / staff123');
    console.log('\n⚠️  IMPORTANT: Change these passwords in production!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });