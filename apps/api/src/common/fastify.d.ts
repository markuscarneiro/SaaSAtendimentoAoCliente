import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    authUser: {
      userId: string
      organizationId: string
      role: string
      permissions: string[]
    } | null
  }
}
