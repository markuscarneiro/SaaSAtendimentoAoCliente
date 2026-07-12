import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface Customer {
  id: string
  name: string
  email: string | null
}

interface Conversation {
  id: string
  status: string
  subject: string | null
  channel: string
  assignedUserId: string | null
  lastMessageAt: string | null
  createdAt: string
  customer: Customer
}

interface ListMeta {
  page: number
  pageSize: number
  total: number
}

interface Member {
  id: string
  name: string
}

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const STATUS_LABELS: Record<string, string> = {
  open: 'Aberta',
  waiting_agent: 'Ag. agente',
  waiting_customer: 'Ag. cliente',
  resolved: 'Resolvida',
  closed: 'Fechada',
}

const STATUS_COLORS: Record<string, React.CSSProperties> = {
  open: { background: '#dbeafe', color: '#1d4ed8' },
  waiting_agent: { background: '#ffedd5', color: '#c2410c' },
  waiting_customer: { background: '#fef9c3', color: '#854d0e' },
  resolved: { background: '#dcfce7', color: '#15803d' },
  closed: { background: '#f3f4f6', color: '#374151' },
}

const PAGE_SIZE = 20

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [meta, setMeta] = useState<ListMeta>({ page: 1, pageSize: PAGE_SIZE, total: 0 })
  const [members, setMembers] = useState<Map<string, string>>(new Map())
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users once to build ID→name map
  useEffect(() => {
    api
      .get<{ data: Member[] }>('/api/v1/users?pageSize=100')
      .then((res) => {
        setMembers(new Map(res.data.map((m) => [m.id, m.name])))
      })
      .catch(() => {
        // Non-fatal: assignedUserId will show as ID if map is empty
      })
  }, [])

  const fetchConversations = useCallback(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    })
    if (statusFilter) params.set('status', statusFilter)

    api
      .get<{ data: Conversation[]; meta: ListMeta }>(`/api/v1/conversations?${params}`)
      .then((res) => {
        setConversations(res.data)
        setMeta(res.meta)
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : 'Erro ao carregar conversas.'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Reset to page 1 when filter changes
  function handleStatusChange(value: string) {
    setStatusFilter(value)
    setPage(1)
  }

  const totalPages = Math.ceil(meta.total / PAGE_SIZE) || 1

  return (
    <div>
      <div style={styles.topBar}>
        <h2 style={styles.title}>Conversas</h2>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={styles.select}
          disabled={loading}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div style={styles.errorBox}>
          <span>{error}</span>
          <button onClick={fetchConversations} style={styles.retryBtn}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div style={styles.center}>
          <span style={{ color: '#888' }}>Carregando...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && conversations.length === 0 && (
        <div style={styles.center}>
          <p style={styles.emptyText}>
            {statusFilter
              ? `Nenhuma conversa com status "${STATUS_LABELS[statusFilter] ?? statusFilter}".`
              : 'Nenhuma conversa encontrada. Crie a primeira conversa para começar.'}
          </p>
        </div>
      )}

      {/* List */}
      {!loading && !error && conversations.length > 0 && (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Assunto</th>
                  <th style={styles.th}>Última mensagem</th>
                  <th style={styles.th}>Responsável</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => (
                  <tr key={conv.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(STATUS_COLORS[conv.status] ?? {}) }}>
                        {STATUS_LABELS[conv.status] ?? conv.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.customerName}>{conv.customer.name}</span>
                      {conv.customer.email && (
                        <span style={styles.customerEmail}>{conv.customer.email}</span>
                      )}
                    </td>
                    <td style={styles.td}>{conv.subject ?? <span style={styles.muted}>—</span>}</td>
                    <td style={styles.td} title={conv.lastMessageAt ?? undefined}>
                      {formatDate(conv.lastMessageAt)}
                    </td>
                    <td style={styles.td}>
                      {conv.assignedUserId
                        ? (members.get(conv.assignedUserId) ?? conv.assignedUserId.slice(0, 8) + '…')
                        : <span style={styles.muted}>Não atribuído</span>}
                    </td>
                    <td style={styles.td}>
                      <Link to={`/conversations/${conv.id}`} style={styles.viewLink}>
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={styles.pagination}>
            <span style={styles.paginationInfo}>
              Página {meta.page} de {totalPages} &middot; {meta.total} conversa{meta.total !== 1 ? 's' : ''}
            </span>
            <div style={styles.paginationButtons}>
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                style={styles.pageBtn}
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                style={styles.pageBtn}
              >
                Próxima →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// Styles
// ----------------------------------------------------------------
const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111',
  },
  select: {
    padding: '0.4rem 0.75rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: '0.875rem',
    background: '#fff',
    cursor: 'pointer',
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
  emptyText: {
    color: '#888',
    fontSize: '0.9rem',
    textAlign: 'center' as const,
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
    verticalAlign: 'top' as const,
  },
  badge: {
    display: 'inline-block',
    padding: '0.2rem 0.55rem',
    borderRadius: 12,
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  customerName: {
    display: 'block',
    fontWeight: 500,
  },
  customerEmail: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#888',
  },
  muted: {
    color: '#aaa',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '1rem',
    fontSize: '0.875rem',
  },
  paginationInfo: {
    color: '#666',
  },
  paginationButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  pageBtn: {
    padding: '0.4rem 0.9rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: '#374151',
  },
  viewLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, React.CSSProperties>
