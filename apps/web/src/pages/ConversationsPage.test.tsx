import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/render'
import { ConversationsPage } from './ConversationsPage'
import { api, ApiError } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  }
})

const MEMBERS_RESPONSE = { data: [{ id: 'agent-1', name: 'Bruno Costa' }] }

function conversationsResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: [
      {
        id: 'conv-1',
        status: 'open',
        subject: 'Dúvida sobre cancelamento',
        channel: 'manual',
        assignedUserId: null,
        lastMessageAt: '2026-06-10T12:00:00.000Z',
        createdAt: '2026-06-10T10:00:00.000Z',
        customer: { id: 'cust-1', name: 'Cliente Exemplo', email: 'cliente@example.com' },
      },
    ],
    meta: { page: 1, pageSize: 20, total: 1 },
    ...overrides,
  }
}

function mockGet(conversationsPayload: unknown): void {
  vi.mocked(api.get).mockImplementation((path: string): Promise<unknown> => {
    if (path.startsWith('/api/v1/users')) return Promise.resolve(MEMBERS_RESPONSE)
    if (path.startsWith('/api/v1/conversations')) return Promise.resolve(conversationsPayload)
    return Promise.reject(new Error(`unexpected path: ${path}`))
  })
}

describe('ConversationsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(api.get).mockReset()
  })

  it('lista conversas com status, cliente, assunto e responsável', async () => {
    mockGet(conversationsResponse())
    renderWithProviders(<ConversationsPage />)

    expect(await screen.findByText('Cliente Exemplo')).toBeInTheDocument()
    const row = screen.getByRole('row', { name: /cliente exemplo/i })
    expect(within(row).getByText('Dúvida sobre cancelamento')).toBeInTheDocument()
    expect(within(row).getByText('Aberta')).toBeInTheDocument()
    expect(within(row).getByText('Não atribuído')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: /ver/i })).toHaveAttribute('href', '/conversations/conv-1')
  })

  it('estado vazio quando não há conversas', async () => {
    mockGet(conversationsResponse({ data: [], meta: { page: 1, pageSize: 20, total: 0 } }))
    renderWithProviders(<ConversationsPage />)

    expect(await screen.findByText(/nenhuma conversa encontrada/i)).toBeInTheDocument()
  })

  it('estado de erro exibe botão de tentar novamente e recupera ao clicar', async () => {
    const user = userEvent.setup()
    let callCount = 0
    vi.mocked(api.get).mockImplementation((path: string): Promise<unknown> => {
      if (path.startsWith('/api/v1/users')) return Promise.resolve(MEMBERS_RESPONSE)
      callCount += 1
      if (callCount === 1) return Promise.reject(new ApiError(500, 'Erro interno'))
      return Promise.resolve(conversationsResponse())
    })

    renderWithProviders(<ConversationsPage />)

    expect(await screen.findByText('Erro interno')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))

    expect(await screen.findByText('Cliente Exemplo')).toBeInTheDocument()
  })

  it('filtro por status envia o parâmetro correto e reseta a página', async () => {
    const user = userEvent.setup()
    mockGet(conversationsResponse())
    renderWithProviders(<ConversationsPage />)

    await screen.findByText('Cliente Exemplo')
    await user.selectOptions(screen.getByRole('combobox'), 'resolved')

    await waitFor(() => {
      const calls = vi.mocked(api.get).mock.calls.map(([path]) => path as string)
      expect(calls.some((p) => p.includes('/api/v1/conversations') && p.includes('status=resolved') && p.includes('page=1'))).toBe(true)
    })
  })
})
