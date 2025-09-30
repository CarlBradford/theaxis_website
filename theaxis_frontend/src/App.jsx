import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ColorPaletteProvider } from './contexts/ColorPaletteContext';
import { NotificationProvider } from './components/NotificationBell';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import { useGAInit, useAnalytics } from './hooks/useAnalytics';
import Home from './pages/public/Home';
import ArticleDetail from './pages/public/ArticleDetail';
import SearchPage from './pages/public/SearchPage';
import OfflineArticles from './pages/public/OfflineArticles';
import CategoryPage from './pages/public/CategoryPage';
import Gallery from './pages/public/Gallery';
import AnnualEditions from './pages/public/AnnualEditions';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
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
    const initializeSettings = async () => {
      try {
        const { assets } = await siteSettingsService.initialize();
        
        // Update favicon if logo asset is available
        if (assets && assets.length > 0) {
          const logoAsset = assets.find(asset => asset.assetType === 'logo' && asset.isActive);
          
          if (logoAsset) {
            const faviconLink = document.querySelector('link[rel="icon"]');
            if (faviconLink) {
              faviconLink.href = `http://localhost:3001/uploads/${logoAsset.fileName}`;
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize site settings:', error);
      }
    };

    initializeSettings();
  }, []);
  
  return (
    <AuthProvider>
      <ColorPaletteProvider>
        <NotificationProvider>
          <Router>
            <ScrollToTop />
            <AnalyticsTracker />
            <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Article Detail - Outside Layout */}
              <Route path="content/:slug" element={<ArticleDetail />} />
              
              {/* Public Search Page - Outside Layout */}
              <Route path="search" element={<SearchPage />} />
              
              {/* Public Offline Articles Page - Outside Layout */}
              <Route path="offline" element={<OfflineArticles />} />
              
              {/* Public Category Page - Outside Layout */}
              <Route path=":categorySlug" element={<CategoryPage />} />
              
              {/* Public Gallery Page - Outside Layout */}
              <Route path="gallery" element={<Gallery />} />
              
              {/* Public Annual Editions Page - Outside Layout */}
              <Route path="annual-editions" element={<AnnualEditions />} />
              
              {/* Public Legal Pages - Outside Layout */}
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<TermsOfService />} />
              
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
                <ProtectedRoute>
                  <MyContent />
                </ProtectedRoute>
              } />
              <Route path="content/status" element={
                <ProtectedRoute>
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
                <ProtectedRoute requiredRole="ADVISER">
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
