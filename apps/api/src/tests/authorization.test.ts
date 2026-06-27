import { describe, it, expect, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'
import { buildApp } from '../server'
import { getPermissionsForRole, ALL_PERMISSIONS } from '../common/permissions'
import { requirePermission } from '../common/require-permission'
import { createAuthenticate } from '../middleware/authenticate'

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const JWT_SECRET = 'test-secret-32-chars-do-not-use-in-production!!'

// ================================================================
// §4 — Matriz de permissões (testa matriz inteira role × permission)
// ================================================================
describe('Matriz de permissões — authorization-spec.md §4', () => {
  it('owner tem todas as permissões', () => {
    const perms = getPermissionsForRole('owner')
    for (const p of ALL_PERMISSIONS) {
      expect(perms, `owner deve ter ${p}`).toContain(p)
    }
  })

  it('admin tem todas as permissões exceto nenhuma (igual ao owner no MVP)', () => {
    const perms = getPermissionsForRole('admin')
    const expected = [
      'users.read', 'users.manage', 'conversations.read',
      'conversations.create', 'conversations.manage', 'messages.create', 'analytics.read',
    ]
    for (const p of expected) {
      expect(perms, `admin deve ter ${p}`).toContain(p)
    }
  })

  it('manager tem as permissões corretas', () => {
    const perms = getPermissionsForRole('manager')
    expect(perms).toContain('users.read')
    expect(perms).toContain('conversations.read')
    expect(perms).toContain('conversations.manage')
    expect(perms).toContain('messages.create')
    expect(perms).toContain('analytics.read')
    expect(perms).not.toContain('users.manage')
    expect(perms).not.toContain('conversations.create')
  })

  it('agent tem as permissões corretas', () => {
    const perms = getPermissionsForRole('agent')
    expect(perms).toContain('users.read')
    expect(perms).toContain('conversations.read')
    expect(perms).toContain('conversations.create')
    expect(perms).toContain('conversations.manage')
    expect(perms).toContain('messages.create')
    expect(perms).not.toContain('users.manage')
    expect(perms).not.toContain('analytics.read')
  })

  it('viewer tem apenas conversations.read e analytics.read', () => {
    const perms = getPermissionsForRole('viewer')
    expect(perms).toContain('conversations.read')
    expect(perms).toContain('analytics.read')
    expect(perms).not.toContain('users.read')
    expect(perms).not.toContain('users.manage')
    expect(perms).not.toContain('conversations.create')
    expect(perms).not.toContain('conversations.manage')
    expect(perms).not.toContain('messages.create')
  })

  it('papel desconhecido retorna lista vazia', () => {
    expect(getPermissionsForRole('superadmin')).toEqual([])
    expect(getPermissionsForRole('')).toEqual([])
  })
})

// ================================================================
// Helpers para testes de guard HTTP
// ================================================================
type MembershipRole = 'owner' | 'admin' | 'manager' | 'agent' | 'viewer'

function makePrismaForRole(role: MembershipRole, orgId = 'org-a'): PrismaClient {
  const user = {
    id: 'user-uuid',
    name: 'Alice',
    email: 'alice@test.com',
    passwordHash: 'hash',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const membership = {
    id: 'mem-uuid',
    organizationId: orgId,
    userId: 'user-uuid',
    role,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return {
    user: { findUnique: () => Promise.resolve(user) },
    organization: { create: () => Promise.resolve(null) },
    organizationMember: {
      create: () => Promise.resolve(null),
      findFirst: () => Promise.resolve(membership),
    },
    $transaction: () => Promise.resolve(null),
  } as unknown as PrismaClient
}

const noOpRedis = {} as unknown as Redis

function makeTestApp(role: MembershipRole, orgId = 'org-a'): FastifyInstance {
  const prisma = makePrismaForRole(role, orgId)
  const app = buildApp({ nodeEnv: 'test', jwtSecret: JWT_SECRET, prisma, redis: noOpRedis })

  const authenticate = createAuthenticate(prisma)

  // Test-only routes that represent protected endpoints
  app.post('/test/messages', { preHandler: [authenticate, requirePermission('messages.create')] },
    async (_req, reply) => reply.code(201).send({ ok: true }),
  )

  app.get('/test/conversations', { preHandler: [authenticate, requirePermission('conversations.read')] },
    async (_req, reply) => reply.code(200).send({ ok: true }),
  )

  app.post('/test/users', { preHandler: [authenticate, requirePermission('users.manage')] },
    async (_req, reply) => reply.code(201).send({ ok: true }),
  )

  app.get('/test/analytics', { preHandler: [authenticate, requirePermission('analytics.read')] },
    async (_req, reply) => reply.code(200).send({ ok: true }),
  )

  return app
}

async function signedToken(app: FastifyInstance, orgId = 'org-a'): Promise<string> {
  await app.ready()
  return app.jwt.sign({ sub: 'user-uuid', organizationId: orgId })
}

// ================================================================
// Guard — cenários BDD authorization-spec.md §6.1
// ================================================================
describe('requirePermission — guard de permissões', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app?.close()
  })

  // ---- §7: owner acessa rota administrativa -------------------
  it('owner — acessa POST /test/users (users.manage)', async () => {
    app = makeTestApp('owner')
    const token = await signedToken(app)

    const res = await app.inject({
      method: 'POST', url: '/test/users',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(201)
  })

  // ---- §6.1 BDD: viewer não cria mensagem (403) --------------
  it('viewer — POST /test/messages retorna 403 FORBIDDEN', async () => {
    app = makeTestApp('viewer')
    const token = await signedToken(app)

    const res = await app.inject({
      method: 'POST', url: '/test/messages',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    expect(res.json().error.code).toBe('FORBIDDEN')
  })

  // ---- §7: agent não gerencia usuários -----------------------
  it('agent — POST /test/users retorna 403', async () => {
    app = makeTestApp('agent')
    const token = await signedToken(app)

    const res = await app.inject({
      method: 'POST', url: '/test/users',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })

  // ---- agent PODE criar mensagem (permissions.create) --------
  it('agent — POST /test/messages retorna 201', async () => {
    app = makeTestApp('agent')
    const token = await signedToken(app)

    const res = await app.inject({
      method: 'POST', url: '/test/messages',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(201)
  })

  // ---- viewer acessa analytics.read --------------------------
  it('viewer — GET /test/analytics retorna 200', async () => {
    app = makeTestApp('viewer')
    const token = await signedToken(app)

    const res = await app.inject({
      method: 'GET', url: '/test/analytics',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
  })

  // ---- viewer NÃO acessa conversations.create/manage ---------
  it('viewer — POST /test/messages retorna 403', async () => {
    app = makeTestApp('viewer')
    const token = await signedToken(app)

    const res = await app.inject({
      method: 'POST', url: '/test/messages',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })

  // ---- manager tem messages.create mas não users.manage ------
  it('manager — POST /test/messages retorna 201', async () => {
    app = makeTestApp('manager')
    const token = await signedToken(app)

    const res = await app.inject({
      method: 'POST', url: '/test/messages',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(201)
  })

  it('manager — POST /test/users retorna 403', async () => {
    app = makeTestApp('manager')
    const token = await signedToken(app)

    const res = await app.inject({
      method: 'POST', url: '/test/users',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })

  // ---- deny-by-default: sem token → authenticate rejeita -----
  it('sem token → authenticate rejeita com 401 antes do guard', async () => {
    app = makeTestApp('owner')

    const res = await app.inject({ method: 'POST', url: '/test/messages' })

    expect(res.statusCode).toBe(401)
  })
})

// ================================================================
// §6.1 BDD: cross-tenant — owner da org A não acessa org B
// ================================================================
describe('Cross-tenant — authorization-spec.md §6.1', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app?.close()
  })

  it('owner da org A recebe JWT com organizationId=org-a; token não dá acesso a org B', async () => {
    // The prisma mock for org A's membership
    const prismaOrgA = makePrismaForRole('owner', 'org-a')

    // App with org A membership
    app = buildApp({ nodeEnv: 'test', jwtSecret: JWT_SECRET, prisma: prismaOrgA, redis: noOpRedis })

    const authenticate = createAuthenticate(prismaOrgA)

    // Test route that returns the organizationId from authUser
    app.get('/test/my-org', { preHandler: [authenticate, requirePermission('conversations.read')] },
      async (req, reply) => reply.code(200).send({ organizationId: req.authUser!.organizationId }),
    )

    await app.ready()
    const tokenOrgA = app.jwt.sign({ sub: 'user-uuid', organizationId: 'org-a' })

    const res = await app.inject({
      method: 'GET', url: '/test/my-org',
      headers: { authorization: `Bearer ${tokenOrgA}` },
    })

    expect(res.statusCode).toBe(200)
    // authUser.organizationId is always org-a (from JWT + membership lookup)
    expect(res.json().organizationId).toBe('org-a')
  })

  it('token org A não autentica membership de org B (membership lookup retorna null → 401)', async () => {
    // Prisma mock: membership lookup for org-b returns null (user not in org B)
    const prismaCrossOrg = {
      user: {
        findUnique: () =>
          Promise.resolve({
            id: 'user-uuid', name: 'Alice', email: 'alice@test.com',
            passwordHash: 'hash', status: 'active', createdAt: new Date(), updatedAt: new Date(),
          }),
      },
      organization: { create: () => Promise.resolve(null) },
      organizationMember: {
        create: () => Promise.resolve(null),
        // membership query for org-b returns null because user only belongs to org-a
        findFirst: () => Promise.resolve(null),
      },
      $transaction: () => Promise.resolve(null),
    } as unknown as PrismaClient

    app = buildApp({ nodeEnv: 'test', jwtSecret: JWT_SECRET, prisma: prismaCrossOrg, redis: noOpRedis })

    const authenticate = createAuthenticate(prismaCrossOrg)

    app.get('/test/data', { preHandler: [authenticate, requirePermission('conversations.read')] },
      async (_req, reply) => reply.code(200).send({ ok: true }),
    )

    await app.ready()
    // Token claims org-b but user has no active membership in org-b
    const tokenClaimingOrgB = app.jwt.sign({ sub: 'user-uuid', organizationId: 'org-b' })

    const res = await app.inject({
      method: 'GET', url: '/test/data',
      headers: { authorization: `Bearer ${tokenClaimingOrgB}` },
    })

    // authenticate denies because membership for org-b doesn't exist
    expect(res.statusCode).toBe(401)
  })
})
