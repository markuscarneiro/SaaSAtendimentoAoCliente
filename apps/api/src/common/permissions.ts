// Permission matrix — authorization-spec.md §4
// Roles are fixed in MVP; customizable roles are post-MVP (non-goal §1.2).

export const ALL_PERMISSIONS = [
  'users.read',
  'users.manage',
  'conversations.read',
  'conversations.create',
  'conversations.manage',
  'messages.create',
  'analytics.read',
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  owner: ALL_PERMISSIONS,
  admin: [
    'users.read',
    'users.manage',
    'conversations.read',
    'conversations.create',
    'conversations.manage',
    'messages.create',
    'analytics.read',
  ],
  manager: [
    'users.read',
    'conversations.read',
    'conversations.manage',
    'messages.create',
    'analytics.read',
  ],
  agent: [
    'users.read',
    'conversations.read',
    'conversations.create',
    'conversations.manage',
    'messages.create',
  ],
  viewer: ['conversations.read', 'analytics.read'],
}

export function getPermissionsForRole(role: string): string[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])]
}
