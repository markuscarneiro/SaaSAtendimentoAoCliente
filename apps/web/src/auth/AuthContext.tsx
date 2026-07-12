import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  organization: { id: string; name: string }
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    navigate('/login', { replace: true })
  }, [clearSession, navigate])

  // Hydrate session on mount — validates existing token via GET /me
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    api
      .get<{ data: { user: { id: string; name: string; email: string }; organization: { id: string; name: string }; role: string; permissions: string[] } }>('/api/v1/me')
      .then((res) => {
        setUser({
          ...res.data.user,
          role: res.data.role,
          permissions: res.data.permissions,
          organization: res.data.organization,
        })
      })
      .catch(() => {
        clearSession()
      })
      .finally(() => {
        setLoading(false)
      })
  }, [clearSession])

  // Global 401 handler — any API call can trigger session expiry
  useEffect(() => {
    const handler = () => {
      clearSession()
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:expired', handler)
    return () => window.removeEventListener('auth:expired', handler)
  }, [clearSession, navigate])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{
        data: {
          accessToken: string
          user: { id: string; name: string; email: string }
          organization: { id: string; name: string }
          role: string
        }
      }>('/api/v1/auth/login', { email, password })

      localStorage.setItem('token', res.data.accessToken)

      const me = await api.get<{
        data: {
          user: { id: string; name: string; email: string }
          organization: { id: string; name: string }
          role: string
          permissions: string[]
        }
      }>('/api/v1/me')

      setUser({
        ...me.data.user,
        role: me.data.role,
        permissions: me.data.permissions,
        organization: me.data.organization,
      })

      navigate('/', { replace: true })
    },
    [navigate],
  )

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
