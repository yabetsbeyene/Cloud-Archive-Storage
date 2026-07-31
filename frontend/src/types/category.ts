export interface CategorySummary {
  categoryId: string
  name: string
}

export interface Category {
  categoryId: string
  name: string
  description: string | null
  parentCategory: CategorySummary | null
  retentionPeriodMonths: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryInput {
  name: string
  description?: string
  parentCategoryId?: string
  retentionPeriodMonths?: number
}

export type UpdateCategoryInput = CreateCategoryInput
