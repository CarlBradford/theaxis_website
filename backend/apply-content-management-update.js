const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyContentManagementPhaseUpdate() {
  try {
    console.log('🚀 Starting Content Management Phase database update...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'content-management-phase-update.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error) {
          // Some errors are expected (like duplicate constraints)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message.split('\n')[0]}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Content Management Phase database update completed successfully!');
    console.log('\n📋 Summary of changes:');
    console.log('• Added new columns to Article table (dislikeCount, layoutArtistId, mediaCaption, publicationDate, socialShares)');
    console.log('• Created ArticleAuthor table for multiple authors');
    console.log('• Created ArticleViewHistory table for detailed view tracking');
    console.log('• Created ArticleLikeHistory table for like/dislike tracking');
    console.log('• Created ReviewFeedback table for editorial comments');
    console.log('• Created ArticleMedia table for additional media');
    console.log('• Created ArticleAnalytics table for performance tracking');
    console.log('• Added ReviewType enum');
    console.log('• Created all necessary indexes and foreign key constraints');
    
  } catch (error) {
    console.error('❌ Error during database update:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
applyContentManagementPhaseUpdate()
  .catch((error) => {
    console.error('❌ Database update failed:', error);
    process.exit(1);
  });
