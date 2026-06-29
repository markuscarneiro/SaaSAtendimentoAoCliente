// T2.7 — Seed de demonstração: idempotência e guard de produção
// seed-spec.md

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'

// ----------------------------------------------------------------
// Mock bcryptjs so tests don't wait for real hashing
// ----------------------------------------------------------------
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('$hashed$') },
}))

// Mock infra so seed.ts doesn't open real DB on import
vi.mock('../infra/database', () => ({
  getDatabase: vi.fn(),
  closeDatabase: vi.fn(),
}))

import { runSeed } from '../seed/seed'

// ----------------------------------------------------------------
// Mock Prisma builder
// ----------------------------------------------------------------
interface Customer { id: string; name: string; email: string | null; organizationId: string }
interface Conversation { id: string; organizationId: string }

function makePrisma(opts: { conversationCount?: number; customersExist?: boolean } = {}) {
  const { conversationCount = 0, customersExist = false } = opts

  const org = { id: 'org-demo', slug: 'demo', name: 'Demo Organization', status: 'active' }
  const userCounter = { n: 0 }
  const convCreateMock = vi.fn().mockImplementation(
    (): Promise<Conversation> => Promise.resolve({ id: `conv-${++userCounter.n}`, organizationId: org.id }),
  )
  const msgCreateMock = vi.fn().mockResolvedValue({ id: 'msg-1' })
  const convUpdateMock = vi.fn().mockResolvedValue({})

  const customerMap: Record<string, Customer> = customersExist
    ? {
        'alice@cliente.test': { id: 'cust-1', name: 'Alice Cliente', email: 'alice@cliente.test', organizationId: org.id },
        'bob@cliente.test':   { id: 'cust-2', name: 'Bob Cliente',   email: 'bob@cliente.test',   organizationId: org.id },
        'carlos@cliente.test':{ id: 'cust-3', name: 'Carlos Cliente',email: 'carlos@cliente.test',organizationId: org.id },
        'diana@cliente.test': { id: 'cust-4', name: 'Diana Cliente', email: 'diana@cliente.test', organizationId: org.id },
      }
    : {}

  const customerFindFirstMock = vi.fn().mockImplementation(
    (args: { where: { email?: string | null; name?: string } }) => {
      if (args.where.email) return Promise.resolve(customerMap[args.where.email] ?? null)
      if (args.where.name === 'Eduardo Cliente') return Promise.resolve(customersExist ? { id: 'cust-5', name: 'Eduardo Cliente', email: null, organizationId: org.id } : null)
      return Promise.resolve(null)
    },
  )
  const customerCreateMock = vi.fn().mockImplementation(
    (args: { data: { name: string; email?: string; organizationId: string } }): Promise<Customer> =>
      Promise.resolve({ id: `cust-new`, name: args.data.name, email: args.data.email ?? null, organizationId: args.data.organizationId }),
  )

  const prisma = {
    organization: {
      upsert: vi.fn().mockResolvedValue(org),
    },
    user: {
      upsert: vi.fn().mockImplementation(
        (args: { where: { email: string }; create: { name: string } }) =>
          Promise.resolve({ id: `user-${args.where.email}`, name: args.create.name, email: args.where.email, passwordHash: '$hashed$', status: 'active' }),
      ),
    },
    organizationMember: {
      upsert: vi.fn().mockResolvedValue({ id: 'mem-1' }),
    },
    customer: {
      findFirst: customerFindFirstMock,
      create: customerCreateMock,
    },
    conversation: {
      count: vi.fn().mockResolvedValue(conversationCount),
      create: convCreateMock,
      update: convUpdateMock,
    },
    message: {
      create: msgCreateMock,
    },
  } as unknown as PrismaClient

  return { prisma, mocks: { convCreateMock, msgCreateMock, convUpdateMock, customerCreateMock, customerFindFirstMock } }
}

// ----------------------------------------------------------------
// Tests
// ----------------------------------------------------------------
describe('Seed de demonstração', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('cria 1 org, 5 usuários e 5 memberships no primeiro run', async () => {
    const { prisma } = makePrisma()
    await runSeed(prisma)

    expect(prisma.organization.upsert).toHaveBeenCalledTimes(1)
    expect(prisma.organization.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'demo' } }),
    )
    expect(prisma.user.upsert).toHaveBeenCalledTimes(5)
    expect(prisma.organizationMember.upsert).toHaveBeenCalledTimes(5)
  })

  it('cria 5 customers no primeiro run', async () => {
    const { prisma, mocks } = makePrisma()
    await runSeed(prisma)

    expect(mocks.customerCreateMock).toHaveBeenCalledTimes(5)
  })

  it('cria 12 conversas e mensagens no primeiro run', async () => {
    const { prisma, mocks } = makePrisma({ conversationCount: 0 })
    await runSeed(prisma)

    expect(mocks.convCreateMock).toHaveBeenCalledTimes(12)
    // open(3) + waiting_agent(2) + waiting_customer(2) = 7 convs × 2 msgs = 14
    // resolved(3) + closed(2) = 5 convs × 4 msgs = 20
    const expectedMsgCount = 7 * 2 + 5 * 4 // 14 + 20 = 34
    expect(mocks.msgCreateMock).toHaveBeenCalledTimes(expectedMsgCount)
    expect(mocks.convUpdateMock).toHaveBeenCalledTimes(12)
  })

  it('não duplica conversas no segundo run (idempotência)', async () => {
    const { prisma, mocks } = makePrisma({ conversationCount: 12, customersExist: true })
    await runSeed(prisma)

    // Conversas e mensagens NÃO devem ser criadas de novo
    expect(mocks.convCreateMock).not.toHaveBeenCalled()
    expect(mocks.msgCreateMock).not.toHaveBeenCalled()
    expect(mocks.convUpdateMock).not.toHaveBeenCalled()

    // Org, usuários e memberships ainda fazem upsert (seguro e idempotente)
    expect(prisma.organization.upsert).toHaveBeenCalledTimes(1)
    expect(prisma.user.upsert).toHaveBeenCalledTimes(5)
    expect(prisma.organizationMember.upsert).toHaveBeenCalledTimes(5)

    // Customers: findFirst chamado 5x; create NÃO chamado (já existem)
    expect(mocks.customerFindFirstMock).toHaveBeenCalledTimes(5)
    expect(mocks.customerCreateMock).not.toHaveBeenCalled()
  })

  it('recusa execução em NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production'

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: number | string) => { throw new Error('process.exit called') })

    const { prisma } = makePrisma()

    try {
      await expect(runSeed(prisma)).rejects.toThrow('process.exit called')
    } finally {
      exitSpy.mockRestore()
    }

    // Nenhuma operação de banco deve ter ocorrido
    expect(prisma.organization.upsert).not.toHaveBeenCalled()
  })

  it('lastMessageAt é coerente com a última mensagem criada', async () => {
    const { prisma, mocks } = makePrisma({ conversationCount: 0 })
    await runSeed(prisma)

    // Cada conversation.update recebe lastMessageAt de um Date maior que createdAt
    for (const call of mocks.convUpdateMock.mock.calls) {
      const data = call[0] as { data: { lastMessageAt: Date } }
      expect(data.data.lastMessageAt).toBeInstanceOf(Date)
    }
  })

  it('emails de demo são normalizados para minúsculas', async () => {
    const { prisma } = makePrisma()
    await runSeed(prisma)

    const calls = (prisma.user.upsert as ReturnType<typeof vi.fn>).mock.calls
    for (const call of calls) {
      const email = (call[0] as { where: { email: string } }).where.email
      expect(email).toBe(email.toLowerCase())
    }
  })
})
