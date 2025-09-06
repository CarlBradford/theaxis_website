# 🔐 Role-Based Access Management Guide

## Current User Roles

### 1. **ADVISER** (Highest Authority)
- **Permissions**: Full system access, can manage everything
- **Use Case**: System administrators, senior management
- **Current User**: `admin@theaxis.local` (admin123)

### 2. **EDITOR_IN_CHIEF** (Second Highest)
- **Permissions**: Manage articles, users, comments, analytics
- **Use Case**: Chief editors, content managers
- **Cannot**: Access adviser-only functions

### 3. **SECTION_HEAD** (Mid-Level Management)
- **Permissions**: Manage articles in their section, staff resources
- **Use Case**: Department heads, section editors
- **Cannot**: Manage other section heads or advisers

### 4. **STAFF** (Basic Staff Access)
- **Permissions**: Create/edit articles, manage comments
- **Use Case**: Writers, editors, content creators
- **Cannot**: Manage users or system settings

### 5. **READER** (Basic User)
- **Permissions**: Read articles, comment
- **Use Case**: Regular users, subscribers
- **Cannot**: Create content or access admin features

## How to Change Roles

### Method 1: Using Prisma Studio (GUI)
1. Run: `cd backend && npx prisma studio`
2. Open browser to `http://localhost:5555`
3. Go to `User` table
4. Edit the `role` field for any user
5. Save changes

### Method 2: Using Database Directly
```sql
-- Change user role to EDITOR_IN_CHIEF
UPDATE "User" SET role = 'EDITOR_IN_CHIEF' WHERE email = 'user@example.com';

-- Change user role to STAFF
UPDATE "User" SET role = 'STAFF' WHERE email = 'user@example.com';

-- Change user role to READER
UPDATE "User" SET role = 'READER' WHERE email = 'user@example.com';
```

### Method 3: Create New Users with Specific Roles
```bash
# Create Editor-in-Chief
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "editor@theaxis.local",
    "password": "editor123",
    "username": "editor",
    "firstName": "Editor",
    "lastName": "Chief",
    "role": "EDITOR_IN_CHIEF"
  }'

# Create Section Head
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "section@theaxis.local",
    "password": "section123",
    "username": "sectionhead",
    "firstName": "Section",
    "lastName": "Head",
    "role": "SECTION_HEAD"
  }'

# Create Staff Member
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@theaxis.local",
    "password": "staff123",
    "username": "staffmember",
    "firstName": "Staff",
    "lastName": "Member",
    "role": "STAFF"
  }'
```

## Role Permissions Matrix

| Feature | READER | STAFF | SECTION_HEAD | EDITOR_IN_CHIEF | ADVISER |
|---------|--------|-------|--------------|-----------------|---------|
| Read Articles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comment | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Articles | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit Own Articles | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit All Articles | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete Articles | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ | ✅ | ✅ |
| Media Management | ❌ | ✅ | ✅ | ✅ | ✅ |

## Testing Different Roles

### 1. Test as Editor-in-Chief
- Login with: `editor@theaxis.local` / `editor123`
- Should see: Articles, Users, Analytics, Media
- Should NOT see: System settings

### 2. Test as Section Head
- Login with: `section@theaxis.local` / `section123`
- Should see: Articles, Analytics, Media
- Should NOT see: User management

### 3. Test as Staff
- Login with: `staff@theaxis.local` / `staff123`
- Should see: Articles, Media
- Should NOT see: User management, Analytics

### 4. Test as Reader
- Login with: `reader@theaxis.local` / `reader123`
- Should see: Only published articles
- Should NOT see: Admin features

## Frontend Role-Based UI

The frontend automatically shows/hides features based on user role:

- **Dashboard**: Only visible to STAFF and above
- **Articles Management**: Only visible to STAFF and above
- **User Management**: Only visible to EDITOR_IN_CHIEF and above
- **Analytics**: Only visible to SECTION_HEAD and above
- **Media**: Only visible to STAFF and above

## Security Features

1. **JWT Token Authentication**: All API calls require valid tokens
2. **Role-Based Middleware**: Each endpoint checks user permissions
3. **Resource Ownership**: Users can only edit their own content (unless higher role)
4. **Audit Logging**: All actions are logged with user details
5. **Rate Limiting**: Prevents brute force attacks
6. **Input Validation**: All inputs are validated and sanitized

## Quick Role Changes

### Make Admin a Staff Member
```sql
UPDATE "User" SET role = 'STAFF' WHERE email = 'admin@theaxis.local';
```

### Make Admin a Reader
```sql
UPDATE "User" SET role = 'READER' WHERE email = 'admin@theaxis.local';
```

### Restore Admin to Adviser
```sql
UPDATE "User" SET role = 'ADVISER' WHERE email = 'admin@theaxis.local';
```

## Troubleshooting

### If you can't access features after role change:
1. Logout and login again
2. Clear browser cache
3. Check JWT token is valid
4. Verify role in database

### If frontend shows wrong permissions:
1. Check `useAuth` context
2. Verify role in JWT token
3. Check frontend role checks in components
