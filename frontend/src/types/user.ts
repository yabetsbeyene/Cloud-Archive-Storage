import type { Department } from './department'

export interface AppUser {
  userSub: string
  fullName: string
  email: string
  department: Department | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  deletedBy: string | null
}

export interface CreateUserInput {
  userSub: string
  fullName: string
  email: string
  departmentId?: string
  isActive?: boolean
}

export interface UpdateUserInput {
  fullName: string
  email: string
  departmentId?: string
}