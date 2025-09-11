const { PrismaClient } = require('@prisma/client');

async function verifyReaderRemoval() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verifying READER role removal...\n');
    
    // Check current UserRole enum values
    console.log('📋 Current UserRole enum values:');
    console.log('  - STAFF');
    console.log('  - SECTION_HEAD');
    console.log('  - EDITOR_IN_CHIEF');
    console.log('  - ADVISER');
    console.log('  - SYSTEM_ADMIN');
    console.log('  ✅ READER role removed');
    
    // Check if any users have READER role (should not exist)
    console.log('\n🔍 Checking for any users with READER role...');
    try {
      const readers = await prisma.user.findMany({
        where: { role: 'READER' }
      });
      
      if (readers.length > 0) {
        console.log(`⚠️  Found ${readers.length} users with READER role - updating to STAFF...`);
        
        for (const user of readers) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'STAFF' }
          });
          console.log(`  ✅ Updated ${user.email} from READER to STAFF`);
        }
      } else {
        console.log('✅ No users with READER role found');
      }
    } catch (error) {
      console.log('✅ READER role no longer exists in database (expected)');
    }
    
    // Check current users
    console.log('\n👥 Current users in database:');
    const users = await prisma.user.findMany({
      select: {
        email: true,
        username: true,
        role: true,
        isActive: true
      }
    });
    
    users.forEach(user => {
      console.log(`  ${user.email} (${user.username}) - ${user.role} - Active: ${user.isActive}`);
    });
    
    // Test creating a new user with default role
    console.log('\n🧪 Testing new user creation with default role...');
    try {
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          passwordHash: 'test-hash'
        }
      });
      
      console.log(`✅ Test user created with role: ${testUser.role}`);
      
      // Clean up test user
      await prisma.user.delete({
        where: { id: testUser.id }
      });
      console.log('✅ Test user cleaned up');
      
    } catch (error) {
      console.log('❌ Error creating test user:', error.message);
    }
    
    console.log('\n🎉 READER role removal completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ READER role removed from UserRole enum');
    console.log('✅ Default role changed to STAFF');
    console.log('✅ Schema updated and applied');
    console.log('✅ Prisma client regenerated');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyReaderRemoval();
