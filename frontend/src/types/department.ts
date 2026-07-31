export interface DepartmentSummary {
  departmentId: string
  name: string
}

export interface Department {
  departmentId: string
  name: string
  description: string | null
  parentDepartment: DepartmentSummary | null
  createdAt: string
  updatedAt: string
}

export interface CreateDepartmentInput {
  name: string
  description?: string
  parentDepartmentId?: string
}

export type UpdateDepartmentInput = CreateDepartmentInput
