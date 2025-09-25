const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    console.log('🔍 Checking Recent Notifications...\n');
    
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    console.log(`Found ${notifications.length} notifications:`);
    
    if (notifications.length === 0) {
      console.log('❌ No notifications found in database');
      console.log('This means notifications are not being created when articles are submitted.');
    } else {
      notifications.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.title}`);
        console.log(`   Message: ${notification.message}`);
        console.log(`   Type: ${notification.type}`);
        console.log(`   User: ${notification.user.firstName} ${notification.user.lastName} (${notification.user.role})`);
        console.log(`   Status: ${notification.isRead ? 'READ' : 'UNREAD'}`);
        console.log(`   Created: ${notification.createdAt}`);
        console.log('');
      });
    }

    // Check section heads
    console.log('👥 Checking Section Heads...');
    const sectionHeads = await prisma.user.findMany({
      where: { role: 'SECTION_HEAD' },
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    
    console.log(`Found ${sectionHeads.length} section heads:`);
    sectionHeads.forEach(sh => {
      console.log(`- ${sh.firstName} ${sh.lastName} (${sh.email})`);
    });

    // Check recent articles
    console.log('\n📰 Checking Recent Articles...');
    const recentArticles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    console.log(`Found ${recentArticles.length} recent articles:`);
    recentArticles.forEach(article => {
      console.log(`- "${article.title}" by ${article.author.firstName} ${article.author.lastName} (${article.author.role})`);
      console.log(`  Status: ${article.status}, Created: ${article.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error checking notifications:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();
