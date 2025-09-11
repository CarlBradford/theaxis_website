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

  const fetchUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
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
