import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function DashboardShell() {
  const { user, logout } = useAuth()

  return (
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.brand}>Atendimento</div>
        <ul style={styles.navList}>
          <li>
            <NavLink to="/conversations" style={navStyle} end>
              Conversas
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" style={navStyle}>
              Analytics
            </NavLink>
          </li>
        </ul>
      </nav>

      <div style={styles.main}>
        <header style={styles.header}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={styles.orgName}>{user?.organization.name}</span>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>
            Sair
          </button>
        </header>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function navStyle({ isActive }: { isActive: boolean }): React.CSSProperties {
  return {
    display: 'block',
    padding: '0.6rem 1rem',
    borderRadius: 4,
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: isActive ? '#2563eb' : '#555',
    background: isActive ? '#eff6ff' : 'transparent',
  }
}

const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'sans-serif',
  },
  sidebar: {
    width: 200,
    background: '#fff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '1rem 0.75rem',
  },
  brand: {
    fontWeight: 700,
    fontSize: '1rem',
    color: '#111',
    padding: '0 0.25rem 1rem',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '0.75rem',
  },
  navList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    background: '#f9fafb',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  userName: {
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#111',
  },
  orgName: {
    fontSize: '0.75rem',
    color: '#888',
  },
  logoutBtn: {
    padding: '0.4rem 0.9rem',
    background: 'transparent',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: '0.85rem',
    cursor: 'pointer',
    color: '#555',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem',
  },
} satisfies Record<string, React.CSSProperties>
