import type { PrismaClient } from '@prisma/client'
import { validationError } from '../../common/errors'
import type { OverviewQuery } from './analytics.schema'

interface OverviewResult {
  conversationsTotal: number
  openConversations: number
  resolvedConversations: number
  closedConversations: number
  messagesTotal: number
  avgFirstResponseSeconds: number
  byAgent: Array<{ userId: string; assignedConversations: number; messagesSent: number }>
}

interface OverviewMeta {
  from: string
  to: string
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function resolvePeriod(query: OverviewQuery): {
  fromDate: Date
  toDate: Date
  meta: OverviewMeta
} {
  const toStr = query.to ?? toDateOnly(new Date())
  const toDate = new Date(`${toStr}T23:59:59.999Z`)

  let fromStr = query.from
  if (!fromStr) {
    const defaultFrom = new Date(toDate)
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 30)
    fromStr = toDateOnly(defaultFrom)
  }
  const fromDate = new Date(`${fromStr}T00:00:00.000Z`)

  if (fromDate.getTime() > toDate.getTime()) {
    throw validationError('from must be less than or equal to to')
  }

  return { fromDate, toDate, meta: { from: fromStr, to: toStr } }
}

export async function getOverview(
  prisma: PrismaClient,
  organizationId: string,
  query: OverviewQuery,
): Promise<{ data: OverviewResult; meta: OverviewMeta }> {
  const { fromDate, toDate, meta } = resolvePeriod(query)

  const periodConversations = await prisma.conversation.findMany({
    where: { organizationId, createdAt: { gte: fromDate, lte: toDate } },
    select: { id: true, status: true, assignedUserId: true },
  })

  const conversationsTotal = periodConversations.length
  const openConversations = periodConversations.filter((c) => c.status === 'open').length
  const resolvedConversations = periodConversations.filter((c) => c.status === 'resolved').length
  const closedConversations = periodConversations.filter((c) => c.status === 'closed').length

  const periodMessages = await prisma.message.findMany({
    where: { organizationId, createdAt: { gte: fromDate, lte: toDate } },
    select: { authorType: true, authorId: true },
  })
  const messagesTotal = periodMessages.length

  const byAgentMap = new Map<string, { assignedConversations: number; messagesSent: number }>()
  for (const c of periodConversations) {
    if (!c.assignedUserId) continue
    const entry = byAgentMap.get(c.assignedUserId) ?? { assignedConversations: 0, messagesSent: 0 }
    entry.assignedConversations += 1
    byAgentMap.set(c.assignedUserId, entry)
  }
  for (const m of periodMessages) {
    if (m.authorType !== 'agent' || !m.authorId) continue
    const entry = byAgentMap.get(m.authorId) ?? { assignedConversations: 0, messagesSent: 0 }
    entry.messagesSent += 1
    byAgentMap.set(m.authorId, entry)
  }
  const byAgent = Array.from(byAgentMap.entries()).map(([userId, v]) => ({ userId, ...v }))

  const avgFirstResponseSeconds =
    periodConversations.length === 0
      ? 0
      : await computeAvgFirstResponseSeconds(
          prisma,
          organizationId,
          periodConversations.map((c) => c.id),
        )

  return {
    data: {
      conversationsTotal,
      openConversations,
      resolvedConversations,
      closedConversations,
      messagesTotal,
      avgFirstResponseSeconds,
      byAgent,
    },
    meta,
  }
}

async function computeAvgFirstResponseSeconds(
  prisma: PrismaClient,
  organizationId: string,
  conversationIds: string[],
): Promise<number> {
  const history = await prisma.message.findMany({
    where: { organizationId, conversationId: { in: conversationIds } },
    select: { conversationId: true, authorType: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const byConv = new Map<string, typeof history>()
  for (const m of history) {
    const list = byConv.get(m.conversationId) ?? []
    list.push(m)
    byConv.set(m.conversationId, list)
  }

  let totalSeconds = 0
  let countedConvs = 0
  for (const msgs of byConv.values()) {
    const firstCustomer = msgs.find((m) => m.authorType === 'customer')
    if (!firstCustomer) continue
    const firstAgentAfter = msgs.find(
      (m) => m.authorType === 'agent' && m.createdAt.getTime() > firstCustomer.createdAt.getTime(),
    )
    if (!firstAgentAfter) continue
    totalSeconds += (firstAgentAfter.createdAt.getTime() - firstCustomer.createdAt.getTime()) / 1000
    countedConvs += 1
  }

  return countedConvs > 0 ? Math.round(totalSeconds / countedConvs) : 0
}
