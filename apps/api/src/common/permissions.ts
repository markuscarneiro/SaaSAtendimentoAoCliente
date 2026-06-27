// Permissions by role — resolved per-request in authenticate middleware (T2.3 formalizes guards)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    'users.manage',
    'users.read',
    'conversations.manage',
    'conversations.read',
    'analytics.read',
  ],
  admin: [
    'users.manage',
    'users.read',
    'conversations.manage',
    'conversations.read',
    'analytics.read',
  ],
  manager: [
    'users.read',
    'conversations.manage',
    'conversations.read',
    'analytics.read',
  ],
  agent: ['conversations.manage', 'conversations.read'],
  viewer: ['conversations.read'],
}

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] ?? []
}
