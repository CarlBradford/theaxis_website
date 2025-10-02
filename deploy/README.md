# The AXIS Website - PostgreSQL Deployment Guide

This guide covers PostgreSQL setup and deployment for The AXIS website on Hostinger VPS.

## 📋 Prerequisites

- Hostinger VPS with Ubuntu 20.04/22.04
- Root or sudo access
- Domain name configured

## 🚀 Quick Setup

### 1. Initial VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install curl wget git -y
```

### 2. PostgreSQL Installation

```bash
# Make scripts executable
chmod +x deploy/*.sh

# Run PostgreSQL setup
./deploy/postgresql-setup.sh
```

### 3. Database Configuration

```bash
# Copy production environment template
cp deploy/env.production.example backend/.env

# Edit the .env file with your actual values
nano backend/.env
```

**Important:** Update these values in your `.env` file:
- `DATABASE_URL` - Use the credentials from the setup script
- `JWT_SECRET` - Generate a secure random string
- `CORS_ORIGIN` - Your domain name
- `FRONTEND_URL` - Your domain name

### 4. Database Migration

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

### 5. Backup Setup

```bash
# Set up automated backups
./deploy/crontab-setup.sh
```

## 🔧 Configuration Details

### PostgreSQL Optimization for 1GB RAM

The setup script configures PostgreSQL with these optimized settings:

```conf
shared_buffers = 128MB
effective_cache_size = 512MB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 50
```

### Security Configuration

- PostgreSQL only listens on localhost
- MD5 authentication required
- User has limited privileges
- Regular security updates

## 📊 Monitoring

### Check PostgreSQL Status

```bash
# Check service status
sudo systemctl status postgresql

# Check database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('theaxis_prod'));"
```

### View Logs

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Backup logs
tail -f /var/log/theaxis-backup.log
```

## 🔄 Backup and Restore

### Manual Backup

```bash
# Create manual backup
./deploy/database-backup.sh
```

### Restore from Backup

```bash
# Restore from specific backup
./deploy/database-restore.sh /var/backups/postgresql/theaxis_backup_20240101_120000.sql.gz
```

### Backup Schedule

- **Daily backups**: 2:00 AM
- **Weekly backups**: Sunday 3:00 AM
- **Retention**: 7 days
- **Location**: `/var/backups/postgresql/`

## 🚨 Troubleshooting

### Common Issues

1. **Connection refused**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # Restart if needed
   sudo systemctl restart postgresql
   ```

2. **Permission denied**
   ```bash
   # Check file permissions
   ls -la /var/backups/postgresql/
   
   # Fix permissions
   sudo chown -R postgres:postgres /var/backups/postgresql/
   ```

3. **Out of memory**
   ```bash
   # Check memory usage
   free -h
   
   # Check PostgreSQL memory settings
   sudo -u postgres psql -c "SHOW shared_buffers;"
   ```

### Performance Tuning

For better performance on 1GB RAM:

1. **Reduce max_connections** if needed
2. **Increase shared_buffers** if memory allows
3. **Enable query caching** in application
4. **Use connection pooling**

## 📈 Scaling

When you need more resources:

1. **Upgrade to VPS 2** (2GB RAM) - $7.99/month
2. **Increase PostgreSQL memory settings**
3. **Add Redis for caching**
4. **Implement read replicas**

## 🔐 Security Best Practices

1. **Regular updates**: `sudo apt update && sudo apt upgrade`
2. **Firewall**: Configure UFW to block unnecessary ports
3. **SSL**: Use Let's Encrypt for HTTPS
4. **Backups**: Test restore procedures regularly
5. **Monitoring**: Set up log monitoring

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Verify configuration files
3. Test database connectivity
4. Check system resources

## 📝 Notes

- Replace `your_secure_password_here` with actual passwords
- Update domain names in configuration files
- Test backups regularly
- Monitor disk space usage
- Keep PostgreSQL updated
