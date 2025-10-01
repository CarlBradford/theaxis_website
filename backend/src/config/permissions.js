/**
 * Role-Based Access Control (RBAC) Permissions Configuration
 * Defines what each role can do in the system
 */

const PERMISSIONS = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ACTIVATE: 'user:activate',
  USER_DEACTIVATE: 'user:deactivate',
  USER_ROLE_CHANGE: 'user:role_change',

  // Article Management
  ARTICLE_CREATE: 'article:create',
  ARTICLE_READ: 'article:read',
  ARTICLE_UPDATE: 'article:update',
  ARTICLE_DELETE: 'article:delete',
  ARTICLE_PUBLISH: 'article:publish',
  ARTICLE_APPROVE: 'article:approve',
  ARTICLE_REJECT: 'article:reject',
  ARTICLE_REVIEW: 'article:review',

  // Category & Tag Management
  CATEGORY_CREATE: 'category:create',
  CATEGORY_READ: 'category:read',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',
  TAG_CREATE: 'tag:create',
  TAG_READ: 'tag:read',
  TAG_UPDATE: 'tag:update',
  TAG_DELETE: 'tag:delete',

  // Comment Management
  COMMENT_READ: 'comment:read',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_MODERATE: 'comment:moderate',

  // Media Management
  MEDIA_UPLOAD: 'media:upload',
  MEDIA_READ: 'media:read',
  MEDIA_DELETE: 'media:delete',

  // Analytics & Reports
  ANALYTICS_READ: 'analytics:read',
  REPORTS_GENERATE: 'reports:generate',

  // System Administration
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_MAINTENANCE: 'system:maintenance',

  // Announcements
  ANNOUNCEMENT_CREATE: 'announcement:create',
  ANNOUNCEMENT_READ: 'announcement:read',
  ANNOUNCEMENT_UPDATE: 'announcement:update',
  ANNOUNCEMENT_DELETE: 'announcement:delete',
  ANNOUNCEMENT_PUBLISH: 'announcement:publish',

  // Editorial Notes
  EDITORIAL_NOTE_CREATE: 'editorial_note:create',
  EDITORIAL_NOTE_READ: 'editorial_note:read',
  EDITORIAL_NOTE_UPDATE: 'editorial_note:update',
  EDITORIAL_NOTE_DELETE: 'editorial_note:delete',
};

const ROLE_PERMISSIONS = {
  SYSTEM_ADMIN: [
    // Full access to everything
    ...Object.values(PERMISSIONS)
  ],

  ADMINISTRATOR: [
    // User Management
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_ACTIVATE,
    PERMISSIONS.USER_DEACTIVATE,
    PERMISSIONS.USER_ROLE_CHANGE,

    // Article Management
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.ARTICLE_UPDATE,
    PERMISSIONS.ARTICLE_DELETE,
    PERMISSIONS.ARTICLE_PUBLISH,
    PERMISSIONS.ARTICLE_APPROVE,
    PERMISSIONS.ARTICLE_REJECT,
    PERMISSIONS.ARTICLE_REVIEW,

    // Category & Tag Management
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_DELETE,
    PERMISSIONS.TAG_CREATE,
    PERMISSIONS.TAG_READ,
    PERMISSIONS.TAG_UPDATE,
    PERMISSIONS.TAG_DELETE,

    // Comment Management
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.COMMENT_MODERATE,

    // Media Management
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.MEDIA_DELETE,

    // Analytics & Reports
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTS_GENERATE,

    // System Administration
    PERMISSIONS.SYSTEM_CONFIG,

    // Announcements
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.ANNOUNCEMENT_READ,
    PERMISSIONS.ANNOUNCEMENT_UPDATE,
    PERMISSIONS.ANNOUNCEMENT_DELETE,
    PERMISSIONS.ANNOUNCEMENT_PUBLISH,

    // Editorial Notes
    PERMISSIONS.EDITORIAL_NOTE_CREATE,
    PERMISSIONS.EDITORIAL_NOTE_READ,
    PERMISSIONS.EDITORIAL_NOTE_UPDATE,
    PERMISSIONS.EDITORIAL_NOTE_DELETE,
  ],

  ADMIN_ASSISTANT: [
    // User Management
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_ACTIVATE,
    PERMISSIONS.USER_DEACTIVATE,
    PERMISSIONS.USER_ROLE_CHANGE,

    // Article Management
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.ARTICLE_UPDATE,
    PERMISSIONS.ARTICLE_DELETE,
    PERMISSIONS.ARTICLE_PUBLISH,
    PERMISSIONS.ARTICLE_APPROVE,
    PERMISSIONS.ARTICLE_REJECT,
    PERMISSIONS.ARTICLE_REVIEW,

    // Category & Tag Management
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_DELETE,
    PERMISSIONS.TAG_CREATE,
    PERMISSIONS.TAG_READ,
    PERMISSIONS.TAG_UPDATE,
    PERMISSIONS.TAG_DELETE,

    // Comment Management
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.COMMENT_MODERATE,

    // Media Management
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.MEDIA_DELETE,

    // Analytics & Reports
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTS_GENERATE,

    // Announcements
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.ANNOUNCEMENT_READ,
    PERMISSIONS.ANNOUNCEMENT_UPDATE,
    PERMISSIONS.ANNOUNCEMENT_DELETE,
    PERMISSIONS.ANNOUNCEMENT_PUBLISH,

    // Editorial Notes
    PERMISSIONS.EDITORIAL_NOTE_CREATE,
    PERMISSIONS.EDITORIAL_NOTE_READ,
    PERMISSIONS.EDITORIAL_NOTE_UPDATE,
    PERMISSIONS.EDITORIAL_NOTE_DELETE,
  ],

  SECTION_HEAD: [
    // Article Management (can publish directly without approval)
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.ARTICLE_UPDATE,
    PERMISSIONS.ARTICLE_APPROVE,
    PERMISSIONS.ARTICLE_REJECT,
    PERMISSIONS.ARTICLE_REVIEW,

    // Category & Tag Management (limited)
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.TAG_READ,
    PERMISSIONS.TAG_UPDATE,

    // Media Management
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,

    // Editorial Notes
    PERMISSIONS.EDITORIAL_NOTE_CREATE,
    PERMISSIONS.EDITORIAL_NOTE_READ,
    PERMISSIONS.EDITORIAL_NOTE_UPDATE,
  ],

  STAFF: [
    // User Management (read-only for author selection)
    PERMISSIONS.USER_READ,

    // Article Management (limited)
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.ARTICLE_UPDATE,

    // Category & Tag Management (read-only)
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.TAG_READ,

    // Media Management (can delete own files)
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.MEDIA_DELETE,

    // Editorial Notes
    PERMISSIONS.EDITORIAL_NOTE_READ,
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether the role has the permission
 */
const hasPermission = (role, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} - Whether the role has any of the permissions
 */
const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} - Whether the role has all of the permissions
 */
const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} - Array of permissions for the role
 */
