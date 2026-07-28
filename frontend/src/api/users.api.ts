import { api } from './axios'
import type { AppUser, CreateUserInput, UpdateUserInput } from '@/types/user'

export const usersApi = {
  list: () => api.get<AppUser[]>('/users').then((r) => r.data),
  get: (sub: string) => api.get<AppUser>(`/users/${sub}`).then((r) => r.data),
  create: (input: CreateUserInput) => api.post<AppUser>('/users', input).then((r) => r.data),
  update: (sub: string, input: UpdateUserInput) =>
    api.put<AppUser>(`/users/${sub}`, input).then((r) => r.data),
  remove: (sub: string) => api.delete(`/users/${sub}`).then(() => undefined),
}