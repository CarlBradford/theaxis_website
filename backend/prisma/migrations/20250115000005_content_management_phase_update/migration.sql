-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "dislikeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "layoutArtistId" TEXT,
ADD COLUMN     "mediaCaption" TEXT,
ADD COLUMN     "publicationDate" TIMESTAMP(3),
ADD COLUMN     "socialShares" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ArticleAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "socialShares" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "avgTimeOnPage" DOUBLE PRECISION,
    "bounceRate" DOUBLE PRECISION,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "ArticleAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleAuthor" (
    "id" TEXT NOT NULL,
    "role" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ArticleAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleLikeHistory" (
    "id" TEXT NOT NULL,
    "isLike" BOOLEAN NOT NULL,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "ArticleLikeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleMedia" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "ArticleMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleViewHistory" (
    "id" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "ArticleViewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewFeedback" (
    "id" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "feedbackType" "ReviewType" NOT NULL DEFAULT 'COMMENT',
    "isApproved" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "articleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,

    CONSTRAINT "ReviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('COMMENT', 'APPROVAL', 'REJECTION', 'REVISION_REQUEST', 'PUBLICATION_READY');

-- CreateIndex
CREATE INDEX "Article_layoutArtistId_idx" ON "Article"("layoutArtistId");

-- CreateIndex
CREATE INDEX "Article_publicationDate_idx" ON "Article"("publicationDate");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleAnalytics_articleId_date_key" ON "ArticleAnalytics"("articleId", "date");

-- CreateIndex
CREATE INDEX "ArticleAnalytics_articleId_idx" ON "ArticleAnalytics"("articleId");

-- CreateIndex
CREATE INDEX "ArticleAnalytics_date_idx" ON "ArticleAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleAuthor_articleId_userId_key" ON "ArticleAuthor"("articleId", "userId");

-- CreateIndex
CREATE INDEX "ArticleAuthor_articleId_idx" ON "ArticleAuthor"("articleId");

-- CreateIndex
CREATE INDEX "ArticleAuthor_userId_idx" ON "ArticleAuthor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleLikeHistory_articleId_userId_key" ON "ArticleLikeHistory"("articleId", "userId");

-- CreateIndex
CREATE INDEX "ArticleLikeHistory_articleId_idx" ON "ArticleLikeHistory"("articleId");

-- CreateIndex
CREATE INDEX "ArticleLikeHistory_userId_idx" ON "ArticleLikeHistory"("userId");

-- CreateIndex
CREATE INDEX "ArticleLikeHistory_likedAt_idx" ON "ArticleLikeHistory"("likedAt");

-- CreateIndex
CREATE INDEX "ArticleMedia_articleId_idx" ON "ArticleMedia"("articleId");

-- CreateIndex
CREATE INDEX "ArticleMedia_mediaId_idx" ON "ArticleMedia"("mediaId");

-- CreateIndex
CREATE INDEX "ArticleViewHistory_articleId_idx" ON "ArticleViewHistory"("articleId");

-- CreateIndex
CREATE INDEX "ArticleViewHistory_userId_idx" ON "ArticleViewHistory"("userId");

-- CreateIndex
CREATE INDEX "ArticleViewHistory_viewedAt_idx" ON "ArticleViewHistory"("viewedAt");

-- CreateIndex
CREATE INDEX "ReviewFeedback_articleId_idx" ON "ReviewFeedback"("articleId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_reviewerId_idx" ON "ReviewFeedback"("reviewerId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_createdAt_idx" ON "ReviewFeedback"("createdAt");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_layoutArtistId_fkey" FOREIGN KEY ("layoutArtistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleAnalytics" ADD CONSTRAINT "ArticleAnalytics_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleAuthor" ADD CONSTRAINT "ArticleAuthor_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleAuthor" ADD CONSTRAINT "ArticleAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLikeHistory" ADD CONSTRAINT "ArticleLikeHistory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLikeHistory" ADD CONSTRAINT "ArticleLikeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleMedia" ADD CONSTRAINT "ArticleMedia_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleMedia" ADD CONSTRAINT "ArticleMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleViewHistory" ADD CONSTRAINT "ArticleViewHistory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleViewHistory" ADD CONSTRAINT "ArticleViewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
