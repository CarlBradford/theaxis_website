const { PrismaClient } = require('@prisma/client');

// This should match the server's database connection
const prisma = new PrismaClient();

async function testServerDB() {
  try {
    console.log('🔍 Testing server database connection...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Server database connected\n');
    
    // Test all site settings
    console.log('📋 Checking all site settings:');
    const allSettings = await prisma.siteSetting.findMany({
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        updatedBy: true
      }
    });
    
    if (allSettings.length > 0) {
      allSettings.forEach(setting => {
        console.log(`Key: "${setting.key}"`);
        console.log(`Description: "${setting.description}"`);
        console.log(`Value:`, JSON.stringify(setting.value, null, 2));
        console.log(`Updated: ${setting.updatedAt}`);
        console.log(`Updated by: ${setting.updatedBy}`);
        console.log('---');
      });
    } else {
      console.log('⚠️  No site settings found in the server database');
    }
    
    // Specifically test the color_palette query
    console.log('\n🎨 Testing color_palette query:');
    const colorSetting = await prisma.siteSetting.findUnique({
      where: { key: 'color_palette' }
    });
    
    if (colorSetting) {
      console.log('✅ color_palette found!');
      console.log(`ID: ${colorSetting.id}`);
      console.log(`Key: "${colorSetting.key}"`);
      console.log(`Value:`, JSON.stringify(colorSetting.value, null, 2));
      
      // Test if the API endpoint would work
      console.log('\n🔌 Simulating API endpoint response:');
      const mockResponse = {
        success: true,
        data: colorSetting.value
      };
      console.log(JSON.stringify(mockResponse, null, 2));
      
    } else {
      console.log('❌ color_palette NOT found in server database');
      console.log('   This explains why the API returns 404');
      
      // Let's create it if it doesn't exist
      console.log('\n🔧 Creating color_palette setting...');
      const defaultColors = {
        primary: '#215d55',
        secondary: '#656362',
        background: '#ffffff',
        textPrimary: '#1c4643',
        header: '#215d55',
        footer: '#656362'
      };
      
      try {
        const newSetting = await prisma.siteSetting.create({
          data: {
            key: 'color_palette',
            value: defaultColors,
            description: 'Website color palette settings',
            updatedBy: 'system'
          }
        });
        console.log('✅ color_palette created successfully');
        console.log(`New ID: ${newSetting.id}`);
        console.log(`Value:`, JSON.stringify(newSetting.value, null, 2));
        
      } catch (createError) {
        console.log('❌ Error creating color_palette:', createError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testServerDB();
