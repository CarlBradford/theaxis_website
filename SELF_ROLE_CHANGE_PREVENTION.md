# Self-Role Change Prevention System

## Problem Statement

If an Adviser accidentally changes their role to Section Head or Staff, they would lose access to user management and couldn't revert it back, creating a security vulnerability.

## Solution Overview

Implemented a comprehensive multi-layer protection system to prevent users from accidentally downgrading their own roles:

### 1. Frontend Protection

#### **Role Dropdown Filtering**
- Users can only see roles that are equal to or higher than their current privilege level
- Lower privilege roles are completely hidden from the dropdown

#### **Visual Indicators**
- Clear "(Your role)" indicator next to the role change dropdown when viewing your own profile
- Yellow text warning to draw attention to self-role changes

#### **Confirmation Dialog**
- Special confirmation dialog for self-role changes to higher privilege levels
- Prevents accidental role changes through double confirmation

### 2. Backend Protection

#### **API-Level Validation**
- Server-side validation prevents role downgrades
- Returns 403 Forbidden error with clear message: "Cannot change your own role to a lower privilege level"

#### **Role Hierarchy Enforcement**
- Strict hierarchy levels: STAFF (0) < SECTION_HEAD (1) < EDITOR_IN_CHIEF (2) < ADVISER (3) < SYSTEM_ADMIN (4)
- Only allows changes to same or higher privilege levels

## Implementation Details

### Role Hierarchy
```javascript
const roleHierarchy = {
  'STAFF': 0,
  'SECTION_HEAD': 1,
  'EDITOR_IN_CHIEF': 2,
  'ADVISER': 3,
  'SYSTEM_ADMIN': 4,
};
```

### Frontend Filtering Logic
```javascript
// Prevent users from changing their own role to a lower privilege level
if (user.id === currentUser?.id) {
  const currentRoleLevel = roleHierarchy[currentUser?.role] || 0;
  const targetRoleLevel = roleHierarchy[role.value] || 0;
  
  // Only allow changing to same or higher privilege level
  return targetRoleLevel >= currentRoleLevel;
}
```

### Backend Validation
```javascript
// Prevent users from changing their own role to a lower privilege level
if (existingUser.id === req.user.id) {
  const currentRoleLevel = roleHierarchy[req.user.role] || 0;
  const targetRoleLevel = roleHierarchy[role] || 0;
  
  // Only allow changing to same or higher privilege level
  if (targetRoleLevel < currentRoleLevel) {
    return sendErrorResponse(res, 403, 'Cannot change your own role to a lower privilege level');
  }
}
```

## User Experience

### For Adviser Users:
- ✅ **Cannot see** STAFF, SECTION_HEAD, or EDITOR_IN_CHIEF in role dropdown
- ✅ **Can see** SYSTEM_ADMIN (higher privilege) with confirmation dialog
- ✅ **Visual warning** "(Your role)" indicator
- ✅ **Backend protection** prevents API manipulation

### For Other Roles:
- ✅ **Same protection** applies to all roles
- ✅ **Consistent behavior** across the application
- ✅ **Clear error messages** if attempted via API

## Security Benefits

1. **Prevents Accidental Downgrades**: Users cannot accidentally lose privileges
2. **API Protection**: Backend validation prevents bypassing frontend restrictions
3. **Clear Feedback**: Users understand why certain options are unavailable
4. **Consistent Enforcement**: Same rules apply across all interfaces

## Recovery Options

If a user somehow gets locked out (e.g., through direct database manipulation):

1. **System Admin Intervention**: SYSTEM_ADMIN can change any user's role
2. **Database Direct Access**: Direct database update as last resort
3. **Account Recovery**: Create new SYSTEM_ADMIN account if needed

## Testing

Comprehensive test coverage includes:
- ✅ **Frontend filtering** prevents lower privilege roles from appearing
- ✅ **Backend validation** returns proper error codes
- ✅ **Role hierarchy** calculations work correctly
- ✅ **Edge cases** handled properly

## Best Practices

1. **Always test** role changes in development environment first
2. **Maintain** SYSTEM_ADMIN accounts as backup
3. **Document** any manual role changes
4. **Monitor** role change logs for security

This system ensures that users cannot accidentally lock themselves out of the system while maintaining the flexibility to upgrade their roles when needed.
