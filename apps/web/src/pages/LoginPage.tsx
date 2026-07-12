import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else {
        setError('Email ou senha inválidos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Atendimento ao Cliente</h1>
        <p style={styles.subtitle}>Acesse sua conta</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={styles.input}
              disabled={loading}
            />
          </label>

          <label style={styles.label}>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={styles.input}
              disabled={loading}
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: 'sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: '2rem',
    width: 360,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 4px',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111',
  },
  subtitle: {
    margin: '0 0 1.5rem',
    color: '#666',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#333',
  },
  input: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: '0.9rem',
    outline: 'none',
  },
  error: {
    margin: 0,
    color: '#c0392b',
    fontSize: '0.85rem',
    background: '#fdecea',
    padding: '0.5rem 0.75rem',
    borderRadius: 4,
  },
  button: {
    padding: '0.6rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
} satisfies Record<string, React.CSSProperties>
