import { useEffect, useState, useCallback, useRef, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface Customer {
  id: string
  name: string
  email: string | null
}

interface ConversationHeader {
  id: string
  status: string
  subject: string | null
  assignedUserId: string | null
  customer: Customer
}

interface Message {
  id: string
  conversationId: string
  authorType: string
  authorId: string | null
  content: string
  createdAt: string
}

interface PageMeta {
  page: number
  pageSize: number
  total: number
}

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const PAGE_SIZE = 20

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

const AUTHOR_LABELS: Record<string, string> = {
  agent: 'Agente',
  customer: 'Cliente',
  system: 'Sistema',
}

// Mirrors backend VALID_TRANSITIONS (conversation-history-spec §4.0.1) — UX hint only.
// The backend is the source of truth and re-validates on PATCH (409 on invalid transition).
const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ['waiting_agent', 'waiting_customer', 'resolved'],
  waiting_agent: ['waiting_customer', 'resolved'],
  waiting_customer: ['waiting_agent', 'resolved'],
  resolved: ['closed', 'open'],
  closed: ['open'],
}

interface Member {
  id: string
  name: string
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function formatTime(iso: string): string {
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
export function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [conv, setConv] = useState<ConversationHeader | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [meta, setMeta] = useState<PageMeta>({ page: 1, pageSize: PAGE_SIZE, total: 0 })
  const [page, setPage] = useState(1)

  const [loadingHeader, setLoadingHeader] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  const [msgContent, setMsgContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const [members, setMembers] = useState<Member[]>([])
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  const canManage = user?.permissions.includes('conversations.manage') ?? false

  // Fetch assignable members once (UX only — final authorization is the backend's)
  useEffect(() => {
    if (!canManage) return
    api
      .get<{ data: Member[] }>('/api/v1/users?pageSize=100')
      .then((res) => setMembers(res.data))
      .catch(() => {
        // Non-fatal: assignment select just shows fewer options
      })
  }, [canManage])

  // Fetch conversation header
  const fetchHeader = useCallback(() => {
    if (!id) return
    setLoadingHeader(true)
    setHeaderError(null)
    api
      .get<{ data: ConversationHeader }>(`/api/v1/conversations/${id}`)
      .then((res) => setConv(res.data))
      .catch((err) => {
        const msg = err instanceof ApiError && err.status === 404
          ? 'Conversa não encontrada.'
          : 'Erro ao carregar conversa.'
        setHeaderError(msg)
      })
      .finally(() => setLoadingHeader(false))
  }, [id])

  // Fetch paginated messages
  const fetchMessages = useCallback(() => {
    if (!id) return
    setLoadingMessages(true)
    setMessagesError(null)
    api
      .get<{ data: Message[]; meta: PageMeta }>(
        `/api/v1/conversations/${id}/messages?page=${page}&pageSize=${PAGE_SIZE}`,
      )
      .then((res) => {
        setMessages(res.data)
        setMeta(res.meta)
      })
      .catch((err) => {
        const msg = err instanceof ApiError ? err.message : 'Erro ao carregar mensagens.'
        setMessagesError(msg)
      })
      .finally(() => setLoadingMessages(false))
  }, [id, page])

  useEffect(() => { fetchHeader() }, [fetchHeader])
  useEffect(() => { fetchMessages() }, [fetchMessages])

  // Scroll to bottom only on the last page after fresh load
  const totalPages = Math.ceil(meta.total / PAGE_SIZE) || 1
  useEffect(() => {
    if (page === totalPages && !loadingMessages) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loadingMessages, page, totalPages])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!id || !msgContent.trim()) return
    setSending(true)
    setSendError(null)
    try {
      await api.post(`/api/v1/conversations/${id}/messages`, {
        authorType: 'agent',
        content: msgContent.trim(),
        // authorId must NOT be sent — derived by backend (api-contract §6.3)
      })
      setMsgContent('')
      // Refresh messages and jump to last page
      const newMeta = await api.get<{ data: Message[]; meta: PageMeta }>(
        `/api/v1/conversations/${id}/messages?page=1&pageSize=${PAGE_SIZE}`,
      )
      const lastPage = Math.ceil(newMeta.meta.total / PAGE_SIZE) || 1
      if (lastPage !== page) {
        setPage(lastPage) // triggers fetchMessages via effect
      } else {
        // Already on last page — just refresh
        fetchMessages()
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSendError('Esta conversa está fechada e não aceita novas mensagens.')
      } else {
        setSendError('Erro ao enviar mensagem. Tente novamente.')
      }
    } finally {
      setSending(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!id || !conv) return
    setUpdating(true)
    setUpdateError(null)
    try {
      const res = await api.patch<{ data: { status: string; assignedUserId: string | null } }>(
        `/api/v1/conversations/${id}`,
        { status: newStatus },
      )
      setConv({ ...conv, status: res.data.status, assignedUserId: res.data.assignedUserId })
    } catch (err) {
      setUpdateError(
        err instanceof ApiError && err.status === 409
          ? 'Transição de status inválida.'
          : 'Erro ao atualizar status. Tente novamente.',
      )
    } finally {
      setUpdating(false)
    }
  }

  async function handleAssigneeChange(userId: string) {
    if (!id || !conv) return
    setUpdating(true)
    setUpdateError(null)
    try {
      const res = await api.patch<{ data: { status: string; assignedUserId: string | null } }>(
        `/api/v1/conversations/${id}`,
        { assignedUserId: userId || null },
      )
      setConv({ ...conv, status: res.data.status, assignedUserId: res.data.assignedUserId })
    } catch (err) {
      setUpdateError(
        err instanceof ApiError && err.status === 404
          ? 'Usuário não encontrado na organização.'
          : 'Erro ao atualizar responsável. Tente novamente.',
      )
    } finally {
      setUpdating(false)
    }
  }

  const isClosed = conv?.status === 'closed'

  // ---- Render ----

  if (loadingHeader) {
    return <div style={styles.center}><span style={{ color: '#888' }}>Carregando...</span></div>
  }

  if (headerError) {
    return (
      <div style={styles.center}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#c0392b', marginBottom: '0.75rem' }}>{headerError}</p>
          <button onClick={() => navigate('/conversations')} style={styles.backBtn}>
            ← Voltar para conversas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/conversations')} style={styles.backBtn}>
          ← Voltar
        </button>
        <div style={styles.headerInfo}>
          <h2 style={styles.subject}>
            {conv?.subject ?? <span style={{ color: '#888', fontWeight: 400 }}>Sem assunto</span>}
          </h2>
          <div style={styles.headerMeta}>
            <span style={{ fontWeight: 500 }}>{conv?.customer.name}</span>
            {conv?.customer.email && (
              <span style={{ color: '#888', fontSize: '0.85rem' }}>&nbsp;·&nbsp;{conv.customer.email}</span>
            )}
            {!canManage && (
              <span style={{ marginLeft: '0.75rem' }}>
                <span style={{ ...styles.badge, ...(STATUS_COLORS[conv?.status ?? ''] ?? {}) }}>
                  {STATUS_LABELS[conv?.status ?? ''] ?? conv?.status}
                </span>
              </span>
            )}
          </div>
        </div>

        {canManage && conv && (
          <div style={styles.controls}>
            <label style={styles.controlLabel}>
              Status
              <select
                value={conv.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                style={styles.controlSelect}
              >
                <option value={conv.status}>{STATUS_LABELS[conv.status] ?? conv.status}</option>
                {(VALID_TRANSITIONS[conv.status] ?? []).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>
            </label>

            <label style={styles.controlLabel}>
              Responsável
              <select
                value={conv.assignedUserId ?? ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                disabled={updating}
                style={styles.controlSelect}
              >
                <option value="">Não atribuído</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {updateError && (
        <div style={styles.updateErrorBox}>
          <span>{updateError}</span>
          <button onClick={() => setUpdateError(null)} style={styles.dismissBtn}>×</button>
        </div>
      )}

      {/* Message area */}
      <div style={styles.messageArea}>
        {/* Pagination — top */}
        {!loadingMessages && !messagesError && meta.total > 0 && (
          <div style={styles.pagBar}>
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              style={styles.pageBtn}
            >
              ← Anteriores
            </button>
            <span style={styles.pagInfo}>
              Página {meta.page} de {totalPages} &middot; {meta.total} mensagem{meta.total !== 1 ? 'ns' : ''}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              style={styles.pageBtn}
            >
              Próximas →
            </button>
          </div>
        )}

        {/* Loading messages */}
        {loadingMessages && (
          <div style={styles.center}><span style={{ color: '#888' }}>Carregando mensagens...</span></div>
        )}

        {/* Messages error */}
        {messagesError && !loadingMessages && (
          <div style={styles.errorBox}>
            <span>{messagesError}</span>
            <button onClick={fetchMessages} style={styles.retryBtn}>Tentar novamente</button>
          </div>
        )}

        {/* Empty state */}
        {!loadingMessages && !messagesError && messages.length === 0 && (
          <div style={styles.center}>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Nenhuma mensagem ainda. Envie a primeira abaixo.</p>
          </div>
        )}

        {/* Messages list */}
        {!loadingMessages && !messagesError && messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.messageBubble,
              ...(msg.authorType === 'agent' ? styles.bubbleAgent : styles.bubbleOther),
            }}
          >
            <div style={styles.bubbleHeader}>
              <span style={styles.authorLabel}>{AUTHOR_LABELS[msg.authorType] ?? msg.authorType}</span>
              <span style={styles.msgTime}>{formatTime(msg.createdAt)}</span>
            </div>
            {/* Content rendered as plain text — never innerHTML (spec §4.1) */}
            <pre style={styles.msgContent}>{msg.content}</pre>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Send form */}
      <form onSubmit={handleSend} style={styles.sendForm}>
        {isClosed && (
          <p style={styles.closedNotice}>
            Esta conversa está fechada. Altere o status para enviar mensagens.
          </p>
        )}
        {sendError && <p style={styles.sendError}>{sendError}</p>}
        <div style={styles.sendRow}>
          <textarea
            value={msgContent}
            onChange={(e) => setMsgContent(e.target.value)}
            placeholder={isClosed ? 'Conversa fechada' : 'Digite sua mensagem...'}
            disabled={isClosed || sending}
            rows={3}
            style={styles.textarea}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend(e as unknown as FormEvent)
              }
            }}
          />
          <button
            type="submit"
            disabled={isClosed || sending || !msgContent.trim()}
            style={styles.sendBtn}
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        <p style={styles.hint}>Enter para enviar · Shift+Enter para nova linha</p>
      </form>
    </div>
  )
}

// ----------------------------------------------------------------
// Styles
// ----------------------------------------------------------------
const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    gap: 0,
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: '2rem',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '0 0 1rem',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '1rem',
  },
  backBtn: {
    padding: '0.35rem 0.75rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.8rem',
    color: '#555',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
  },
  subject: {
    margin: '0 0 0.25rem',
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  headerMeta: {
    fontSize: '0.875rem',
    color: '#444',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  badge: {
    display: 'inline-block',
    padding: '0.2rem 0.55rem',
    borderRadius: 12,
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  controls: {
    display: 'flex',
    gap: '0.75rem',
    flexShrink: 0,
  },
  controlLabel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
  },
  controlSelect: {
    padding: '0.3rem 0.5rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: '0.8rem',
    background: '#fff',
    cursor: 'pointer',
    minWidth: 140,
  },
  updateErrorBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fdecea',
    color: '#c0392b',
    padding: '0.5rem 0.75rem',
    borderRadius: 4,
    fontSize: '0.8rem',
    marginBottom: '0.75rem',
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    color: '#c0392b',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    padding: '0 0.25rem',
  },
  messageArea: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    paddingBottom: '0.5rem',
    minHeight: 0,
  },
  pagBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.4rem 0',
    marginBottom: '0.5rem',
  },
  pagInfo: {
    fontSize: '0.8rem',
    color: '#888',
  },
  pageBtn: {
    padding: '0.3rem 0.7rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.8rem',
    color: '#374151',
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
  messageBubble: {
    maxWidth: '72%',
    padding: '0.5rem 0.75rem',
    borderRadius: 8,
    fontSize: '0.875rem',
  },
  bubbleAgent: {
    alignSelf: 'flex-end' as const,
    background: '#dbeafe',
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    alignSelf: 'flex-start' as const,
    background: '#f3f4f6',
    borderBottomLeftRadius: 2,
  },
  bubbleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginBottom: '0.25rem',
  },
  authorLabel: {
    fontWeight: 600,
    fontSize: '0.75rem',
    color: '#374151',
  },
  msgTime: {
    fontSize: '0.7rem',
    color: '#888',
  },
  msgContent: {
    margin: 0,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    color: '#111',
  },
  sendForm: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '0.75rem',
    marginTop: '0.5rem',
  },
  closedNotice: {
    margin: '0 0 0.5rem',
    color: '#888',
    fontSize: '0.8rem',
    fontStyle: 'italic',
  },
  sendError: {
    margin: '0 0 0.5rem',
    color: '#c0392b',
    fontSize: '0.85rem',
  },
  sendRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: '0.875rem',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    minHeight: 72,
  },
  sendBtn: {
    padding: '0.5rem 1.25rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    height: 40,
    flexShrink: 0,
  },
  hint: {
    margin: '0.25rem 0 0',
    fontSize: '0.72rem',
    color: '#bbb',
  },
} satisfies Record<string, React.CSSProperties>
