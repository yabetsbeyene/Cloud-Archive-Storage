import axios from 'axios'
import keycloak from '@/features/auth/keycloak'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Attach the current access token to every outgoing request.
// The person calling api.get(...) never has to think about tokens at all.
api.interceptors.request.use(async (config) => {
  if (keycloak.token) {
    // Refresh if the token is within 10s of expiring, so we never send a stale one
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

// If the backend ever returns 401 (token rejected for any reason), send the
// person back through Keycloak login rather than showing a broken page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      void keycloak.login()
    }
    return Promise.reject(error)
  },
)
