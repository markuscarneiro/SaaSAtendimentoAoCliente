import { useEffect, useState, useCallback } from 'react'
import { api, ApiError } from '../lib/api'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface ByAgent {
  userId: string
  assignedConversations: number
  messagesSent: number
}

interface Overview {
  conversationsTotal: number
  openConversations: number
  resolvedConversations: number
  closedConversations: number
  messagesTotal: number
  avgFirstResponseSeconds: number
  byAgent: ByAgent[]
}

interface OverviewMeta {
  from: string
  to: string
}

interface Member {
  id: string
  name: string
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days: number, from: string): string {
  const d = new Date(`${from}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return '—'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem > 0 ? `${hours}h ${rem}min` : `${hours}h`
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function AnalyticsPage() {
  const defaultTo = todayISO()
  const defaultFrom = daysAgoISO(30, defaultTo)

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [data, setData] = useState<Overview | null>(null)
  const [meta, setMeta] = useState<OverviewMeta | null>(null)
  const [members, setMembers] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ data: Member[] }>('/api/v1/users?pageSize=100')
      .then((res) => setMembers(new Map(res.data.map((m) => [m.id, m.name]))))
      .catch(() => {
        // Non-fatal: byAgent rows fall back to raw userId
      })
  }, [])

  const fetchOverview = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get<{ data: Overview; meta: OverviewMeta }>(
        `/api/v1/analytics/overview?from=${from}&to=${to}`,
      )
      .then((res) => {
        setData(res.data)
        setMeta(res.meta)
      })
      .catch((err) => {
        const msg =
          err instanceof ApiError && err.status === 400
            ? 'Período inválido: a data inicial deve ser anterior ou igual à final.'
            : 'Erro ao carregar métricas.'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [from, to])

  useEffect(() => { fetchOverview() }, [fetchOverview])

  return (
    <div>
      <div style={styles.topBar}>
        <h2 style={styles.title}>Analytics</h2>
        <div style={styles.filters}>
          <label style={styles.filterLabel}>
            De
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={styles.dateInput}
              disabled={loading}
            />
          </label>
          <label style={styles.filterLabel}>
            Até
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={styles.dateInput}
              disabled={loading}
            />
          </label>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <span>{error}</span>
          <button onClick={fetchOverview} style={styles.retryBtn}>Tentar novamente</button>
        </div>
      )}

      {loading && !error && (
        <div style={styles.center}><span style={{ color: '#888' }}>Carregando...</span></div>
      )}

      {!loading && !error && data && (
        <>
          {meta && (
            <p style={styles.periodInfo}>
              Período: {meta.from} a {meta.to}
            </p>
          )}

          {data.conversationsTotal === 0 ? (
            <div style={styles.center}>
              <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                Nenhuma conversa criada neste período.
              </p>
            </div>
          ) : (
            <>
              <div style={styles.cardsGrid}>
                <MetricCard label="Total de conversas" value={data.conversationsTotal} />
                <MetricCard label="Abertas" value={data.openConversations} accent="#1d4ed8" />
                <MetricCard label="Resolvidas" value={data.resolvedConversations} accent="#15803d" />
                <MetricCard label="Fechadas" value={data.closedConversations} accent="#374151" />
                <MetricCard label="Mensagens" value={data.messagesTotal} />
                <MetricCard
                  label="Tempo médio 1ª resposta"
                  value={formatDuration(data.avgFirstResponseSeconds)}
                  isText
                />
              </div>

              <h3 style={styles.sectionTitle}>Volume por atendente</h3>
              {data.byAgent.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '0.875rem' }}>
                  Nenhuma conversa atribuída ou mensagem enviada por atendentes neste período.
                </p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Atendente</th>
                        <th style={styles.th}>Conversas atribuídas</th>
                        <th style={styles.th}>Mensagens enviadas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byAgent.map((row) => (
                        <tr key={row.userId} style={styles.tr}>
                          <td style={styles.td}>{members.get(row.userId) ?? row.userId}</td>
                          <td style={styles.td}>{row.assignedConversations}</td>
                          <td style={styles.td}>{row.messagesSent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  accent,
  isText,
}: {
  label: string
  value: number | string
  accent?: string
  isText?: boolean
}) {
  return (
    <div style={styles.card}>
      <span style={styles.cardLabel}>{label}</span>
      <span style={{ ...styles.cardValue, ...(accent ? { color: accent } : {}), ...(isText ? { fontSize: '1.25rem' } : {}) }}>
        {value}
      </span>
    </div>
  )
}

// ----------------------------------------------------------------
// Styles
// ----------------------------------------------------------------
const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111',
  },
  filters: {
    display: 'flex',
    gap: '0.75rem',
  },
  filterLabel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
  },
  dateInput: {
    padding: '0.35rem 0.5rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: '0.8rem',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: '#fdecea',
    color: '#c0392b',
    padding: '0.75rem 1rem',
    borderRadius: 4,
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  retryBtn: {
    padding: '0.3rem 0.75rem',
    background: '#fff',
    border: '1px solid #c0392b',
    borderRadius: 4,
    color: '#c0392b',
    cursor: 'pointer',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap' as const,
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
  },
  periodInfo: {
    color: '#888',
    fontSize: '0.8rem',
    margin: '0 0 1rem',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.75rem',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.35rem',
  },
  cardLabel: {
    fontSize: '0.75rem',
    color: '#888',
    fontWeight: 500,
  },
  cardValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#111',
  },
  sectionTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#111',
    margin: '0 0 0.75rem',
  },
  tableWrapper: {
    background: '#fff',
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.875rem',
  },
  th: {
    textAlign: 'left' as const,
    padding: '0.65rem 1rem',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
    color: '#374151',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '0.7rem 1rem',
    color: '#111',
  },
} satisfies Record<string, React.CSSProperties>
