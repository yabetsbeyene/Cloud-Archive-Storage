import { api } from './axios'
import type { Dashboard } from '@/types/dashboard'

export const dashboardApi = {
  get: () => api.get<Dashboard>('/dashboard').then((response) => response.data),
}
