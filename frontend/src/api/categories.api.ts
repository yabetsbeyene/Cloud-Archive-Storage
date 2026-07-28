import { api } from './axios'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category'

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories').then((r) => r.data),
  get: (id: string) => api.get<Category>(`/categories/${id}`).then((r) => r.data),
  create: (input: CreateCategoryInput) =>
    api.post<Category>('/categories', input).then((r) => r.data),
  update: (id: string, input: UpdateCategoryInput) =>
    api.put<Category>(`/categories/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/categories/${id}`).then(() => undefined),
}
