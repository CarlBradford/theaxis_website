#!/bin/bash

# Database Backup Script for The AXIS website
# Run this script daily via cron job

set -e

# Configuration
DB_NAME="theaxis_prod"
DB_USER="theaxis_user"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/theaxis_backup_$DATE.sql"
RETENTION_DAYS=7

echo "🗄️ Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
echo "📦 Creating backup: $BACKUP_FILE"
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress the backup
echo "🗜️ Compressing backup..."
gzip $BACKUP_FILE

# Remove old backups (older than retention period)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "theaxis_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed: $BACKUP_FILE.gz"

# Optional: Upload to cloud storage (uncomment if needed)
# echo "☁️ Uploading to cloud storage..."
# aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/
