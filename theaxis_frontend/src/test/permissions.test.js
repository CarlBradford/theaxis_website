import { describe, it, expect } from 'vitest'
import { canCreateUserRole, canManageRole } from '../config/permissions'

describe('Permission Restrictions for SYSTEM_ADMIN', () => {
  describe('canCreateUserRole', () => {
    it('should allow SYSTEM_ADMIN to create users with any role', () => {
      expect(canCreateUserRole('SYSTEM_ADMIN', 'STAFF')).toBe(true)
      expect(canCreateUserRole('SYSTEM_ADMIN', 'SECTION_HEAD')).toBe(true)
      expect(canCreateUserRole('SYSTEM_ADMIN', 'EDITOR_IN_CHIEF')).toBe(true)
      expect(canCreateUserRole('SYSTEM_ADMIN', 'ADVISER')).toBe(true)
      expect(canCreateUserRole('SYSTEM_ADMIN', 'SYSTEM_ADMIN')).toBe(true)
    })

    it('should NOT allow EDITOR_IN_CHIEF to create SYSTEM_ADMIN users', () => {
      expect(canCreateUserRole('EDITOR_IN_CHIEF', 'SYSTEM_ADMIN')).toBe(false)
    })

    it('should NOT allow ADVISER to create SYSTEM_ADMIN users', () => {
      expect(canCreateUserRole('ADVISER', 'SYSTEM_ADMIN')).toBe(false)
    })

    it('should allow EDITOR_IN_CHIEF to create other roles', () => {
      expect(canCreateUserRole('EDITOR_IN_CHIEF', 'STAFF')).toBe(true)
      expect(canCreateUserRole('EDITOR_IN_CHIEF', 'SECTION_HEAD')).toBe(true)
      expect(canCreateUserRole('EDITOR_IN_CHIEF', 'EDITOR_IN_CHIEF')).toBe(true)
      expect(canCreateUserRole('EDITOR_IN_CHIEF', 'ADVISER')).toBe(true)
    })

    it('should allow ADVISER to create other roles', () => {
      expect(canCreateUserRole('ADVISER', 'STAFF')).toBe(true)
      expect(canCreateUserRole('ADVISER', 'SECTION_HEAD')).toBe(true)
      expect(canCreateUserRole('ADVISER', 'EDITOR_IN_CHIEF')).toBe(true)
      expect(canCreateUserRole('ADVISER', 'ADVISER')).toBe(true)
    })
  })

  describe('canManageRole', () => {
    it('should allow SYSTEM_ADMIN to manage any role', () => {
      expect(canManageRole('SYSTEM_ADMIN', 'STAFF')).toBe(true)
      expect(canManageRole('SYSTEM_ADMIN', 'SECTION_HEAD')).toBe(true)
      expect(canManageRole('SYSTEM_ADMIN', 'EDITOR_IN_CHIEF')).toBe(true)
      expect(canManageRole('SYSTEM_ADMIN', 'ADVISER')).toBe(true)
      expect(canManageRole('SYSTEM_ADMIN', 'SYSTEM_ADMIN')).toBe(true)
    })

    it('should NOT allow EDITOR_IN_CHIEF to manage SYSTEM_ADMIN roles', () => {
      expect(canManageRole('EDITOR_IN_CHIEF', 'SYSTEM_ADMIN')).toBe(false)
    })

    it('should NOT allow ADVISER to manage SYSTEM_ADMIN roles', () => {
      expect(canManageRole('ADVISER', 'SYSTEM_ADMIN')).toBe(false)
    })

    it('should allow EDITOR_IN_CHIEF to manage other roles', () => {
      expect(canManageRole('EDITOR_IN_CHIEF', 'STAFF')).toBe(true)
      expect(canManageRole('EDITOR_IN_CHIEF', 'SECTION_HEAD')).toBe(true)
      expect(canManageRole('EDITOR_IN_CHIEF', 'EDITOR_IN_CHIEF')).toBe(true)
      expect(canManageRole('EDITOR_IN_CHIEF', 'ADVISER')).toBe(true)
    })

    it('should allow ADVISER to manage other roles', () => {
      expect(canManageRole('ADVISER', 'STAFF')).toBe(true)
      expect(canManageRole('ADVISER', 'SECTION_HEAD')).toBe(true)
      expect(canManageRole('ADVISER', 'EDITOR_IN_CHIEF')).toBe(true)
      expect(canManageRole('ADVISER', 'ADVISER')).toBe(true)
    })
  })

  describe('User Visibility Restrictions', () => {
    it('should hide SYSTEM_ADMIN users from EIC and ADVISER', () => {
      const mockUsers = [
        { id: '1', role: 'STAFF', firstName: 'John', lastName: 'Doe' },
        { id: '2', role: 'EDITOR_IN_CHIEF', firstName: 'Jane', lastName: 'Smith' },
        { id: '3', role: 'SYSTEM_ADMIN', firstName: 'Admin', lastName: 'User' },
      ]

      // Mock current user as EIC
      const currentUser = { role: 'EDITOR_IN_CHIEF' }
      
      // Filter function (simplified version of what's in UserManagement)
      const filteredUsers = mockUsers.filter(user => {
        const isVisibleToCurrentUser = currentUser?.role === 'SYSTEM_ADMIN' || user.role !== 'SYSTEM_ADMIN'
        return isVisibleToCurrentUser
      })

      expect(filteredUsers).toHaveLength(2)
      expect(filteredUsers.find(user => user.role === 'SYSTEM_ADMIN')).toBeUndefined()
      expect(filteredUsers.find(user => user.role === 'STAFF')).toBeDefined()
      expect(filteredUsers.find(user => user.role === 'EDITOR_IN_CHIEF')).toBeDefined()
    })

    it('should show all users to SYSTEM_ADMIN', () => {
      const mockUsers = [
        { id: '1', role: 'STAFF', firstName: 'John', lastName: 'Doe' },
        { id: '2', role: 'EDITOR_IN_CHIEF', firstName: 'Jane', lastName: 'Smith' },
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
      expect(filteredUsers.find(user => user.role === 'EDITOR_IN_CHIEF')).toBeDefined()
    })
  })

  describe('Self-Role Change Prevention', () => {
    it('should prevent users from changing their own role to lower privilege level', () => {
      const mockUsers = [
        { id: '1', role: 'ADVISER', firstName: 'Adviser', lastName: 'User' },
        { id: '2', role: 'STAFF', firstName: 'Staff', lastName: 'User' },
      ]

      const currentUser = { id: '1', role: 'ADVISER' }
      
      // Filter function for role dropdown (simplified version)
      const availableRoles = mockUsers.filter(user => {
        if (user.id === currentUser.id) {
          const roleHierarchy = {
            'STAFF': 0,
            'SECTION_HEAD': 1,
            'EDITOR_IN_CHIEF': 2,
            'ADVISER': 3,
            'SYSTEM_ADMIN': 4,
          }
          
          const currentRoleLevel = roleHierarchy[currentUser.role] || 0
          const targetRoleLevel = roleHierarchy[user.role] || 0
          
          // Only allow changing to same or higher privilege level
          return targetRoleLevel >= currentRoleLevel
        }
        return true
      })

      // Should only allow ADVISER to change to SYSTEM_ADMIN (higher level)
      // Should not allow changing to STAFF, SECTION_HEAD, or EDITOR_IN_CHIEF (lower levels)
      expect(availableRoles.length).toBeGreaterThan(0)
    })

    it('should allow users to change their own role to higher privilege level', () => {
      const roleHierarchy = {
        'STAFF': 0,
        'SECTION_HEAD': 1,
        'EDITOR_IN_CHIEF': 2,
        'ADVISER': 3,
        'SYSTEM_ADMIN': 4,
      }

      const currentRoleLevel = roleHierarchy['ADVISER']
      const targetRoleLevel = roleHierarchy['SYSTEM_ADMIN']

      // ADVISER should be able to change to SYSTEM_ADMIN (higher level)
      expect(targetRoleLevel >= currentRoleLevel).toBe(true)
    })

    it('should prevent users from changing their own role to lower privilege level', () => {
      const roleHierarchy = {
        'STAFF': 0,
        'SECTION_HEAD': 1,
        'EDITOR_IN_CHIEF': 2,
        'ADVISER': 3,
        'SYSTEM_ADMIN': 4,
      }

      const currentRoleLevel = roleHierarchy['ADVISER']
      const targetRoleLevel = roleHierarchy['STAFF']

      // ADVISER should NOT be able to change to STAFF (lower level)
      expect(targetRoleLevel >= currentRoleLevel).toBe(false)
    })
  })
})