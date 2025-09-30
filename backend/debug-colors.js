const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugColors() {
  try {
    console.log('🔍 Debugging color settings...\n');
    
    // Check all site settings
    const allSettings = await prisma.siteSetting.findMany();
    console.log('📋 All site settings:');
    allSettings.forEach(setting => {
      console.log(`Key: "${setting.key}" | Value:`, setting.value);
    });
    
    // Specifically check for color_palette
    const colorSetting = await prisma.siteSetting.findUnique({
      where: { key: 'color_palette' }
    });
    
    if (colorSetting) {
      console.log('\n✅ Found color_palette setting:');
      console.log(`ID: ${colorSetting.id}`);
      console.log(`Key: "${colorSetting.key}"`);
      console.log(`Description: ${colorSetting.description}`);
      console.log(`Value:`, JSON.stringify(colorSetting.value, null, 2));
      console.log(`Updated by: ${colorSetting.updatedBy}`);
      console.log(`Updated at: ${colorSetting.updatedAt}`);
    } else {
      console.log('\n❌ No color_palette setting found');
      
      // Check if there are any similar keys
      const similarSettings = allSettings.filter(s => 
        s.key.toLowerCase().includes('color') || 
        s.key.toLowerCase().includes('palette')
      );
      
      if (similarSettings.length > 0) {
        console.log('\n🔍 Found similar settings:');
        similarSettings.forEach(setting => {
          console.log(`Key: "${setting.key}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugColors();
