import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext } from '@/features/auth/auth-context'
import keycloak from '@/features/auth/keycloak'
import type { AuthUser, Role } from '@/features/auth/types'

const applicationRoles = new Set<Role>(['ADMIN', 'ARCHIVIST', 'MANAGER', 'DEPT_USER', 'VIEWER'])

let keycloakInitialization: Promise<boolean> | undefined

function initializeKeycloak(): Promise<boolean> {
  keycloakInitialization ??= keycloak.init({
    onLoad: 'check-sso',
    checkLoginIframe: false,
    pkceMethod: 'S256',
  })

  return keycloakInitialization
}

interface KeycloakTokenParsed {
  sub?: string
  email?: string
  name?: string
  preferred_username?: string
  realm_access?: { roles?: string[] }
}

function buildUserFromToken(): AuthUser | null {
  const parsed = keycloak.tokenParsed as KeycloakTokenParsed | undefined
  if (!parsed) return null

  return {
    sub: parsed.sub ?? '',
    email: parsed.email ?? '',
    name: parsed.name ?? parsed.preferred_username ?? '',
    username: parsed.preferred_username ?? '',
    roles: (parsed.realm_access?.roles ?? []).filter(
      (role): role is Role => applicationRoles.has(role as Role),
    ),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | undefined>(undefined)

  useEffect(() => {
    let isActive = true

    // Reuse one initialization promise so React StrictMode cannot initialize
    // the singleton Keycloak client twice during development.
    initializeKeycloak()
      .then((authenticated) => {
        if (!isActive) return
        setIsAuthenticated(authenticated)
        setUser(authenticated ? buildUserFromToken() : null)
        setToken(keycloak.token)
        setInitializationError(null)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Keycloak init failed', err)
        if (!isActive) return
        setInitializationError(
          'Authentication is unavailable. Check that Keycloak is running, then reload the page.',
        )
        setIsLoading(false)
      })

    const handleTokenExpired = async () => {
      try {
        const refreshed = await keycloak.updateToken(30)
        if (isActive && refreshed) {
          setToken(keycloak.token)
        }
      } catch {
        await keycloak.login()
      }
    }

    keycloak.onTokenExpired = handleTokenExpired

    return () => {
      isActive = false
      if (keycloak.onTokenExpired === handleTokenExpired) {
        keycloak.onTokenExpired = undefined
      }
    }
  }, [])

  const login = () => {
    void keycloak.login()
  }
  const logout = () => {
    void keycloak.logout({ redirectUri: window.location.origin })
  }
  const refreshUser = async () => {
    await keycloak.updateToken(-1)
    setToken(keycloak.token)
    setUser(buildUserFromToken())
  }
  const hasRole = (role: Role) => user?.roles.includes(role) ?? false

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        initializationError,
        user,
        token,
        hasRole,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
