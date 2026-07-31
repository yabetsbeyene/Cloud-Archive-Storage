import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { accountApi } from '@/api/account.api'
import { useAuth } from '@/features/auth/auth-context'
import {
  ThemeContext,
  type ThemePreference,
} from '@/features/theme/theme-context'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function fromApi(preference: 'LIGHT' | 'DARK' | 'SYSTEM'): ThemePreference {
  return preference.toLowerCase() as ThemePreference
}

function toApi(preference: ThemePreference): 'LIGHT' | 'DARK' | 'SYSTEM' {
  return preference.toUpperCase() as 'LIGHT' | 'DARK' | 'SYSTEM'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeUser = useRef<string | null>(null)
  const resolvedTheme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemTheme(query.matches ? 'dark' : 'light')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    const userId = user?.sub ?? null
    activeUser.current = userId
    setError(null)
    if (!isAuthenticated || !userId) {
      setPreferenceState('system')
      return
    }

    accountApi
      .get()
      .then((profile) => {
        if (activeUser.current === userId) {
          setPreferenceState(fromApi(profile.themePreference))
        }
      })
      .catch(() => {
        if (activeUser.current === userId) {
          setError('Your saved theme could not be loaded.')
        }
      })
  }, [isAuthenticated, user?.sub])

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      isSaving,
      error,
      setPreference: (next: ThemePreference) => {
        if (!user?.sub || next === preference) return
        const previous = preference
        setPreferenceState(next)
        setIsSaving(true)
        setError(null)
        accountApi
          .updateTheme(toApi(next))
          .then((profile) => {
            if (activeUser.current === user.sub) {
              setPreferenceState(fromApi(profile.themePreference))
            }
          })
          .catch(() => {
            if (activeUser.current === user.sub) {
              setPreferenceState(previous)
              setError('The theme could not be saved. Try again.')
            }
          })
          .finally(() => {
            if (activeUser.current === user.sub) {
              setIsSaving(false)
            }
          })
      },
    }),
    [error, isSaving, preference, resolvedTheme, user?.sub],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
