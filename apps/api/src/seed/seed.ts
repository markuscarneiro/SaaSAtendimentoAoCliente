// Seed de demonstração — seed-spec.md
// Idempotente: upsert por chave natural (slug, email, userId+orgId).
// Nunca roda em produção (guard NODE_ENV).
// Comando: docker compose exec api node dist/seed/seed.js

import bcrypt from 'bcryptjs'
import type { PrismaClient } from '@prisma/client'
import { getDatabase, closeDatabase } from '../infra/database'

const DEMO_SLUG = 'demo'
const DEMO_PASSWORD = 'demo-password-123'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function hoursAfter(base: Date, h: number): Date {
  return new Date(base.getTime() + h * 60 * 60 * 1000)
}

function log(msg: string) {
  process.stdout.write(`[seed] ${msg}\n`)
}

// ----------------------------------------------------------------
// Core seed — injectable Prisma for testability
// ----------------------------------------------------------------
export async function runSeed(prisma: PrismaClient): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    process.stderr.write('[seed] ERROR: cannot run seed in production environment\n')
    process.exit(1)
  }

  log('Starting demo seed…')

  // ---- 1. Organization ------------------------------------------
  const org = await prisma.organization.upsert({
    where: { slug: DEMO_SLUG },
    update: {},
    create: { name: 'Demo Organization', slug: DEMO_SLUG, status: 'active' },
  })
  log(`Organization: ${org.name} (${org.id})`)

  // ---- 2. Password (hashed once for all demo users) -------------
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  // ---- 3. Users + Memberships -----------------------------------
  const userDefs = [
    { name: 'Demo Owner',   email: 'owner@demo.test',   role: 'owner' },
    { name: 'Demo Admin',   email: 'admin@demo.test',   role: 'admin' },
    { name: 'Demo Manager', email: 'manager@demo.test', role: 'manager' },
    { name: 'Demo Agent',   email: 'agent@demo.test',   role: 'agent' },
    { name: 'Demo Viewer',  email: 'viewer@demo.test',  role: 'viewer' },
  ] as const

  const userMap: Record<string, string> = {} // role → userId

  for (const def of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: { name: def.name, email: def.email, passwordHash, status: 'active' },
    })

    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      update: {},
      create: { organizationId: org.id, userId: user.id, role: def.role, status: 'active' },
    })

    userMap[def.role] = user.id
    log(`  User ${def.email} (${def.role}) — ok`)
  }

  // ---- 4. Customers ---------------------------------------------
  const customerDefs = [
    { name: 'Alice Cliente',   email: 'alice@cliente.test' as string | null },
    { name: 'Bob Cliente',     email: 'bob@cliente.test' as string | null },
    { name: 'Carlos Cliente',  email: 'carlos@cliente.test' as string | null },
    { name: 'Diana Cliente',   email: 'diana@cliente.test' as string | null },
    { name: 'Eduardo Cliente', email: null },
  ]

  const customers: { id: string; name: string }[] = []

  for (const def of customerDefs) {
    let customer = def.email
      ? await prisma.customer.findFirst({ where: { organizationId: org.id, email: def.email } })
      : await prisma.customer.findFirst({ where: { organizationId: org.id, name: def.name, email: null } })

    if (!customer) {
      customer = await prisma.customer.create({
        data: { organizationId: org.id, name: def.name, email: def.email ?? undefined },
      })
    }

    customers.push({ id: customer.id, name: customer.name })
    log(`  Customer ${def.name} — ok`)
  }

  // ---- 5. Conversations + Messages (skip if already seeded) -----
  const existing = await prisma.conversation.count({ where: { organizationId: org.id } })

  if (existing > 0) {
    log(`Conversations: ${existing} already exist — skipping (idempotent)`)
  } else {
    const agentId   = userMap['agent']!
    const managerId = userMap['manager']!

    const convDefs: Array<{
      ci: number
      status: string
      assigned: string | null
      subject: string
      ago: number
    }> = [
      { ci: 0, status: 'open',             assigned: agentId,   subject: 'Problema com login',         ago: 1  },
      { ci: 1, status: 'open',             assigned: agentId,   subject: 'Dúvida sobre faturamento',   ago: 2  },
      { ci: 2, status: 'open',             assigned: null,       subject: 'Solicitação de suporte',     ago: 3  },
      { ci: 3, status: 'waiting_agent',    assigned: agentId,   subject: 'Aguardando análise técnica', ago: 4  },
      { ci: 4, status: 'waiting_agent',    assigned: managerId, subject: 'Revisão de contrato',        ago: 5  },
      { ci: 0, status: 'waiting_customer', assigned: agentId,   subject: 'Confirmação de dados',       ago: 6  },
      { ci: 1, status: 'waiting_customer', assigned: null,       subject: 'Retorno do cliente',        ago: 7  },
      { ci: 2, status: 'resolved',         assigned: agentId,   subject: 'Cancelamento processado',    ago: 10 },
      { ci: 3, status: 'resolved',         assigned: agentId,   subject: 'Migração de plano',          ago: 12 },
      { ci: 4, status: 'resolved',         assigned: managerId, subject: 'Reembolso aprovado',         ago: 15 },
      { ci: 0, status: 'closed',           assigned: agentId,   subject: 'Onboarding concluído',       ago: 20 },
      { ci: 1, status: 'closed',           assigned: null,       subject: 'Suporte encerrado',         ago: 25 },
    ]

    log('Creating conversations and messages…')

    for (const def of convDefs) {
      const convCreatedAt = daysAgo(def.ago)
      const customerId = customers[def.ci]!.id

      const conv = await prisma.conversation.create({
        data: {
          organizationId: org.id,
          customerId,
          assignedUserId: def.assigned,
          status: def.status,
          priority: 'normal',
          channel: 'manual',
          subject: def.subject,
          createdAt: convCreatedAt,
        },
      })

      const msgDefs: Array<{ authorType: string; authorId: string; content: string; hoursOffset: number }> = [
        {
          authorType: 'customer',
          authorId: customerId,
          content: `Olá, preciso de ajuda com: ${def.subject}`,
          hoursOffset: 0,
        },
        {
          authorType: 'agent',
          authorId: def.assigned ?? agentId,
          content: 'Olá! Recebemos sua solicitação e iremos verificar imediatamente.',
          hoursOffset: 1,
        },
      ]

      if (def.status === 'resolved' || def.status === 'closed') {
        msgDefs.push(
          {
            authorType: 'customer',
            authorId: customerId,
            content: 'Obrigado pela atenção!',
            hoursOffset: 2,
          },
          {
            authorType: 'agent',
            authorId: def.assigned ?? agentId,
            content: 'Encerramos o atendimento. Qualquer dúvida, estamos disponíveis.',
            hoursOffset: 3,
          },
        )
      }

      let lastMsgAt: Date = convCreatedAt

      for (const msg of msgDefs) {
        const createdAt = hoursAfter(convCreatedAt, msg.hoursOffset)
        await prisma.message.create({
          data: {
            organizationId: org.id,
            conversationId: conv.id,
            authorType: msg.authorType,
            authorId: msg.authorId,
            content: msg.content,
            createdAt,
          },
        })
        if (createdAt > lastMsgAt) lastMsgAt = createdAt
      }

      await prisma.conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: lastMsgAt },
      })

      log(`  Conversation "${def.subject}" (${def.status}) — ${msgDefs.length} messages`)
    }
  }

  log('Seed completed successfully.')
  log('')
  log('Demo credentials (password: demo-password-123):')
  for (const def of userDefs) {
    log(`  ${def.role.padEnd(8)} → ${def.email}`)
  }
}

// ----------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------
async function main() {
  const prisma = getDatabase()
  try {
    await runSeed(prisma)
  } finally {
    await closeDatabase()
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`[seed] FATAL: ${String(err)}\n`)
  process.exit(1)
})
