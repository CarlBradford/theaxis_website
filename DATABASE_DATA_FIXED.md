# ✅ Database Data Fixed - How to View in pgAdmin

## 🎉 **Data Successfully Seeded!**

The database has been seeded with sample data. Here's how to view it in pgAdmin:

## 🌐 **Access pgAdmin**

### **Step 1: Open pgAdmin**
- **URL**: `http://localhost:5050`
- **Login**: `admin@example.com` / `admin123`

### **Step 2: Connect to Database**
1. **Right-click "Servers"** → **"Create"** → **"Server"**
2. **General Tab**: Name = `The AXIS Database`
3. **Connection Tab**:
   - **Host**: `postgres`
   - **Port**: `5432`
   - **Database**: `theaxis_dev`
   - **Username**: `theaxis_user`
   - **Password**: `theaxis_password`
4. **Click "Save"**

## 👥 **View Users Data**

### **Method 1: Visual Interface**
1. **Navigate**: Servers → The AXIS Database → Databases → theaxis_dev → Schemas → public → Tables
2. **Right-click "User" table** → **"View/Edit Data"** → **"All Rows"**

### **Method 2: Query Tool**
1. **Right-click server** → **"Query Tool"**
2. **Run this query**:
```sql
SELECT id, email, username, "firstName", "lastName", role, "isActive", "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
```

## 📊 **Expected Data**

### **Users Created:**
- **Admin**: `admin@theaxis.local` / `admin123` (ADVISER role)
- **Editor-in-Chief**: `eic@theaxis.local` / `eic123` (EDITOR_IN_CHIEF role)
- **Section Head**: `section@theaxis.local` / `section123` (SECTION_HEAD role)
- **Staff Writer**: `staff@theaxis.local` / `staff123` (STAFF role)

### **Other Data Created:**
- **5 Categories**: News, Sports, Opinion, Features, Campus Life
- **4 Tags**: Breaking, Exclusive, Analysis, Interview
- **1 Sample Article**: "Welcome to The AXIS"
- **Sample Comments and Editorial Notes**

## 🔍 **Useful Queries**

### **View All Users:**
```sql
SELECT email, username, role, "isActive", "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
```

### **View Articles:**
```sql
SELECT id, title, status, "publishedAt", "createdAt"
FROM "Article"
ORDER BY "createdAt" DESC;
```

### **View Categories:**
```sql
SELECT id, name, description, "createdAt"
FROM "Category"
ORDER BY name;
```

### **View Tags:**
```sql
SELECT id, name, description, "createdAt"
FROM "Tag"
ORDER BY name;
```

## 🚀 **Alternative: Prisma Studio**

### **Access Prisma Studio:**
```bash
cd backend
npx prisma studio
```
- **URL**: `http://localhost:5555`
- **Features**: Visual database browser, easier to use

## ✅ **Verification**

### **API Test:**
The API is working and returning data:
- **Articles API**: `http://localhost:3001/api/articles` ✅
- **Health Check**: `http://localhost:3001/health` ✅

### **Frontend Test:**
- **URL**: `http://localhost:5173`
- **Login**: `admin@theaxis.local` / `admin123`

## 🎯 **Quick Steps:**

1. **Open pgAdmin**: `http://localhost:5050`
2. **Login**: `admin@example.com` / `admin123`
3. **Add Server**: `postgres:5432` database `theaxis_dev`
4. **View Data**: Navigate to Tables → User → View/Edit Data

---

## 🎉 **Data is Now Available!**

**The database has been successfully seeded with:**
- ✅ **4 Users** with different roles
- ✅ **5 Categories** for articles
- ✅ **4 Tags** for content
- ✅ **1 Sample Article** with content
- ✅ **Sample Comments** and notes

**Follow the steps above to view the data in pgAdmin!** 🚀




