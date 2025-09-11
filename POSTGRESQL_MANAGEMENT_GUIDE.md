# 🗄️ PostgreSQL Database Management Guide

## ✅ Current Database Status
- **Database**: `theaxis_dev` on `localhost:5432`
- **Models**: 8 tables successfully created
- **Data**: Initial seed data loaded
- **Connection**: ✅ Working perfectly

## 🔗 Connection Methods

### 1. **Prisma Studio (GUI) - RECOMMENDED**
```bash
cd backend
npx prisma studio
```
- **URL**: `http://localhost:5555`
- **Features**: Visual database browser, edit data, run queries
- **Best for**: Non-technical users, data exploration

### 2. **pgAdmin (PostgreSQL GUI)**
- **URL**: `http://localhost:5050` (if using Docker)
- **Features**: Full PostgreSQL management
- **Best for**: Advanced database administration

### 3. **Command Line (psql)**
```bash
psql -h localhost -p 5432 -U postgres -d theaxis_dev
```
- **Best for**: Advanced users, scripting

## 📊 Current Database Schema

### **Tables Created:**
1. **User** - User accounts and profiles
2. **Article** - News articles and content
3. **Comment** - Article comments
4. **Category** - Article categories
5. **Tag** - Article tags
6. **Media** - File uploads and media
7. **EditorialNote** - Editorial comments
8. **AuditLog** - System activity logs

## 👥 Default Users Created

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **ADVISER** | `admin@theaxis.local` | `admin123` | Full system access |
| **EDITOR_IN_CHIEF** | `eic@theaxis.local` | `eic123` | Manage articles, users |
| **SECTION_HEAD** | `section@theaxis.local` | `section123` | Manage section content |
| **STAFF** | `staff@theaxis.local` | `staff123` | Create/edit articles |

## 📂 Sample Data Created

### **Categories:**
- News
- Opinion
- Sports
- Technology
- Lifestyle

### **Tags:**
- Breaking News
- Editorial
- Student Life
- Campus Events

### **Sample Article:**
- Title: "Welcome to The AXIS"
- Content: Sample article content
- Status: Published

## 🛠️ Database Management Commands

### **View Data:**
```bash
# Open Prisma Studio
npx prisma studio

# Check database status
npx prisma db pull
```

### **Add More Data:**
```bash
# Re-seed database (adds more sample data)
npm run db:seed

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### **Backup Database:**
```bash
# Create backup
pg_dump -h localhost -p 5432 -U postgres theaxis_dev > backup.sql

# Restore backup
psql -h localhost -p 5432 -U postgres theaxis_dev < backup.sql
```

## 🔧 Adding Custom Data

### **Method 1: Using Prisma Studio**
1. Open `http://localhost:5555`
2. Click on any table (e.g., "User")
3. Click "Add record"
4. Fill in the data
5. Click "Save"

### **Method 2: Using API Endpoints**
```bash
# Create new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "username": "newuser",
    "firstName": "New",
    "lastName": "User",
    "role": "STAFF"
  }'

# Create new article
curl -X POST http://localhost:3001/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "My New Article",
    "content": "Article content here...",
    "categoryId": "CATEGORY_ID",
    "tags": ["TAG_ID_1", "TAG_ID_2"]
  }'
```

### **Method 3: Direct SQL (Advanced)**
```sql
-- Connect to database
psql -h localhost -p 5432 -U postgres -d theaxis_dev

-- Insert new user
INSERT INTO "User" (id, email, username, "firstName", "lastName", "passwordHash", role, "isActive", "emailVerified", "createdAt", "updatedAt")
VALUES ('new-id', 'user@example.com', 'username', 'First', 'Last', 'hashed_password', 'READER', true, false, NOW(), NOW());

-- Insert new article
INSERT INTO "Article" (id, title, content, slug, status, "authorId", "categoryId", "createdAt", "updatedAt")
VALUES ('article-id', 'Article Title', 'Content...', 'article-slug', 'DRAFT', 'user-id', 'category-id', NOW(), NOW());
```

## 📈 Database Monitoring

### **Check Database Size:**
```sql
SELECT pg_size_pretty(pg_database_size('theaxis_dev'));
```

### **View Table Sizes:**
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **Check Active Connections:**
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'theaxis_dev';
```

## 🚀 Next Steps

1. **Open Prisma Studio**: `npx prisma studio`
2. **Explore the data**: Browse through tables
3. **Add test data**: Create new users, articles, comments
4. **Test the frontend**: Login with default credentials
5. **Monitor performance**: Check database metrics

## 🔒 Security Notes

- **Change default passwords** in production
- **Use environment variables** for database credentials
- **Enable SSL** for production connections
- **Regular backups** are essential
- **Monitor access logs**

## 📞 Troubleshooting

### **Connection Issues:**
```bash
# Check if PostgreSQL is running
netstat -an | findstr :5432

# Test connection
npx prisma db pull
```

### **Permission Issues:**
```bash
# Reset database permissions
npx prisma migrate reset
npm run db:seed
```

### **Data Corruption:**
```bash
# Restore from backup
psql -h localhost -p 5432 -U postgres theaxis_dev < backup.sql
```

---

**🎉 Your PostgreSQL database is ready! Start exploring with Prisma Studio at `http://localhost:5555`**
