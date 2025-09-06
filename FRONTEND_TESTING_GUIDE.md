# Frontend Testing Guide

## 🚀 How to Check Each Part of the Frontend

### 1. **Basic Site Access**
- **URL**: `http://localhost:5173`
- **Expected**: Beautiful home page with gradient background
- **Check**: Logo, navigation, feature cards

### 2. **Login Functionality**
- **URL**: `http://localhost:5173/login`
- **Test Credentials**:
  - Email: `admin@theaxis.local`
  - Password: `admin123`
- **Expected**: Successful login → redirect to dashboard

### 3. **Dashboard Access**
- **URL**: `http://localhost:5173/dashboard` (after login)
- **Expected**: Dashboard with stats, recent articles
- **Check**: User info, navigation sidebar

### 4. **Articles Page**
- **URL**: `http://localhost:5173/articles`
- **Expected**: List of articles
- **Check**: Article cards, pagination

### 5. **Navigation Testing**
- **Check**: Sidebar navigation (when logged in)
- **Check**: Navbar links
- **Check**: Mobile menu (if applicable)

### 6. **API Integration Testing**
- **Debug Page**: `http://localhost:5173/login-debug`
- **Expected**: Shows API response details
- **Check**: Network requests in browser dev tools

## 🔧 Troubleshooting Steps

### If Frontend Won't Load:
1. Check if Vite is running: `netstat -ano | findstr :5173`
2. Restart frontend: `cd theaxis_frontend && npm run dev`
3. Check browser console for errors

### If Login Fails:
1. Check backend is running: `netstat -ano | findstr :3001`
2. Test API directly: Use debug page
3. Check CORS settings
4. Verify credentials

### If Styling Issues:
1. Check Tailwind CSS compilation
2. Verify PostCSS configuration
3. Check for CSS class conflicts

## 📊 Current Status

### ✅ Working:
- Backend API (port 3001)
- Frontend server (port 5173)
- Login functionality
- Dashboard display
- Navigation

### ⚠️ Issues Found:
- Some 404 errors for `/api/articles/create` and `/api/users/profile`
- Tailwind CSS compilation warning

### 🔧 Next Steps:
1. Test each page systematically
2. Check browser console for errors
3. Verify all API endpoints
4. Test responsive design
