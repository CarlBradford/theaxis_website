# 🗄️ Database Connection Guide - The AXIS

## ✅ **Database Setup Complete!**

Your `theaxis_dev` database is now fully set up with all tables and sample data!

## 📊 **Available Tables**

### **Core Tables:**
- **`User`** - User accounts and authentication
- **`Article`** - News articles and content
- **`Category`** - Article categories
- **`Tag`** - Article tags
- **`Comment`** - Article comments
- **`EditorialNote`** - Internal editorial notes
- **`Media`** - File uploads and media
- **`AuditLog`** - System activity logs

### **Relationship Tables:**
- **`_ArticleToCategory`** - Article-Category relationships
- **`_ArticleToTag`** - Article-Tag relationships

## 🔗 **How to Connect to Your Database**

### **Method 1: pgAdmin (Web Interface)**
1. **Open**: `http://localhost:5050`
2. **Login**: `admin@example.com` / `admin123`
3. **Add Server**:
   - **Name**: `The AXIS Database`
   - **Host**: `postgres` (Docker service name)
   - **Port**: `5432`
   - **Database**: `theaxis_dev`
   - **Username**: `theaxis_user`
   - **Password**: `theaxis_password`

### **Method 2: Command Line (Direct)**
```bash
# Connect to database
docker exec -it theaxis_postgres psql -U theaxis_user -d theaxis_dev

# List all tables
\dt

# View table structure
\d "User"
\d "Article"

# Exit
\q
```

### **Method 3: Prisma Studio (Visual)**
```bash
cd backend
npx prisma studio
```
- **URL**: `http://localhost:5555`
- **Features**: Visual database browser, edit data

## 👥 **Default Users Created**

### **Admin User:**
- **Email**: `admin@theaxis.local`
- **Password**: `admin123`
- **Role**: `ADVISER`

### **Editor-in-Chief:**
- **Email**: `eic@theaxis.local`
- **Password**: `eic123`
- **Role**: `EDITOR_IN_CHIEF`

### **Section Head:**
- **Email**: `section@theaxis.local`
- **Password**: `section123`
- **Role**: `SECTION_HEAD`

### **Staff Writer:**
- **Email**: `staff@theaxis.local`
- **Password**: `staff123`
- **Role**: `STAFF`

## 📰 **Sample Data Created**

### **Categories:**
- News
- Sports
- Opinion
- Features
- Campus Life

### **Tags:**
- Breaking
- Exclusive
- Analysis
- Interview

### **Sample Article:**
- **Title**: "Welcome to The AXIS"
- **Status**: Published
- **Author**: Admin user

## 🛠️ **Database Commands**

### **View Data:**
```sql
-- View all users
SELECT id, email, username, role FROM "User";

-- View all articles
SELECT id, title, status, "createdAt" FROM "Article";

-- View all categories
SELECT id, name, description FROM "Category";

-- View all tags
SELECT id, name, description FROM "Tag";
```

### **Insert Data:**
```sql
-- Create new user
INSERT INTO "User" (id, email, username, "firstName", "lastName", "passwordHash", role)
VALUES ('user123', 'newuser@example.com', 'newuser', 'New', 'User', 'hashedpassword', 'READER');

-- Create new article
INSERT INTO "Article" (id, title, slug, content, "authorId", status)
VALUES ('article123', 'New Article', 'new-article', 'Article content...', 'user123', 'DRAFT');
```

### **Update Data:**
```sql
-- Update user role
UPDATE "User" SET role = 'STAFF' WHERE email = 'newuser@example.com';

-- Update article status
UPDATE "Article" SET status = 'PUBLISHED' WHERE id = 'article123';
```

### **Delete Data:**
```sql
-- Delete user
DELETE FROM "User" WHERE email = 'newuser@example.com';

-- Delete article
DELETE FROM "Article" WHERE id = 'article123';
```

## 🔍 **Useful Queries**

### **Get Articles with Authors:**
```sql
SELECT a.title, a.status, u.username as author
FROM "Article" a
JOIN "User" u ON a."authorId" = u.id;
```

### **Get Articles by Category:**
```sql
SELECT a.title, c.name as category
FROM "Article" a
JOIN "_ArticleToCategory" atc ON a.id = atc."A"
JOIN "Category" c ON atc."B" = c.id;
```

### **Get User Activity:**
```sql
SELECT u.username, COUNT(a.id) as article_count
FROM "User" u
LEFT JOIN "Article" a ON u.id = a."authorId"
GROUP BY u.id, u.username;
```

## 🚀 **API Endpoints**

### **Test Your API:**
```bash
# Get all articles
curl http://localhost:3001/api/articles

# Get all users (requires auth)
curl http://localhost:3001/api/users

# Get all categories
curl http://localhost:3001/api/categories

# Health check
curl http://localhost:3001/health
```

## 🔧 **Database Management**

### **Backup Database:**
```bash
docker exec theaxis_postgres pg_dump -U theaxis_user theaxis_dev > backup.sql
```

### **Restore Database:**
```bash
docker exec -i theaxis_postgres psql -U theaxis_user theaxis_dev < backup.sql
```

### **Reset Database:**
```bash
cd backend
npx prisma migrate reset --force
npm run db:seed
```

## 📱 **Frontend Connection**

### **Login to Frontend:**
- **URL**: `http://localhost:5173`
- **Use any of the default users above**

### **Test Authentication:**
1. Open frontend
2. Login with `admin@theaxis.local` / `admin123`
3. You should see the dashboard with articles

## 🎯 **Next Steps**

### **1. Access Your Database:**
- **pgAdmin**: `http://localhost:5050`
- **Prisma Studio**: `http://localhost:5555`
- **Command Line**: `docker exec -it theaxis_postgres psql -U theaxis_user -d theaxis_dev`

### **2. Explore Your Data:**
- View users, articles, categories, and tags
- Test the API endpoints
- Login to the frontend

### **3. Continue Development:**
- Your database is ready for development
- All tables are created and seeded
- Authentication system is working

---

## 🎉 **You're All Set!**

**Your database is fully configured with:**
- ✅ All tables created
- ✅ Sample data seeded
- ✅ Default users created
- ✅ API endpoints working
- ✅ Frontend authentication ready

**Start developing with confidence!** 🚀
