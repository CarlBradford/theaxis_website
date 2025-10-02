#!/bin/bash

# Cron Job Setup Script for The AXIS website
# Sets up automated database backups

set -e

echo "⏰ Setting up cron jobs for database backups..."

# Create backup script directory
sudo mkdir -p /opt/theaxis/scripts
sudo cp database-backup.sh /opt/theaxis/scripts/
sudo chmod +x /opt/theaxis/scripts/database-backup.sh

# Set up environment variables for cron
echo "🔧 Setting up environment variables..."
sudo tee /opt/theaxis/scripts/backup-env.sh > /dev/null << EOF
#!/bin/bash
export DB_PASSWORD="your_secure_password_here"
export PATH="/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin"
EOF

sudo chmod +x /opt/theaxis/scripts/backup-env.sh

# Add cron job for daily backups at 2 AM
echo "📅 Adding daily backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/theaxis/scripts/backup-env.sh && /opt/theaxis/scripts/database-backup.sh >> /var/log/theaxis-backup.log 2>&1") | crontab -

# Add cron job for weekly full system backup
echo "📅 Adding weekly system backup cron job..."
(crontab -l 2>/dev/null; echo "0 3 * * 0 /opt/theaxis/scripts/backup-env.sh && /opt/theaxis/scripts/database-backup.sh >> /var/log/theaxis-backup.log 2>&1") | crontab -

# Create log file
sudo touch /var/log/theaxis-backup.log
sudo chown $USER:$USER /var/log/theaxis-backup.log

echo "✅ Cron jobs set up successfully!"
echo "📋 Backup schedule:"
echo "  - Daily database backup: 2:00 AM"
echo "  - Weekly system backup: Sunday 3:00 AM"
echo "  - Logs: /var/log/theaxis-backup.log"

# Show current crontab
echo "📅 Current crontab:"
crontab -l
