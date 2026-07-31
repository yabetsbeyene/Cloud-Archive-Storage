import axios from 'axios'
import type { ApiError } from '@/types/apiError'

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiError>(error)) return fallback
  return error.response?.data?.message || fallback
}
