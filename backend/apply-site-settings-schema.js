const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applySiteSettingsSchema() {
  console.log('🔧 Applying site settings and assets schema...');
  
  try {
    // Create SiteSetting table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SiteSetting" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" JSONB NOT NULL,
        "description" TEXT,
        "updatedBy" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create indexes for SiteSetting
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SiteSetting_key_idx" ON "SiteSetting"("key");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SiteSetting_updatedAt_idx" ON "SiteSetting"("updatedAt");`;
    
    // Create SiteAsset table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SiteAsset" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "assetType" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "originalName" TEXT NOT NULL,
        "filePath" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "mimeType" TEXT NOT NULL,
        "uploadedBy" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create indexes for SiteAsset
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SiteAsset_assetType_idx" ON "SiteAsset"("assetType");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SiteAsset_isActive_idx" ON "SiteAsset"("isActive");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SiteAsset_createdAt_idx" ON "SiteAsset"("createdAt");`;
    
    // Insert default color settings
    const defaultColors = {
      primary: '#215d55',
      secondary: '#656362',
      background: '#ffffff',
      textPrimary: '#1c4643',
      header: '#215d55',
      footer: '#656362'
    };
    
    await prisma.siteSetting.upsert({
      where: { key: 'color_palette' },
      update: { value: defaultColors },
      create: {
        key: 'color_palette',
        value: defaultColors,
        description: 'Website color palette settings',
        updatedBy: 'system'
      }
    });
    
    console.log('✅ Site settings and assets schema applied successfully!');
    console.log('📊 Default color palette created');
    
  } catch (error) {
    console.error('❌ Error applying site settings schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
applySiteSettingsSchema()
  .then(() => {
    console.log('🎉 Schema application completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema application failed:', error);
    process.exit(1);
  });
