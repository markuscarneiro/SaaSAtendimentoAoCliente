import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/render'
import { AnalyticsPage } from './AnalyticsPage'
import { api, ApiError } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  }
})

const MEMBERS_RESPONSE = { data: [{ id: 'agent-1', name: 'Bruno Costa' }] }

function overviewResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      conversationsTotal: 12,
      openConversations: 5,
      resolvedConversations: 4,
      closedConversations: 3,
      messagesTotal: 40,
      avgFirstResponseSeconds: 125,
      byAgent: [{ userId: 'agent-1', assignedConversations: 6, messagesSent: 20 }],
      ...overrides,
    },
    meta: { from: '2026-05-10', to: '2026-06-10' },
  }
}

function mockGet(overviewPayload: unknown): void {
  vi.mocked(api.get).mockImplementation((path: string): Promise<unknown> => {
    if (path.startsWith('/api/v1/users')) return Promise.resolve(MEMBERS_RESPONSE)
    if (path.startsWith('/api/v1/analytics/overview')) return Promise.resolve(overviewPayload)
    return Promise.reject(new Error(`unexpected path: ${path}`))
  })
}

describe('AnalyticsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(api.get).mockReset()
  })

  it('exibe métricas e volume por atendente', async () => {
    mockGet(overviewResponse())
    renderWithProviders(<AnalyticsPage />)

    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
    expect(screen.getByText('2 min')).toBeInTheDocument()
  })

  it('overview vazio exibe estado zerado, não erro', async () => {
    mockGet(overviewResponse({ conversationsTotal: 0, byAgent: [] }))
    renderWithProviders(<AnalyticsPage />)

    expect(await screen.findByText(/nenhuma conversa criada neste período/i)).toBeInTheDocument()
  })

  it('período inválido (400) exibe mensagem de erro com retry', async () => {
    vi.mocked(api.get).mockImplementation((path: string): Promise<unknown> => {
      if (path.startsWith('/api/v1/users')) return Promise.resolve(MEMBERS_RESPONSE)
      return Promise.reject(new ApiError(400, 'from must be less than or equal to to'))
    })

    renderWithProviders(<AnalyticsPage />)

    expect(await screen.findByText(/período inválido/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })
})
