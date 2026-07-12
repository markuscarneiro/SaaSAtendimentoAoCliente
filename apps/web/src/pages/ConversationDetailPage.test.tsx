import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/render'
import { ConversationDetailPage } from './ConversationDetailPage'
import { api } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  }
})

const CONV_ID = 'conv-1'

function mePayload(permissions: string[]) {
  return {
    data: {
      user: { id: 'usr_1', name: 'Ana Silva', email: 'ana@example.com' },
      organization: { id: 'org_1', name: 'Acme Support' },
      role: permissions.includes('conversations.manage') ? 'owner' : 'viewer',
      permissions,
    },
  }
}

function headerPayload(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: CONV_ID,
      status: 'open',
      subject: 'Dúvida sobre cancelamento',
      assignedUserId: null,
      customer: { id: 'cust-1', name: 'Cliente Exemplo', email: 'cliente@example.com' },
      ...overrides,
    },
  }
}

function messagesPayload(messages: unknown[] = []) {
  return { data: messages, meta: { page: 1, pageSize: 20, total: messages.length } }
}

function setupApiGet({
  permissions = [] as string[],
  header = headerPayload(),
  messages = messagesPayload(),
}: { permissions?: string[]; header?: unknown; messages?: unknown } = {}) {
  vi.mocked(api.get).mockImplementation((path: string): Promise<unknown> => {
    if (path === '/api/v1/me') return Promise.resolve(mePayload(permissions))
    if (path.includes('/messages')) return Promise.resolve(messages)
    if (path.startsWith(`/api/v1/conversations/${CONV_ID}`)) return Promise.resolve(header)
    if (path.startsWith('/api/v1/users')) {
      return Promise.resolve({ data: [{ id: 'agent-1', name: 'Bruno Costa' }] })
    }
    return Promise.reject(new Error(`unexpected path: ${path}`))
  })
}

function renderDetail() {
  localStorage.setItem('token', 'fake-token')
  return renderWithProviders(<ConversationDetailPage />, {
    route: `/conversations/${CONV_ID}`,
    path: '/conversations/:id',
  })
}

describe('ConversationDetailPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
    vi.mocked(api.patch).mockReset()
  })

  it('carrega header e histórico de mensagens', async () => {
    setupApiGet({
      messages: messagesPayload([
        { id: 'm1', conversationId: CONV_ID, authorType: 'customer', authorId: 'cust-1', content: 'Olá, preciso de ajuda', createdAt: '2026-06-10T10:00:00.000Z' },
      ]),
    })

    renderDetail()

    expect(await screen.findByText('Dúvida sobre cancelamento')).toBeInTheDocument()
    expect(screen.getByText('Cliente Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Olá, preciso de ajuda')).toBeInTheDocument()
  })

  it('estado vazio quando não há mensagens', async () => {
    setupApiGet()
    renderDetail()

    expect(await screen.findByText(/nenhuma mensagem ainda/i)).toBeInTheDocument()
  })

  it('envia mensagem de agente sem incluir authorId no payload', async () => {
    const user = userEvent.setup()
    setupApiGet()
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'm2' } })

    renderDetail()
    await screen.findByText(/nenhuma mensagem ainda/i)

    await user.type(screen.getByPlaceholderText(/digite sua mensagem/i), 'Vou verificar isso para você.')
    await user.click(screen.getByRole('button', { name: /^enviar$/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalled())
    const [path, body] = vi.mocked(api.post).mock.calls[0]
    expect(path).toBe(`/api/v1/conversations/${CONV_ID}/messages`)
    expect(body).toEqual({ authorType: 'agent', content: 'Vou verificar isso para você.' })
    expect(body).not.toHaveProperty('authorId')
  })

  it('conversa fechada desabilita o formulário de envio', async () => {
    setupApiGet({ header: headerPayload({ status: 'closed' }) })
    renderDetail()

    expect(await screen.findByText(/conversa está fechada/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/conversa fechada/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /^enviar$/i })).toBeDisabled()
  })

  it('sem conversations.manage, não exibe controles de status/responsável', async () => {
    setupApiGet({ permissions: ['conversations.read'] })
    renderDetail()

    await screen.findByText('Dúvida sobre cancelamento')
    expect(screen.getByText('Aberta')).toBeInTheDocument()
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/responsável/i)).not.toBeInTheDocument()
  })

  it('com conversations.manage, muda status via PATCH', async () => {
    const user = userEvent.setup()
    setupApiGet({ permissions: ['conversations.manage'] })
    vi.mocked(api.patch).mockResolvedValue({ data: { status: 'resolved', assignedUserId: null } })

    renderDetail()
    await screen.findByText('Dúvida sobre cancelamento')

    const statusSelect = await screen.findByLabelText(/status/i)
    await user.selectOptions(statusSelect, 'resolved')

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(`/api/v1/conversations/${CONV_ID}`, { status: 'resolved' }),
    )
  })
})
