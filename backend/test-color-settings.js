const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testColorSettings() {
  try {
    console.log('🔍 Testing color settings...');
    
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'color_palette' }
    });
    
    if (setting) {
      console.log('✅ Color settings found:');
      console.log(JSON.stringify(setting.value, null, 2));
    } else {
      console.log('❌ Color settings not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testColorSettings();
