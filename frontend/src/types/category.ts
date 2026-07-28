export interface Category {
  categoryId: string
  name: string
  description: string | null
  parentCategory: Category | null
  retentionPeriodMonths: number | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  deletedAt: string | null
  deletedBy: string | null
}

export interface CreateCategoryInput {
  name: string
  description?: string
  retentionPeriodMonths?: number
}

export type UpdateCategoryInput = CreateCategoryInput
