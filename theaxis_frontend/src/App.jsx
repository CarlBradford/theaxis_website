import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Media from './pages/Media';
import Profile from './pages/Profile';
import LoginDebug from './pages/LoginDebug';
import HealthCheck from './pages/HealthCheck';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="login-debug" element={<LoginDebug />} />
              <Route path="health-check" element={<HealthCheck />} />
              <Route path="register" element={<Register />} />
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="articles" element={<Articles />} />
              <Route path="articles/:id" element={<ArticleDetail />} />
              <Route path="media" element={
                <ProtectedRoute requiredRole="STAFF">
                  <Media />
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
    </AuthProvider>
  );
}

export default App;
