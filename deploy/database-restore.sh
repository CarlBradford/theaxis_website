#!/bin/bash

# Database Restore Script for The AXIS website
# Usage: ./database-restore.sh <backup_file>

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide backup file path"
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /var/backups/postgresql/theaxis_backup_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="theaxis_prod"
DB_USER="theaxis_user"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Starting database restore..."
echo "📁 Backup file: $BACKUP_FILE"

# Create backup of current database before restore
echo "💾 Creating backup of current database..."
CURRENT_BACKUP="/var/backups/postgresql/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME > $CURRENT_BACKUP
gzip $CURRENT_BACKUP
echo "✅ Current database backed up to: $CURRENT_BACKUP.gz"

# Drop and recreate database
echo "🗑️ Dropping existing database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Restore from backup
echo "📥 Restoring database from backup..."
if [[ $BACKUP_FILE == *.gz ]]; then
    # Compressed backup
    gunzip -c $BACKUP_FILE | PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME
else
    # Uncompressed backup
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME < $BACKUP_FILE
fi

echo "✅ Database restore completed successfully!"

# Verify restore
echo "🔍 Verifying restore..."
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "📊 Tables restored: $TABLE_COUNT"
