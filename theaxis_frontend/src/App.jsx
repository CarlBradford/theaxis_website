import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/NotificationBell';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
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
import ProtectedRoute from './components/ProtectedRoute';
import './styles/uniform-loading.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="login-debug" element={<LoginDebug />} />
              <Route path="health-check" element={<HealthCheck />} />
              
              {/* Protected Routes */}
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="content" element={<Articles />} />
              <Route path="content/:id" element={<ArticleDetail />} />
              
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
                  <div>Analytics Dashboard</div>
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
    </AuthProvider>
  );
}

export default App;
