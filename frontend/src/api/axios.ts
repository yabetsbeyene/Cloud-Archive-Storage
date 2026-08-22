import axios from 'axios'
import keycloak from '@/features/auth/keycloak'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use(async (config) => {
  if (keycloak.token) {
    try {
      await keycloak.updateToken(10)
    } catch {
      await keycloak.login()
      throw new Error('Authentication session expired')
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      void keycloak.login()
    }
    return Promise.reject(error)
  },
)
