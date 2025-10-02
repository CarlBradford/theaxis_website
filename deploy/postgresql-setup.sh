#!/bin/bash

# PostgreSQL Setup Script for Hostinger VPS
# Run this script on your VPS after initial setup

set -e

echo "🚀 Setting up PostgreSQL for The AXIS website..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo "🗄️ Creating database and user..."
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE theaxis_prod;

-- Create user with password
CREATE USER theaxis_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE theaxis_prod TO theaxis_user;

-- Grant schema privileges
\c theaxis_prod
GRANT ALL ON SCHEMA public TO theaxis_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO theaxis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO theaxis_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO theaxis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO theaxis_user;

\q
EOF

# Configure PostgreSQL for production
echo "⚙️ Configuring PostgreSQL for production..."

# Backup original config
sudo cp /etc/postgresql/*/main/postgresql.conf /etc/postgresql/*/main/postgresql.conf.backup

# Create optimized configuration for 1GB RAM
sudo tee /etc/postgresql/*/main/postgresql.conf > /dev/null << EOF
# Memory settings optimized for 1GB RAM
shared_buffers = 128MB
effective_cache_size = 512MB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 50
listen_addresses = 'localhost'

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
checkpoint_segments = 8

# Query planner
random_page_cost = 1.1
effective_io_concurrency = 200

# Autovacuum
autovacuum = on
autovacuum_max_workers = 2
autovacuum_naptime = 1min
EOF

# Configure PostgreSQL authentication
echo "🔐 Configuring PostgreSQL authentication..."
sudo tee /etc/postgresql/*/main/pg_hba.conf > /dev/null << EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
EOF

# Restart PostgreSQL
sudo systemctl restart postgresql

# Create backup directory
sudo mkdir -p /var/backups/postgresql
sudo chown postgres:postgres /var/backups/postgresql

echo "✅ PostgreSQL setup complete!"
echo "📋 Next steps:"
echo "1. Update your .env file with the database credentials"
echo "2. Run database migrations: npm run db:migrate"
echo "3. Seed the database: npm run db:seed"
echo "4. Test the connection"
