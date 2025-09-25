const { PrismaClient } = require('@prisma/client');
const notificationService = require('./src/services/notificationService');

const prisma = new PrismaClient();

async function analyzeNotificationMethods() {
  console.log('🔍 Analyzing Notification Methods for Missing In-App Notifications...\n');

  try {
    // Get all users for testing
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, role: true, email: true }
    });
    
    console.log('👥 Available users:');
    users.forEach(user => {
      console.log(`   ${user.role}: ${user.firstName} ${user.lastName} (${user.email})`);
    });

    // Find a test article
    const testArticle = await prisma.article.findFirst({
      select: {
        id: true,
        title: true,
        status: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!testArticle) {
      console.log('❌ No test article found');
      return;
    }

    console.log(`\n📄 Test article: "${testArticle.title}" by ${testArticle.author.firstName} ${testArticle.author.lastName} (${testArticle.author.role})`);

    // Test each notification method
    const methodsToTest = [
      {
        name: 'notifyReviewersArticleUpdated',
        description: 'Notify reviewers when article is updated',
        testData: { articleId: testArticle.id, updaterInfo: { firstName: 'Test', lastName: 'Updater' } }
      },
      {
        name: 'notifyArticleAuthorNewComment',
        description: 'Notify article author of new comment',
        testData: { articleId: testArticle.id, commentId: 'test-comment-id' }
      },
      {
        name: 'notifyCommentAuthorStatusChange',
        description: 'Notify comment author of status change',
        testData: { commentId: 'test-comment-id', status: 'APPROVED', feedback: 'Test feedback' }
      },
      {
        name: 'notifyEICOwnArticlePublished',
        description: 'Notify EIC when their own article is published',
        testData: { articleId: testArticle.id }
      },
      {
        name: 'notifySectionHeadOwnArticlePublished',
        description: 'Notify Section Head when their own article is published',
        testData: { articleId: testArticle.id }
      }
    ];

    console.log('\n🧪 Testing notification methods...\n');

    for (const method of methodsToTest) {
      console.log(`📋 Testing: ${method.name}`);
      console.log(`   Description: ${method.description}`);
      
      try {
        // Count notifications before
        const beforeCount = await prisma.notification.count();
        
        // Call the method
        await notificationService[method.name](...Object.values(method.testData));
        
        // Count notifications after
        const afterCount = await prisma.notification.count();
        
        const notificationsCreated = afterCount - beforeCount;
        
        if (notificationsCreated > 0) {
          console.log(`   ✅ In-app notifications created: ${notificationsCreated}`);
        } else {
          console.log(`   ❌ No in-app notifications created (email only)`);
        }
        
      } catch (error) {
        console.log(`   ⚠️  Method failed: ${error.message}`);
      }
      
      console.log('');
    }

    // Check which methods are missing in-app notifications
    console.log('📊 Summary of Methods Missing In-App Notifications:\n');
    
    const missingInAppMethods = [
      'notifyReviewersArticleUpdated',
      'notifyArticleAuthorNewComment', 
      'notifyCommentAuthorStatusChange',
      'notifyEICOwnArticlePublished',
      'notifySectionHeadOwnArticlePublished'
    ];

    missingInAppMethods.forEach(method => {
      console.log(`❌ ${method} - Email notifications only, no in-app notifications`);
    });

    console.log('\n✅ Methods that already have in-app notifications:');
    const methodsWithInApp = [
      'notifySectionHeadArticleSubmitted',
      'notifyAuthorStatusChange', 
      'notifyEICArticleApproved',
      'notifySectionHeadArticleReturned',
      'notifyStaffArticleReturnedForRevision'
    ];

    methodsWithInApp.forEach(method => {
      console.log(`✅ ${method} - Has both email and in-app notifications`);
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeNotificationMethods();
