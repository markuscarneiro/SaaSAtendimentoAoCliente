import type { FastifyRequest, FastifyReply } from 'fastify'
import { forbidden } from './errors'

// Must be used AFTER authenticate in the preHandler chain.
// Deny-by-default: if authUser is null (authenticate not in chain), access is denied.
export function requirePermission(permission: string) {
  return async function checkPermission(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const authUser = request.authUser
    if (!authUser) {
      throw forbidden()
    }
    if (!authUser.permissions.includes(permission)) {
      request.log.warn(
        { userId: authUser.userId, orgId: authUser.organizationId, role: authUser.role, permission },
        'access denied: insufficient permissions',
      )
      throw forbidden()
    }
  }
}
