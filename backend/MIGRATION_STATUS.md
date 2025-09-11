# Content Management Phase Migration - Step by Step Solution

## Current Status
✅ Prisma schema updated with all Content Management Phase requirements
✅ Migration SQL file created
✅ Seed data updated
❌ Migration not applied due to database connection issues

## Step-by-Step Solution

### Step 1: Start Database
Open Command Prompt or PowerShell and run:
```bash
cd C:\Users\carld\OneDrive\Desktop\theaxis_website
docker-compose up -d postgres
```

### Step 2: Wait for Database
Wait 10-15 seconds for PostgreSQL to start completely.

### Step 3: Apply Schema Changes
```bash
cd backend
npx prisma db push
```

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

### Step 5: Add Sample Data
```bash
npm run db:seed
```

### Step 6: Verify Changes
```bash
npx prisma studio
```

## Alternative: Manual Database Setup

If Docker isn't working, you can:

1. Install PostgreSQL locally
2. Create database `theaxis_dev`
3. Create user `theaxis_user` with password `theaxis_password`
4. Update `.env` file with local connection string
5. Run the migration steps above

## What Was Updated

### Article Model Enhanced:
- Added `dislikeCount` field
- Added `layoutArtistId` field  
- Added `mediaCaption` field
- Added `publicationDate` field
- Added `socialShares` field

### New Models Created:
1. **ArticleAuthor** - Multiple authors per article
2. **ArticleViewHistory** - Detailed view tracking
3. **ArticleLikeHistory** - Like/dislike tracking
4. **ReviewFeedback** - Editorial comments
5. **ArticleMedia** - Additional media files
6. **ArticleAnalytics** - Daily performance metrics

### New Enum:
- **ReviewType** - Types of review feedback

## Verification Commands

After applying the migration, verify it worked:

```bash
# Check if new tables exist
npx prisma studio

# Test database connection
node test-connection.js

# Check migration status
npx prisma migrate status
```

## Next Steps After Migration

1. Update your API routes to use new models
2. Update frontend components to display new fields
3. Implement analytics tracking
4. Add multiple author support
5. Implement review feedback system

## Troubleshooting

If you encounter issues:

1. **Database not starting**: Check Docker Desktop is running
2. **Permission errors**: Run as Administrator
3. **Connection errors**: Check `.env` file has correct DATABASE_URL
4. **Migration errors**: Use `npx prisma db push` instead of `migrate dev`

## Files Created/Updated

- ✅ `backend/prisma/schema.prisma` - Updated with new models
- ✅ `backend/prisma/migrations/20250115000005_content_management_phase_update/migration.sql` - Migration SQL
- ✅ `backend/prisma/seed.js` - Updated with sample data
- ✅ `backend/.env` - Environment configuration
- ✅ `backend/MIGRATION_FIX_GUIDE.md` - Troubleshooting guide
- ✅ `backend/fix-migration.bat` - Windows batch script
- ✅ `backend/test-connection.js` - Connection tester
- ✅ `backend/apply-content-management-update.js` - Direct SQL script
- ✅ `backend/content-management-phase-update.sql` - Raw SQL
