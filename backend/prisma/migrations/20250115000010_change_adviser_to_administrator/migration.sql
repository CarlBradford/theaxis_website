-- Step 1: Add ADMINISTRATOR to the existing enum first
ALTER TYPE "UserRole" ADD VALUE 'ADMINISTRATOR';

-- Step 2: Update existing users with ADVISER role to ADMINISTRATOR
UPDATE "User" SET role = 'ADMINISTRATOR' WHERE role = 'ADVISER';

-- Step 3: Create a new enum without ADVISER
CREATE TYPE "UserRole_new" AS ENUM ('STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN');

-- Step 4: Update the column to use the new enum
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING "role"::text::"UserRole_new";

-- Step 5: Drop the old enum and rename the new one
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";