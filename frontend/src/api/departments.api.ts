import { api } from './axios'
import type { Department, CreateDepartmentInput, UpdateDepartmentInput } from '@/types/department'

export const departmentsApi = {
  list: () => api.get<Department[]>('/departments').then((r) => r.data),
  get: (id: string) => api.get<Department>(`/departments/${id}`).then((r) => r.data),
  create: (input: CreateDepartmentInput) =>
    api.post<Department>('/departments', input).then((r) => r.data),
  update: (id: string, input: UpdateDepartmentInput) =>
    api.put<Department>(`/departments/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/departments/${id}`).then(() => undefined),
}