# Database Connection Troubleshooting Guide

## 🔍 Common Issues & Solutions

### 1. Connection Pool Exhaustion
**Symptoms:**
- "Connection pool exhausted" errors
- "Too many connections" errors
- Intermittent connection failures

**Solutions:**
```bash
# Check current connections
node test-db-connection.js monitor

# Restart PostgreSQL service
sudo systemctl restart postgresql

# Check connection limits
psql -c "SHOW max_connections;"
```

### 2. Connection Timeouts
**Symptoms:**
- "Connection timeout" errors
- Slow query responses
- Hanging requests

**Solutions:**
```bash
# Test connection with timeout
node test-db-connection.js test

# Check PostgreSQL timeout settings
psql -c "SHOW statement_timeout;"
psql -c "SHOW idle_in_transaction_session_timeout;"
```

### 3. Database Server Issues
**Symptoms:**
- "Connection refused" errors
- "Server not responding" errors
- Complete connection failures

**Solutions:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostgreSQL is listening
netstat -tlnp | grep 5432

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### 4. Network Issues
**Symptoms:**
- Intermittent connection failures
- "Network unreachable" errors
- Connection drops during operations

**Solutions:**
```bash
# Test network connectivity
ping localhost
telnet localhost 5432

# Check firewall settings
sudo ufw status
```

## 🛠️ Quick Fixes

### Restart Services
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Restart your application
pm2 restart theaxis-backend
# or
npm run dev
```

### Clear Connection Pool
```bash
# Kill all connections (be careful!)
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'theaxis_dev';"
```

### Check Database Health
```bash
# Run comprehensive tests
node test-db-connection.js test

# Monitor connections
node test-db-connection.js monitor
```

## 📊 Monitoring Commands

### Check Active Connections
```sql
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity 
WHERE datname = current_database();
```

### Check Long-Running Queries
```sql
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### Check Database Size
```sql
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
```

## 🔧 Configuration Updates

### 1. Update .env File
Add these settings to your `.env` file:
```env
# Database Connection Settings
DB_CONNECTION_LIMIT=20
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000
DB_IDLE_TIMEOUT=300000
DB_MAX_RETRIES=3
DB_RETRY_DELAY=1000
```

### 2. Update DATABASE_URL
Add connection parameters to your DATABASE_URL:
```env
DATABASE_URL="postgresql://theaxis_user:theaxis_password@localhost:5432/theaxis_dev?schema=public&connection_limit=20&pool_timeout=60&connect_timeout=60"
```

### 3. PostgreSQL Configuration
Use the optimized PostgreSQL configuration:
```bash
# Copy the optimized config
sudo cp postgresql-optimized.conf /etc/postgresql/*/main/postgresql.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 🚨 Emergency Procedures

### If Database is Completely Down
1. **Check PostgreSQL status:**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Start PostgreSQL:**
   ```bash
   sudo systemctl start postgresql
   ```

3. **Check logs:**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

### If Connection Pool is Exhausted
1. **Kill idle connections:**
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle' AND datname = 'theaxis_dev';
   ```

2. **Restart application:**
   ```bash
   pm2 restart theaxis-backend
   ```

### If Queries are Hanging
1. **Find hanging queries:**
   ```sql
   SELECT pid, now() - query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%';
   ```

2. **Kill hanging queries:**
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%';
   ```

## 📈 Performance Optimization

### 1. Connection Pooling
- Use connection pooling (PgBouncer recommended)
- Set appropriate pool sizes
- Monitor pool usage

### 2. Query Optimization
- Use indexes effectively
- Avoid N+1 queries
- Use connection pooling

### 3. Monitoring
- Set up database monitoring
- Monitor connection counts
- Track query performance

## 🔍 Debugging Steps

1. **Test basic connectivity:**
   ```bash
   node test-db-connection.js test
   ```

2. **Monitor connections:**
   ```bash
   node test-db-connection.js monitor
   ```

3. **Check application logs:**
   ```bash
   tail -f logs/app.log
   ```

4. **Check PostgreSQL logs:**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

5. **Test with different connection settings:**
   - Reduce connection limit
   - Increase timeout values
   - Enable connection pooling
