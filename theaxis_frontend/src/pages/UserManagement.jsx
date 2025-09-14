import { useState, useEffect } from 'react';
import { usersAPI } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { canManageRole, canCreateUserRole } from '../config/permissions';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon, 
  EllipsisVerticalIcon,
  XMarkIcon,
  PencilIcon, 
  TrashIcon
} from '@heroicons/react/24/outline';
import '../styles/user-management.css';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [newUser, setNewUser] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(new Set());
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const allRoles = [
    { value: 'STAFF', label: 'Publication Staff', description: 'Can write and submit articles' },
    { value: 'SECTION_HEAD', label: 'Section Head', description: 'Can manage section articles' },
    { value: 'EDITOR_IN_CHIEF', label: 'Editor-in-Chief', description: 'Can manage all content' },
    { value: 'ADVISER', label: 'Adviser', description: 'Can oversee publication' },
    { value: 'SYSTEM_ADMIN', label: 'System Admin', description: 'Full system access' }
  ];

  // Filter roles based on current user's permissions
  const roles = allRoles.filter(role => 
    canCreateUserRole(currentUser?.role, role.value)
  );

  // Fallback: if no roles are available (user not loaded yet), show all roles
  const availableRoles = roles.length > 0 ? roles : allRoles;

  // Form state for creating new user
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    role: 'STAFF',
    isActive: true
  });

  // Update default role when availableRoles changes
  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.find(role => role.value === formData.role)) {
      setFormData(prev => ({ ...prev, role: availableRoles[0].value }));
    }
  }, [availableRoles, formData.role]);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  // Prevent body scrolling when component mounts
  useEffect(() => {
    document.body.classList.add('user-management-page');
    return () => {
      document.body.classList.remove('user-management-page');
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if the click is not on the filter button or dropdown
      if (showFilterDropdown && !event.target.closest('.filters-button') && !event.target.closest('.filter-dropdown')) {
        setShowFilterDropdown(false);
      }
      // Only close if the click is not on the actions button or dropdown
      if (openDropdown && !event.target.closest('.actions-button') && !event.target.closest('.dropdown-menu')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown, showFilterDropdown]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        sortBy,
        sortOrder
      };
      
      const response = await usersAPI.getUsers(params);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      setError('Failed to fetch users');
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  const handleUsernameChange = (e) => {
    const username = e.target.value;
    setFormData(prev => ({ ...prev, username }));
    // Clear error when user starts typing
    if (usernameError) {
      setUsernameError('');
    }
  };
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setEmailError('');
    setUsernameError('');
    
    // Validate first name
    if (!formData.firstName.trim() || formData.firstName.length > 50) {
      setError('First name must be between 1 and 50 characters');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    // Validate last name
    if (!formData.lastName.trim() || formData.lastName.length > 50) {
      setError('Last name must be between 1 and 50 characters');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username) || formData.username.length < 3 || formData.username.length > 20) {
      setUsernameError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }
    
    try {
      setLoading(true);
      const response = await usersAPI.createUser(formData);
      setNewUser(response.data.user);
      setTemporaryPassword(response.data.temporaryPassword);
      setShowCreateModal(false);
      setShowPasswordModal(true);
      
      // Reset form
      setFormData({
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        role: 'STAFF',
        isActive: true
      });
      
      // Clear validation errors
      setEmailError('');
      setUsernameError('');
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create user';
      
      // Check for specific duplicate errors
      if (errorMessage === 'Email address already exists') {
        setEmailError('This email address is already in use');
      } else if (errorMessage === 'Username already exists') {
        setUsernameError('This username is already taken');
      } else if (errorMessage === 'Both email and username already exist') {
        setEmailError('This email address is already in use');
        setUsernameError('This username is already taken');
      } else {
        setError(errorMessage);
        setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    // Find the current user to get the old role for rollback
    const currentUser = users.find(user => user.id === userId);
    const oldRole = currentUser?.role;

    // Check if the user will still be visible after role change
    const willStillBeVisible = !roleFilter || newRole === roleFilter;
    
    // Set loading state
    setLoadingUsers(prev => new Set(prev).add(userId));

    // Optimistic update - update UI immediately
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      )
    );

    try {
      await usersAPI.updateUserRole(userId, newRole);
      
      // If the user won't be visible after role change, show a notification
      if (!willStillBeVisible) {
        setError(`User role updated successfully! Note: ${currentUser.firstName} ${currentUser.lastName} is no longer visible due to the current role filter.`);
        setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
      } else {
        // Show success message briefly
        setError(`User role updated successfully!`);
        setTimeout(() => setError(''), 3000); // Clear success message after 3 seconds
      }
      
      // Refresh the list to ensure consistency and handle any filtering issues
      await fetchUsers();
    } catch (error) {
      // Revert the optimistic update on error
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role: oldRole }
            : user
        )
      );
      
      // Get detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to update user role';
      
      setError(`Failed to update user role: ${errorMessage}`);
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
      console.error('Error updating user role:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      // Remove loading state
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    // Set loading state
    setLoadingUsers(prev => new Set(prev).add(userId));

    // Optimistic update - update UI immediately
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, isActive: !isActive }
          : user
      )
    );

    try {
      if (isActive) {
        await usersAPI.deactivateUser(userId);
      } else {
        await usersAPI.activateUser(userId);
      }
      
      // Show success message
      const action = isActive ? 'deactivated' : 'activated';
      setError(`User ${action} successfully!`);
      setTimeout(() => setError(''), 3000); // Clear success message after 3 seconds
      
      // Refresh the list to ensure consistency
      await fetchUsers();
    } catch (error) {
      // Revert the optimistic update on error
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isActive: isActive }
            : user
        )
      );
      // Get detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to update user status';
      
      setError(`Failed to update user status: ${errorMessage}`);
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
      console.error('Error updating user status:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      // Remove loading state
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      await usersAPI.deleteUser(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers(); // Refresh the list
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setError(''), 5000); // Clear error after 5 seconds
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      'STAFF': 'publication-staff',
      'SECTION_HEAD': 'section-head',
      'EDITOR_IN_CHIEF': 'editor-in-chief',
      'ADVISER': 'adviser',
      'SYSTEM_ADMIN': 'system-admin'
    };
    return classes[role] || 'publication-staff';
  };

  const getRoleDisplayName = (role) => {
    const names = {
      'STAFF': 'Publication Staff',
      'SECTION_HEAD': 'Section Head',
      'EDITOR_IN_CHIEF': 'Editor-in-Chief',
      'ADVISER': 'Adviser',
      'SYSTEM_ADMIN': 'System Admin'
    };
    return names[role] || 'Publication Staff';
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const clearAllFilters = () => {
    setRoleFilter('');
    setStatusFilter('');
    setShowFilterDropdown(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (roleFilter) count++;
    if (statusFilter) count++;
    return count;
  };

  const getFilterDisplayText = () => {
    const filters = [];
    if (roleFilter) filters.push(getRoleDisplayName(roleFilter));
    if (statusFilter) filters.push(statusFilter === 'active' ? 'Active' : 'Inactive');
    
    if (filters.length === 0) return 'Filters';
    if (filters.length === 1) return filters[0];
    return `${filters.length} filters`;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc order
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return (
        <svg className="sort-icon" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 3L9 6H3L6 3Z" />
        </svg>
      );
    }
    
    if (sortOrder === 'asc') {
      return (
        <svg className="sort-icon sort-active" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 9L3 6H9L6 9Z" />
        </svg>
      );
    } else {
      return (
        <svg className="sort-icon sort-active" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 3L9 6H3L6 3Z" />
        </svg>
      );
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    // Hide SYSTEM_ADMIN users from EIC and ADVISER
    const isVisibleToCurrentUser = currentUser?.role === 'SYSTEM_ADMIN' || user.role !== 'SYSTEM_ADMIN';
    
    return matchesSearch && matchesRole && matchesStatus && isVisibleToCurrentUser;
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="user-management-header">
          <div>
          <h1 className="user-management-title">
            All Users <span className="user-count">{pagination.total}</span>
          </h1>
          <p className="user-management-subtitle">Manage user accounts, roles, and permissions</p>
          </div>
        <div className="action-bar">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search users, emails, or roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <MagnifyingGlassIcon className="search-icon" />
          </div>
          <div className="relative">
            <button 
              className={`filters-button ${getActiveFiltersCount() > 0 ? 'active' : ''}`}
              onClick={(e) => {
                setShowFilterDropdown(!showFilterDropdown);
              }}
              title={getFilterDisplayText()}
            >
              <FunnelIcon className="w-4 h-4" />
              {getActiveFiltersCount() > 0 && (
                <span className="filter-badge">{getActiveFiltersCount()}</span>
              )}
            </button>
            
            {showFilterDropdown && (
              <div className="filter-dropdown">
                <div className="filter-header">
                  <span className="filter-title">Filters</span>
                  {getActiveFiltersCount() > 0 && (
                    <button 
                      onClick={clearAllFilters}
                      className="clear-filter-btn"
                    >
                      Clear All
                    </button>
                  )}
          </div>
                
                {/* Role Filter Section */}
                <div className="filter-section">
                  <div className="filter-section-title">Role</div>
                  <div className="filter-options">
                    <button
                      onClick={() => handleRoleFilter('')}
                      className={`filter-option ${!roleFilter ? 'active' : ''}`}
                    >
                      All Roles
                    </button>
                    {allRoles.filter(role => {
                      // Hide SYSTEM_ADMIN from EIC and ADVISER
                      if (['EDITOR_IN_CHIEF', 'ADVISER'].includes(currentUser?.role) && role.value === 'SYSTEM_ADMIN') {
                        return false;
                      }
                      return true;
                    }).map(role => (
                      <button
                        key={role.value}
                        onClick={() => handleRoleFilter(role.value)}
                        className={`filter-option ${roleFilter === role.value ? 'active' : ''}`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
        </div>

                {/* Status Filter Section */}
                <div className="filter-section">
                  <div className="filter-section-title">Status</div>
                  <div className="filter-options">
                    <button
                      onClick={() => handleStatusFilter('')}
                      className={`filter-option ${!statusFilter ? 'active' : ''}`}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => handleStatusFilter('active')}
                      className={`filter-option ${statusFilter === 'active' ? 'active' : ''}`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleStatusFilter('inactive')}
                      className={`filter-option ${statusFilter === 'inactive' ? 'active' : ''}`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
          </div>
        )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="add-user-button"
          >
            <PlusIcon className="w-5 h-5" />
            Add User
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <div className={`error-content ${error.includes('successfully') ? 'success' : ''}`}>
            <svg className="error-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {error.includes('successfully') ? (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              )}
            </svg>
            <span className="error-text">{error}</span>
            <button 
              onClick={() => setError('')}
              className="error-close"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead className="table-header">
            <tr>
              <th className="center">User</th>
              <th className="center">Role Access</th>
              <th className="center">Status</th>
              <th className="center">
                <button 
                  className="sortable-header"
                  onClick={() => handleSort('lastLoginAt')}
                >
                  LAST LOGIN
                  {getSortIcon('lastLoginAt')}
                </button>
              </th>
              <th className="center">Date Added</th>
              <th className="right"></th>
              </tr>
            </thead>
          <tbody>
              {filteredUsers.map((user) => (
              <tr key={user.id} className="table-row">
                <td className="table-cell">
                  <div className="user-profile-info">
                    <div className="user-avatar">
                      <svg className="user-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                        </div>
                    <div className="user-details">
                      <p className="user-name">{user.firstName} {user.lastName}</p>
                      <p className="user-email">{user.email}</p>
                      </div>
                    </div>
                  </td>
                <td className="table-cell center">
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                  </td>
                <td className="table-cell center">
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-cell center">
                  <span className="date-text">
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Never'
                    }
                  </span>
                  </td>
                <td className="table-cell center">
                  <span className="date-text">
                    {new Date(user.createdAt).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  </td>
                <td className="table-cell right">
                  <div className="relative">
                      <button
                      className="actions-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === user.id ? null : user.id);
                      }}
                    >
                      <EllipsisVerticalIcon className="actions-icon" />
                      </button>
                    
                    {openDropdown === user.id && (
                      <div className="dropdown-menu">
                        {/* Update Role Option */}
                        {canManageRole(currentUser?.role, user.role) && (
                          <div className="dropdown-item">
                            <PencilIcon className="w-4 h-4 mr-2" />
                            <span className="mr-2 text-sm">Change Role:</span>
                            {user.id === currentUser?.id && (
                              <span className="text-xs text-yellow-500 ml-1">(Your role)</span>
                            )}
                            <select
                              value={user.role}
                              onChange={(e) => {
                                if (e.target.value !== user.role) {
                                  // Special confirmation for self-role changes
                                  if (user.id === currentUser?.id) {
                                    const roleHierarchy = {
                                      'STAFF': 0,
                                      'SECTION_HEAD': 1,
                                      'EDITOR_IN_CHIEF': 2,
                                      'ADVISER': 3,
                                      'SYSTEM_ADMIN': 4,
                                    };
                                    
                                    const currentRoleLevel = roleHierarchy[currentUser?.role] || 0;
                                    const targetRoleLevel = roleHierarchy[e.target.value] || 0;
                                    
                                    if (targetRoleLevel > currentRoleLevel) {
                                      const confirmed = window.confirm(
                                        `Are you sure you want to change your role from ${getRoleDisplayName(user.role)} to ${getRoleDisplayName(e.target.value)}? This will give you higher privileges.`
                                      );
                                      if (!confirmed) {
                                        e.target.value = user.role; // Reset the select
                                        return;
                                      }
                                    }
                                  }
                                  handleUpdateUserRole(user.id, e.target.value);
                                }
                                setOpenDropdown(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={loadingUsers.has(user.id)}
                            >
                              {allRoles.filter(role => {
                                // Check if user can manage this role
                                if (!canManageRole(currentUser?.role, role.value)) {
                                  return false;
                                }
                                
                                // Prevent users from changing their own role to a lower privilege level
                                if (user.id === currentUser?.id) {
                                  const roleHierarchy = {
                                    'STAFF': 0,
                                    'SECTION_HEAD': 1,
                                    'EDITOR_IN_CHIEF': 2,
                                    'ADVISER': 3,
                                    'SYSTEM_ADMIN': 4,
                                  };
                                  
                                  const currentRoleLevel = roleHierarchy[currentUser?.role] || 0;
                                  const targetRoleLevel = roleHierarchy[role.value] || 0;
                                  
                                  // Only allow changing to same or higher privilege level
                                  return targetRoleLevel >= currentRoleLevel;
                                }
                                
                                return true;
                              }).map(role => ( 
                                <option key={role.value} value={role.value}>{role.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {/* Toggle Active/Inactive Status */}
                        {(currentUser?.role === 'EDITOR_IN_CHIEF' || currentUser?.role === 'ADVISER' || currentUser?.role === 'SYSTEM_ADMIN') && (
                          <button
                            onClick={() => {
                              handleToggleUserStatus(user.id, user.isActive);
                              setOpenDropdown(null);
                            }}
                            className="dropdown-item"
                            disabled={loadingUsers.has(user.id)}
                          >
                            {loadingUsers.has(user.id) ? (
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                            ) : (
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={user.isActive ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                              </svg>
                            )}
                            {loadingUsers.has(user.id) ? 'Updating...' : (user.isActive ? 'Deactivate User' : 'Activate User')}
                          </button>
                        )}
                        
                        {/* Delete User Option */}
                        {(currentUser?.role === 'EDITOR_IN_CHIEF' || currentUser?.role === 'ADVISER' || currentUser?.role === 'SYSTEM_ADMIN') && (
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                              setOpenDropdown(null);
                            }}
                            className="dropdown-item text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Delete User
                          </button>
                        )}
                      </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="add-user-modal">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setEmailError('');
                setUsernameError('');
              }}
              className="modal-close-button"
            >
              <XMarkIcon className="close-icon" />
            </button>
            <h3 className="modal-title">Add User</h3>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="form-input"
                    placeholder="Enter first name"
                    />
                  </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="form-input"
                    placeholder="Enter last name"
                    />
                  </div>
                </div>
                
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleUsernameChange}
                  className={`form-input ${usernameError ? 'error' : ''}`}
                  placeholder="Enter username"
                />
                {usernameError && (
                  <div className="form-error-message">
                    {usernameError}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleEmailChange}
                  className={`form-input ${emailError ? 'error' : ''}`}
                  placeholder="Enter email address"
                />
                {emailError && (
                  <div className="form-error-message">
                    {emailError}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="form-select"
                  >
                  {availableRoles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                </div>
                
              <div className="modal-buttons">
                <button
                  type="submit"
                  disabled={loading}
                  className="modal-button save"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEmailError('');
                      setUsernameError('');
                    }}
                  className="modal-button cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Password Display Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="password-modal">
            <h3 className="password-modal-title">User Created Successfully!</h3>
            <div className="password-modal-content">
              <div className="password-section">
                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 8px 0', fontWeight: '500' }}>User Details:</p>
                <p style={{ fontSize: '16px', color: '#ffffff', margin: '0 0 4px 0', fontWeight: '600' }}>{newUser?.firstName} {newUser?.lastName}</p>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 4px 0' }}>@{newUser?.username} • {newUser?.email}</p>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', margin: '0' }}>Role: {roles.find(r => r.value === newUser?.role)?.label}</p>
              </div>
                
              <div className="password-section">
                <label className="password-label">
                  Temporary Password (Share with user):
                </label>
                <div className="password-input-container">
                  <input
                    type="text"
                    value={temporaryPassword}
                    readOnly
                    className="password-input"
                  />
                  <button
                    onClick={copyPassword}
                    className={`password-copy-button ${isCopied ? 'copied' : ''}`}
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="password-note">
                  User should change this password on first login
                </p>
              </div>
                
              <button
                onClick={() => setShowPasswordModal(false)}
                className="password-modal-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="simple-delete-modal-overlay">
          <div className="simple-delete-modal">
            <div className="simple-delete-modal-header">
              <h3 className="simple-delete-modal-title">Delete User</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="simple-delete-modal-close"
                disabled={loading}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="simple-delete-modal-content">
              <p className="simple-delete-warning-text">
                Are you sure you want to delete <strong>{userToDelete.firstName} {userToDelete.lastName}</strong>?
              </p>
              <p className="simple-delete-details">
                Email: {userToDelete.email} • Role: {getRoleDisplayName(userToDelete.role)}
              </p>
              <p className="simple-delete-note">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="simple-delete-modal-buttons">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="simple-delete-modal-button cancel"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="simple-delete-modal-button delete"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
