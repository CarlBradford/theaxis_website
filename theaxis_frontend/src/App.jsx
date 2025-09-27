import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ColorPaletteProvider } from './contexts/ColorPaletteContext';
import { NotificationProvider } from './components/NotificationBell';
import Layout from './components/Layout';
import { useGAInit, useAnalytics } from './hooks/useAnalytics';
import Home from './pages/public/Home';
import ArticleDetail from './pages/public/ArticleDetail';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import AdminArticleDetail from './pages/ArticleDetail';
import MyContent from './pages/MyContent';
import CreateArticle from './pages/CreateArticle';
import EditContent from './pages/EditContent';
import ReviewEditContent from './pages/ReviewEditContent';
import ReviewQueuePage from './pages/ReviewQueuePage';
import ContentStatus from './pages/ContentStatus';
import Media from './pages/Media';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import PublishedContent from './pages/PublishedContent';
import CommentManagement from './pages/CommentManagement';
import LoginDebug from './pages/LoginDebug';
import HealthCheck from './pages/HealthCheck';
import FeaturedArticlesPage from './pages/FeaturedArticlesPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/uniform-loading.css';
import './styles/color-palette.css';
import siteSettingsService from './services/siteSettingsService';

// Analytics component that runs inside Router context
function AnalyticsTracker() {
  useAnalytics(); // Track page views
  return null; // This component doesn't render anything
}

// Main app component
function AppWithAnalytics() {
  useGAInit(); // Initialize GA outside Router context
  
  // Initialize site settings on app load
  React.useEffect(() => {
    siteSettingsService.initialize();
  }, []);
  
  return (
    <AuthProvider>
      <ColorPaletteProvider>
        <NotificationProvider>
          <Router>
            <AnalyticsTracker />
            <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Article Detail - Outside Layout */}
              <Route path="content/:slug" element={<ArticleDetail />} />
              
              <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="admin-portal" element={<Login />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="login-debug" element={<LoginDebug />} />
              <Route path="health-check" element={<HealthCheck />} />
              
              {/* Protected Routes */}
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="content" element={<Articles />} />
              <Route path="content/:id" element={<AdminArticleDetail />} />
              
              {/* Article Management Routes */}
              <Route path="content/mycontent" element={
                <ProtectedRoute requiredRole="STAFF" excludeRoles={['ADVISER']}>
                  <MyContent />
                </ProtectedRoute>
              } />
              <Route path="content/status" element={
                <ProtectedRoute requiredRole="STAFF" excludeRoles={['ADVISER']}>
                  <ContentStatus />
                </ProtectedRoute>
              } />
              <Route path="content/pending" element={
                <ProtectedRoute requiredRole="STAFF">
                  <ReviewQueuePage />
                </ProtectedRoute>
              } />
              <Route path="content/create" element={
                <ProtectedRoute requiredRole="STAFF">
                  <CreateArticle />
                </ProtectedRoute>
              } />
              <Route path="content/:id/edit" element={
                <ProtectedRoute requiredRole="STAFF">
                  <EditContent />
                </ProtectedRoute>
              } />
              <Route path="content/:id/review-edit" element={
                <ProtectedRoute requiredRole="STAFF">
                  <ReviewEditContent />
                </ProtectedRoute>
              } />
              
              {/* Role-based Protected Routes */}
              <Route path="media" element={
                <ProtectedRoute requiredRole="STAFF">
                  <Media />
                </ProtectedRoute>
              } />
              
              <Route path="users" element={
                <ProtectedRoute requiredRole="SECTION_HEAD">
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              <Route path="published-content" element={
                <ProtectedRoute requiredRole="SECTION_HEAD">
                  <PublishedContent />
                </ProtectedRoute>
              } />
              
              <Route path="comments" element={
                <ProtectedRoute requiredRole="SECTION_HEAD">
                  <CommentManagement />
                </ProtectedRoute>
              } />
              
              <Route path="analytics" element={
                <ProtectedRoute requiredRole="EDITOR_IN_CHIEF">
                  <AnalyticsDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="featured-articles" element={
                <ProtectedRoute requiredRole="EDITOR_IN_CHIEF" excludeRoles={[]}>
                  <FeaturedArticlesPage />
                </ProtectedRoute>
              } />
              
              <Route path="settings" element={
                <ProtectedRoute requiredRole="EDITOR_IN_CHIEF">
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="admin" element={
                <ProtectedRoute requiredRole="SYSTEM_ADMIN">
                  <div>System Administration</div>
                </ProtectedRoute>
              } />
              
              <Route path="profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              </Route>
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
      </ColorPaletteProvider>
    </AuthProvider>
  );
}

// Main App component
function App() {
  return <AppWithAnalytics />;
}

export default App;
