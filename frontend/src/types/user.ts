import type { DepartmentSummary } from './department'
import type { Role } from '@/features/auth/types'

export interface AppUser {
  userSub: string
  username: string
  fullName: string
  email: string
  department: DepartmentSummary | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AccountProfile {
  username: string
  fullName: string
  email: string
  role: Role
  department: DepartmentSummary | null
  themePreference: 'LIGHT' | 'DARK' | 'SYSTEM'
}

export interface UpdateAccountProfileInput {
  username: string
  fullName: string
  email: string
}

export interface ChangePasswordInput {
  newPassword: string
  confirmPassword: string
}

export interface ManagedUser {
  userSub: string
  username: string
  fullName: string
  email: string
  role: Role
  department: DepartmentSummary | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateUserInput {
  username: string
  fullName: string
  email: string
  temporaryPassword: string
  role: Role
  departmentId?: string
  isActive?: boolean
}

export interface UpdateUserInput {
  fullName: string
  email: string
  role: Role
  departmentId?: string
  isActive: boolean
}
