import { api } from './axios'
import type { AppUser, CreateUserInput, ManagedUser, UpdateUserInput } from '@/types/user'

export const usersApi = {
  me: () => api.get<AppUser>('/users/me').then((r) => r.data),
  list: () => api.get<ManagedUser[]>('/users').then((r) => r.data),
  get: (sub: string) => api.get<ManagedUser>(`/users/${sub}`).then((r) => r.data),
  create: (input: CreateUserInput) => api.post<ManagedUser>('/users', input).then((r) => r.data),
  update: (sub: string, input: UpdateUserInput) =>
    api.put<ManagedUser>(`/users/${sub}`, input).then((r) => r.data),
  remove: (sub: string) => api.delete(`/users/${sub}`).then(() => undefined),
}
