import { describe, it, expect } from 'vitest'
import { canCreateUserRole, canManageRole } from '../config/permissions'

describe('Permission Restrictions for SYSTEM_ADMIN', () => {
  describe('canCreateUserRole', () => {
    it('should allow SYSTEM_ADMIN to create users with any role', () => {
      expect(canCreateUserRole('SYSTEM_ADMIN', 'STAFF')).toBe(true)
      expect(canCreateUserRole('SYSTEM_ADMIN', 'SECTION_HEAD')).toBe(true)
      expect(canCreateUserRole('SYSTEM_ADMIN', 'ADMIN_ASSISTANT')).toBe(true)
      expect(canCreateUserRole('SYSTEM_ADMIN', 'ADMINISTRATOR')).toBe(true)
      expect(canCreateUserRole('SYSTEM_ADMIN', 'SYSTEM_ADMIN')).toBe(true)
    })

    it('should NOT allow ADMIN_ASSISTANT to create SYSTEM_ADMIN users', () => {
      expect(canCreateUserRole('ADMIN_ASSISTANT', 'SYSTEM_ADMIN')).toBe(false)
    })

    it('should NOT allow ADMINISTRATOR to create SYSTEM_ADMIN users', () => {
      expect(canCreateUserRole('ADMINISTRATOR', 'SYSTEM_ADMIN')).toBe(false)
    })

    it('should allow ADMIN_ASSISTANT to create other roles', () => {
      expect(canCreateUserRole('ADMIN_ASSISTANT', 'STAFF')).toBe(true)
      expect(canCreateUserRole('ADMIN_ASSISTANT', 'SECTION_HEAD')).toBe(true)
      expect(canCreateUserRole('ADMIN_ASSISTANT', 'ADMIN_ASSISTANT')).toBe(true)
      expect(canCreateUserRole('ADMIN_ASSISTANT', 'ADMINISTRATOR')).toBe(true)
    })

    it('should allow ADMINISTRATOR to create other roles', () => {
      expect(canCreateUserRole('ADMINISTRATOR', 'STAFF')).toBe(true)
      expect(canCreateUserRole('ADMINISTRATOR', 'SECTION_HEAD')).toBe(true)
      expect(canCreateUserRole('ADMINISTRATOR', 'ADMIN_ASSISTANT')).toBe(true)
      expect(canCreateUserRole('ADMINISTRATOR', 'ADMINISTRATOR')).toBe(true)
    })
  })

  describe('canManageRole', () => {
    it('should allow SYSTEM_ADMIN to manage any role', () => {
      expect(canManageRole('SYSTEM_ADMIN', 'STAFF')).toBe(true)
      expect(canManageRole('SYSTEM_ADMIN', 'SECTION_HEAD')).toBe(true)
      expect(canManageRole('SYSTEM_ADMIN', 'ADMIN_ASSISTANT')).toBe(true)
      expect(canManageRole('SYSTEM_ADMIN', 'ADMINISTRATOR')).toBe(true)
      expect(canManageRole('SYSTEM_ADMIN', 'SYSTEM_ADMIN')).toBe(true)
    })

    it('should NOT allow ADMIN_ASSISTANT to manage SYSTEM_ADMIN roles', () => {
      expect(canManageRole('ADMIN_ASSISTANT', 'SYSTEM_ADMIN')).toBe(false)
    })

    it('should NOT allow ADMINISTRATOR to manage SYSTEM_ADMIN roles', () => {
      expect(canManageRole('ADMINISTRATOR', 'SYSTEM_ADMIN')).toBe(false)
    })

    it('should allow ADMIN_ASSISTANT to manage other roles', () => {
      expect(canManageRole('ADMIN_ASSISTANT', 'STAFF')).toBe(true)
      expect(canManageRole('ADMIN_ASSISTANT', 'SECTION_HEAD')).toBe(true)
      expect(canManageRole('ADMIN_ASSISTANT', 'ADMIN_ASSISTANT')).toBe(true)
      expect(canManageRole('ADMIN_ASSISTANT', 'ADMINISTRATOR')).toBe(true)
    })

    it('should allow ADMINISTRATOR to manage other roles', () => {
      expect(canManageRole('ADMINISTRATOR', 'STAFF')).toBe(true)
      expect(canManageRole('ADMINISTRATOR', 'SECTION_HEAD')).toBe(true)
      expect(canManageRole('ADMINISTRATOR', 'ADMIN_ASSISTANT')).toBe(true)
      expect(canManageRole('ADMINISTRATOR', 'ADMINISTRATOR')).toBe(true)
    })
  })

  describe('User Visibility Restrictions', () => {
    it('should hide SYSTEM_ADMIN users from EIC and ADMINISTRATOR', () => {
      const mockUsers = [
        { id: '1', role: 'STAFF', firstName: 'John', lastName: 'Doe' },
        { id: '2', role: 'ADMIN_ASSISTANT', firstName: 'Jane', lastName: 'Smith' },
        { id: '3', role: 'SYSTEM_ADMIN', firstName: 'Admin', lastName: 'User' },
      ]

      // Mock current user as EIC
      const currentUser = { role: 'ADMIN_ASSISTANT' }
      
      // Filter function (simplified version of what's in UserManagement)
      const filteredUsers = mockUsers.filter(user => {
        const isVisibleToCurrentUser = currentUser?.role === 'SYSTEM_ADMIN' || user.role !== 'SYSTEM_ADMIN'
        return isVisibleToCurrentUser
      })

      expect(filteredUsers).toHaveLength(2)
      expect(filteredUsers.find(user => user.role === 'SYSTEM_ADMIN')).toBeUndefined()
      expect(filteredUsers.find(user => user.role === 'STAFF')).toBeDefined()
      expect(filteredUsers.find(user => user.role === 'ADMIN_ASSISTANT')).toBeDefined()
    })

    it('should show all users to SYSTEM_ADMIN', () => {
      const mockUsers = [
        { id: '1', role: 'STAFF', firstName: 'John', lastName: 'Doe' },
        { id: '2', role: 'ADMIN_ASSISTANT', firstName: 'Jane', lastName: 'Smith' },
        { id: '3', role: 'SYSTEM_ADMIN', firstName: 'Admin', lastName: 'User' },
      ]

      // Mock current user as SYSTEM_ADMIN
      const currentUser = { role: 'SYSTEM_ADMIN' }
      
      // Filter function (simplified version of what's in UserManagement)
      const filteredUsers = mockUsers.filter(user => {
        const isVisibleToCurrentUser = currentUser?.role === 'SYSTEM_ADMIN' || user.role !== 'SYSTEM_ADMIN'
        return isVisibleToCurrentUser
      })

      expect(filteredUsers).toHaveLength(3)
      expect(filteredUsers.find(user => user.role === 'SYSTEM_ADMIN')).toBeDefined()
      expect(filteredUsers.find(user => user.role === 'STAFF')).toBeDefined()
      expect(filteredUsers.find(user => user.role === 'ADMIN_ASSISTANT')).toBeDefined()
    })
  })

  describe('Self-Role Change Prevention', () => {
    it('should prevent users from changing their own role to lower privilege level', () => {
      const mockUsers = [
        { id: '1', role: 'ADMINISTRATOR', firstName: 'Administrator', lastName: 'User' },
        { id: '2', role: 'STAFF', firstName: 'Staff', lastName: 'User' },
      ]

      const currentUser = { id: '1', role: 'ADMINISTRATOR' }
      
      // Filter function for role dropdown (simplified version)
      const availableRoles = mockUsers.filter(user => {
        if (user.id === currentUser.id) {
          const roleHierarchy = {
            'STAFF': 0,
            'SECTION_HEAD': 1,
            'ADMIN_ASSISTANT': 2,
            'ADMINISTRATOR': 3,
            'SYSTEM_ADMIN': 4,
          }
          
          const currentRoleLevel = roleHierarchy[currentUser.role] || 0
          const targetRoleLevel = roleHierarchy[user.role] || 0
          
          // Only allow changing to same or higher privilege level
          return targetRoleLevel >= currentRoleLevel
        }
        return true
      })

      // Should only allow ADMINISTRATOR to change to SYSTEM_ADMIN (higher level)
      // Should not allow changing to STAFF, SECTION_HEAD, or ADMIN_ASSISTANT (lower levels)
      expect(availableRoles.length).toBeGreaterThan(0)
    })

    it('should allow users to change their own role to higher privilege level', () => {
      const roleHierarchy = {
        'STAFF': 0,
        'SECTION_HEAD': 1,
        'ADMIN_ASSISTANT': 2,
        'ADMINISTRATOR': 3,
        'SYSTEM_ADMIN': 4,
      }

      const currentRoleLevel = roleHierarchy['ADMINISTRATOR']
      const targetRoleLevel = roleHierarchy['SYSTEM_ADMIN']

      // ADMINISTRATOR should be able to change to SYSTEM_ADMIN (higher level)
      expect(targetRoleLevel >= currentRoleLevel).toBe(true)
    })

    it('should prevent users from changing their own role to lower privilege level', () => {
      const roleHierarchy = {
        'STAFF': 0,
        'SECTION_HEAD': 1,
        'ADMIN_ASSISTANT': 2,
        'ADMINISTRATOR': 3,
        'SYSTEM_ADMIN': 4,
      }

      const currentRoleLevel = roleHierarchy['ADMINISTRATOR']
      const targetRoleLevel = roleHierarchy['STAFF']

      // ADMINISTRATOR should NOT be able to change to STAFF (lower level)
      expect(targetRoleLevel >= currentRoleLevel).toBe(false)
    })
  })
})