const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get role hierarchy level (higher number = more privileges)
 * @param {string} role - User role
 * @returns {number} - Hierarchy level
 */
const getRoleLevel = (role) => {
  const hierarchy = {
    STAFF: 0,
    SECTION_HEAD: 1,
    ADMIN_ASSISTANT: 2,
    ADMINISTRATOR: 3,
    SYSTEM_ADMIN: 4,
  };
  return hierarchy[role] || 0;
};

/**
 * Check if a role can manage another role
 * @param {string} managerRole - Role of the manager
 * @param {string} targetRole - Role to be managed
 * @returns {boolean} - Whether the manager can manage the target role
 */
const canManageRole = (managerRole, targetRole) => {
  // SYSTEM_ADMIN can update all roles
  if (managerRole === 'SYSTEM_ADMIN') {
    return true;
  }
  
  // ADMIN_ASSISTANT and ADMINISTRATOR can update STAFF, SECTION_HEAD, ADMIN_ASSISTANT, ADMINISTRATOR (but not SYSTEM_ADMIN)
  if (['ADMIN_ASSISTANT', 'ADMINISTRATOR'].includes(managerRole)) {
    return ['STAFF', 'SECTION_HEAD', 'ADMIN_ASSISTANT', 'ADMINISTRATOR'].includes(targetRole);
  }
  
  // SECTION_HEAD cannot update any roles
  if (managerRole === 'SECTION_HEAD') {
    return false;
  }
  
  // STAFF cannot update any roles
  if (managerRole === 'STAFF') {
    return false;
  }
  
  return false;
};

/**
 * Check if a role can create users with a specific role
 * @param {string} creatorRole - Role of the creator
 * @param {string} targetRole - Role to be created
 * @returns {boolean} - Whether the creator can create users with the target role
 */
const canCreateUserRole = (creatorRole, targetRole) => {
  // SYSTEM_ADMIN can create users for all roles
  if (creatorRole === 'SYSTEM_ADMIN') {
    return true;
  }
  
  // ADMIN_ASSISTANT and ADMINISTRATOR can create users for STAFF, SECTION_HEAD, ADMIN_ASSISTANT, ADMINISTRATOR (but not SYSTEM_ADMIN)
  if (['ADMIN_ASSISTANT', 'ADMINISTRATOR'].includes(creatorRole)) {
    return ['STAFF', 'SECTION_HEAD', 'ADMIN_ASSISTANT', 'ADMINISTRATOR'].includes(targetRole);
  }
  
  // SECTION_HEAD cannot create any user accounts
  if (creatorRole === 'SECTION_HEAD') {
    return false;
  }
  
  // STAFF cannot create any user accounts
  if (creatorRole === 'STAFF') {
    return false;
  }
  
  return false;
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  getRoleLevel,
  canManageRole,
  canCreateUserRole,
};
