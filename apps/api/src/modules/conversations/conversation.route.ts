import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import {
  createConversationSchema,
  listConversationsSchema,
  listMessagesSchema,
  createMessageSchema,
  patchConversationSchema,
} from './conversation.schema'
import {
  createConversation,
  listConversations,
  getConversation,
  listMessages,
  createMessage,
  patchConversation,
} from './conversation.service'
import { ok } from '../../common/reply'
import { validationError } from '../../common/errors'
import { createAuthenticate } from '../../middleware/authenticate'
import { requirePermission } from '../../common/require-permission'

interface ConversationRoutesOpts {
  prisma: PrismaClient
}

export async function conversationRoutes(app: FastifyInstance, opts: ConversationRoutesOpts) {
  const { prisma } = opts
  const authenticate = createAuthenticate(prisma)

  const canReadConversations = requirePermission('conversations.read')
  const canCreateConversation = requirePermission('conversations.create')
  const canManageConversations = requirePermission('conversations.manage')
  const canCreateMessage = requirePermission('messages.create')

  // GET /api/v1/conversations
  app.get(
    '/api/v1/conversations',
    { preHandler: [authenticate, canReadConversations] },
    async (request, reply) => {
      const parsed = listConversationsSchema.safeParse(request.query)
      if (!parsed.success) throw validationError('Invalid query parameters', parsed.error.issues)

      const result = await listConversations(prisma, request.authUser!.organizationId, parsed.data)
      return reply.code(200).send({ ...result, error: null })
    },
  )

  // POST /api/v1/conversations
  app.post(
    '/api/v1/conversations',
    { preHandler: [authenticate, canCreateConversation] },
    async (request, reply) => {
      const parsed = createConversationSchema.safeParse(request.body)
      if (!parsed.success) throw validationError('Invalid request payload', parsed.error.issues)

      const result = await createConversation(
        prisma,
        request.authUser!.organizationId,
        parsed.data,
      )
      return reply.code(201).send(ok(result))
    },
  )

  // GET /api/v1/conversations/:id
  app.get(
    '/api/v1/conversations/:id',
    { preHandler: [authenticate, canReadConversations] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const result = await getConversation(prisma, request.authUser!.organizationId, id)
      return reply.code(200).send(ok(result))
    },
  )

  // GET /api/v1/conversations/:id/messages
  app.get(
    '/api/v1/conversations/:id/messages',
    { preHandler: [authenticate, canReadConversations] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const parsed = listMessagesSchema.safeParse(request.query)
      if (!parsed.success) throw validationError('Invalid query parameters', parsed.error.issues)

      const result = await listMessages(
        prisma,
        request.authUser!.organizationId,
        id,
        parsed.data,
      )
      return reply.code(200).send({ ...result, error: null })
    },
  )

  // PATCH /api/v1/conversations/:id — status e assignedUserId (T2.5)
  app.patch(
    '/api/v1/conversations/:id',
    { preHandler: [authenticate, canManageConversations] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const parsed = patchConversationSchema.safeParse(request.body)
      if (!parsed.success) throw validationError('Invalid request payload', parsed.error.issues)

      const result = await patchConversation(
        prisma,
        request.authUser!.organizationId,
        id,
        parsed.data,
        request.log as { info(obj: Record<string, unknown>, msg: string): void },
      )
      return reply.code(200).send(ok(result))
    },
  )

  // POST /api/v1/conversations/:id/messages
  app.post(
    '/api/v1/conversations/:id/messages',
    { preHandler: [authenticate, canCreateMessage] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const parsed = createMessageSchema.safeParse(request.body)
      if (!parsed.success) throw validationError('Invalid request payload', parsed.error.issues)

      const result = await createMessage(
        prisma,
        request.authUser!.organizationId,
        id,
        request.authUser!.userId,
        parsed.data,
      )
      return reply.code(201).send(ok(result))
    },
  )
}
