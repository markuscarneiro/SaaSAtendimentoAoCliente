import type { PrismaClient } from '@prisma/client'
import { conflict, notFound } from '../../common/errors'
import { paginationSkip, paginationMeta } from '../../common/pagination'
import type {
  CreateConversationInput,
  ListConversationsParams,
  ListMessagesParams,
  CreateMessageInput,
  PatchConversationInput,
} from './conversation.schema'

// ----------------------------------------------------------------
// Status transition table — conversation-history-spec §4.0.1
// ----------------------------------------------------------------
export const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ['waiting_agent', 'waiting_customer', 'resolved'],
  waiting_agent: ['waiting_customer', 'resolved'],
  waiting_customer: ['waiting_agent', 'resolved'],
  resolved: ['closed', 'open'],
  closed: ['open'],
}

interface ServiceLogger {
  info(obj: Record<string, unknown>, msg: string): void
}

// ----------------------------------------------------------------
// Customer resolution (conversation-history-spec §4.1.3)
// ----------------------------------------------------------------
async function resolveCustomer(
  tx: PrismaClient,
  organizationId: string,
  input: CreateConversationInput['customer'],
) {
  if (input.email) {
    const normalizedEmail = input.email.trim().toLowerCase()
    const existing = await tx.customer.findFirst({
      where: { organizationId, email: normalizedEmail },
    })
    if (existing) return existing

    return tx.customer.create({
      data: { organizationId, name: input.name, email: normalizedEmail },
    })
  }

  return tx.customer.create({
    data: { organizationId, name: input.name },
  })
}

// ----------------------------------------------------------------
// POST /conversations
// ----------------------------------------------------------------
export async function createConversation(
  prisma: PrismaClient,
  organizationId: string,
  input: CreateConversationInput,
) {
  return prisma.$transaction(async (tx) => {
    const customer = await resolveCustomer(tx as unknown as PrismaClient, organizationId, input.customer)

    const conversation = await tx.conversation.create({
      data: {
        organizationId,
        customerId: customer.id,
        status: 'open',
        priority: 'normal',
        channel: input.channel,
        subject: input.subject ?? null,
      },
    })

    return {
      id: conversation.id,
      status: conversation.status,
      subject: conversation.subject,
      channel: conversation.channel,
      createdAt: conversation.createdAt,
      customer: { id: customer.id, name: customer.name, email: customer.email ?? null },
    }
  })
}

// ----------------------------------------------------------------
// GET /conversations
// ----------------------------------------------------------------
export async function listConversations(
  prisma: PrismaClient,
  organizationId: string,
  params: ListConversationsParams,
) {
  const where = {
    organizationId,
    ...(params.status ? { status: params.status } : {}),
    ...(params.assignedUserId ? { assignedUserId: params.assignedUserId } : {}),
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { [params.sort]: params.direction },
      skip: paginationSkip(params),
      take: params.pageSize,
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ])

  return {
    data: conversations.map((c) => ({
      id: c.id,
      status: c.status,
      subject: c.subject,
      channel: c.channel,
      assignedUserId: c.assignedUserId,
      lastMessageAt: c.lastMessageAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      customer: c.customer,
    })),
    meta: paginationMeta(total, params),
  }
}

// ----------------------------------------------------------------
// GET /conversations/:id
// ----------------------------------------------------------------
export async function getConversation(
  prisma: PrismaClient,
  organizationId: string,
  conversationId: string,
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
  })

  if (!conversation) throw notFound()

  // 20 most recent messages in ascending order (spec §6)
  const messages = await prisma.message.findMany({
    where: { conversationId, organizationId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return {
    id: conversation.id,
    status: conversation.status,
    subject: conversation.subject,
    channel: conversation.channel,
    assignedUserId: conversation.assignedUserId,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    customer: conversation.customer,
    messages: messages.reverse(),
  }
}

// ----------------------------------------------------------------
// GET /conversations/:id/messages (paginated)
// ----------------------------------------------------------------
export async function listMessages(
  prisma: PrismaClient,
  organizationId: string,
  conversationId: string,
  params: ListMessagesParams,
) {
  // Verify conversation belongs to org (returns 404 for cross-tenant)
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId },
    select: { id: true },
  })
  if (!conversation) throw notFound()

  const where = { conversationId, organizationId }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: paginationSkip(params),
      take: params.pageSize,
    }),
    prisma.message.count({ where }),
  ])

  return { data: messages, meta: paginationMeta(total, params) }
}

// ----------------------------------------------------------------
// PATCH /conversations/:id — atribuição e status (T2.5)
// ----------------------------------------------------------------
export async function patchConversation(
  prisma: PrismaClient,
  organizationId: string,
  conversationId: string,
  input: PatchConversationInput,
  log: ServiceLogger,
) {
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.findFirst({
      where: { id: conversationId, organizationId },
    })
    if (!conversation) throw notFound()

    // Status transition
    let newStatus = conversation.status
    if (input.status !== undefined && input.status !== conversation.status) {
      const allowed = VALID_TRANSITIONS[conversation.status] ?? []
      if (!allowed.includes(input.status)) {
        throw conflict(
          `Invalid status transition: '${conversation.status}' → '${input.status}'`,
        )
      }
      log.info(
        { conversationId, from: conversation.status, to: input.status },
        'conversation status changed',
      )
      newStatus = input.status
    }

    // assignedUserId update
    let newAssignedUserId = conversation.assignedUserId
    if (input.assignedUserId !== undefined) {
      if (input.assignedUserId !== null) {
        const member = await tx.organizationMember.findFirst({
          where: { userId: input.assignedUserId, organizationId, status: 'active' },
        })
        if (!member) throw notFound('Assigned user not found in organization')
      }
      if (input.assignedUserId !== conversation.assignedUserId) {
        log.info(
          { conversationId, assignedUserId: input.assignedUserId },
          'conversation assigned',
        )
      }
      newAssignedUserId = input.assignedUserId
    }

    const updated = await tx.conversation.update({
      where: { id: conversationId },
      data: { status: newStatus, assignedUserId: newAssignedUserId },
    })

    return {
      id: updated.id,
      status: updated.status,
      assignedUserId: updated.assignedUserId,
      updatedAt: updated.updatedAt,
    }
  })
}

// ----------------------------------------------------------------
// POST /conversations/:id/messages
// ----------------------------------------------------------------
export async function createMessage(
  prisma: PrismaClient,
  organizationId: string,
  conversationId: string,
  authorUserId: string,
  input: CreateMessageInput,
) {
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.findFirst({
      where: { id: conversationId, organizationId },
    })
    if (!conversation) throw notFound()

    if (conversation.status === 'closed') {
      throw conflict('Cannot add messages to a closed conversation')
    }

    // authorId derived from context — never from payload (spec §4.0.2)
    const authorId =
      input.authorType === 'agent' ? authorUserId : conversation.customerId

    const message = await tx.message.create({
      data: {
        organizationId,
        conversationId,
        authorType: input.authorType,
        authorId,
        content: input.content,
      },
    })

    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt, updatedAt: message.createdAt },
    })

    return {
      id: message.id,
      conversationId: message.conversationId,
      authorType: message.authorType,
      authorId: message.authorId,
      content: message.content,
      createdAt: message.createdAt,
    }
  })
}
