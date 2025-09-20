import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/apiService';
import { hasPermission as checkPermission, hasAnyPermission as checkAnyPermission, hasAllPermissions as checkAllPermissions } from '../config/permissions';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async (retryCount = 0) => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      
      // Handle rate limiting with exponential backoff - Development settings
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(1.5, retryCount) * 500; // 500ms, 750ms, 1125ms (much faster)
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        setTimeout(() => {
          fetchUser(retryCount + 1);
        }, delay);
        return;
      }
      
      // For other errors or max retries reached, logout
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await authAPI.login({ usernameOrEmail, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        return { 
          success: false, 
          error: 'Too many login attempts. Please wait a moment and try again.' 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    authAPI.logout();
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      'STAFF': 0,
      'SECTION_HEAD': 1,
      'EDITOR_IN_CHIEF': 2,
      'ADVISER': 3,
      'SYSTEM_ADMIN': 4
    };
    
    // Handle array of roles - user needs to have at least one of the required roles
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => roleHierarchy[user.role] >= roleHierarchy[role]);
    }
    
    // Handle single role
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return checkPermission(user.role, permission);
  };

  const hasAnyPermission = (permissions) => {
    if (!user) return false;
    return checkAnyPermission(user.role, permissions);
  };

  const hasAllPermissions = (permissions) => {
    if (!user) return false;
    return checkAllPermissions(user.role, permissions);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
