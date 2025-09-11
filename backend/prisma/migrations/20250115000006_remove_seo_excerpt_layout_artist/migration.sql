-- Remove SEO fields, excerpt, and layout artist from Article table
-- This migration removes redundant fields since tags provide categorization

-- Remove SEO fields
ALTER TABLE "Article" DROP COLUMN IF EXISTS "seoTitle";
ALTER TABLE "Article" DROP COLUMN IF EXISTS "seoDescription";
ALTER TABLE "Article" DROP COLUMN IF EXISTS "seoKeywords";

-- Remove excerpt field
ALTER TABLE "Article" DROP COLUMN IF EXISTS "excerpt";

-- Remove layout artist fields
ALTER TABLE "Article" DROP COLUMN IF EXISTS "layoutArtistId";

-- Remove layout artist index
DROP INDEX IF EXISTS "Article_layoutArtistId_idx";

COMMIT;
