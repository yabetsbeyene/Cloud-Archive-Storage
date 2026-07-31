export type Role = 'ADMIN' | 'ARCHIVIST' | 'MANAGER' | 'DEPT_USER' | 'VIEWER'

export interface AuthUser {
  sub: string
  email: string
  name: string
  username: string
  roles: Role[]
}

export interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  initializationError: string | null
  user: AuthUser | null
  token: string | undefined
  hasRole: (role: Role) => boolean
  login: () => void
  logout: () => void
  refreshUser: () => Promise<void>
}
