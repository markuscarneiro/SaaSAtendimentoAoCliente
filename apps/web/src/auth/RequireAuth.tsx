import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={styles.center}>
        <span>Carregando...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

const styles = {
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
    color: '#666',
  },
} satisfies Record<string, React.CSSProperties>
