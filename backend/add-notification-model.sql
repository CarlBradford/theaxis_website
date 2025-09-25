// Add this to the end of backend/prisma/schema.prisma

model Notification {
  id          String             @id @default(cuid())
  title       String
  message     String
  type        NotificationType   @default(INFO)
  isRead      Boolean            @default(false)
  data        Json?              // Additional data (articleId, etc.)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  
  // Relationships
  userId      String
  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Indexes for Performance
  @@index([userId])
  @@index([isRead])
  @@index([type])
  @@index([createdAt])
}

enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ERROR
  ARTICLE_SUBMITTED
  ARTICLE_APPROVED
  ARTICLE_REJECTED
  ARTICLE_PUBLISHED
  COMMENT_APPROVED
  COMMENT_REJECTED
}
