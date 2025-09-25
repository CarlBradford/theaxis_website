const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSectionHeadEmails() {
  try {
    const sectionHeads = await prisma.user.findMany({
      where: { role: 'SECTION_HEAD' },
      select: { 
        email: true, 
        firstName: true, 
        lastName: true,
        username: true 
      }
    });

    console.log('📧 Section Head Email Addresses:');
    console.log('================================');
    
    if (sectionHeads.length === 0) {
      console.log('❌ No section heads found in the system');
    } else {
      sectionHeads.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
        console.log(`   Email: ${user.email}`);
        console.log('');
      });
      
      console.log(`✅ Total section heads: ${sectionHeads.length}`);
      console.log('');
      console.log('📬 When an article is submitted, notifications will be sent to ALL of these emails');
    }
    
  } catch (error) {
    console.error('❌ Error checking section head emails:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSectionHeadEmails();
