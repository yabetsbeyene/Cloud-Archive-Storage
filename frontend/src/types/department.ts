export interface Department {
  departmentId: string
  name: string
  description: string | null
  parentDepartment: Department | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  deletedAt: string | null
  deletedBy: string | null
}

export interface CreateDepartmentInput {
  name: string
  description?: string
}

export type UpdateDepartmentInput = CreateDepartmentInput