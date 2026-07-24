import { auth } from '@clerk/nextjs/server'
import { db } from '@/app/db'
import { Users } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

export type OrgRole = 'org:owner' | 'org:admin' | 'org:editor' | 'org:marketing' | 'org:viewer'

export const ROLE_HIERARCHY: Record<OrgRole, number> = {
  'org:owner': 50,
  'org:admin': 40,
  'org:editor': 30,
  'org:marketing': 20,
  'org:viewer': 10,
}

type Permission =
  | 'org:manage_settings'
  | 'org:manage_members'
  | 'org:create_content'
  | 'org:edit_content'
  | 'org:delete_content'
  | 'org:publish_content'
  | 'org:review_contributions'
  | 'org:manage_newsletter'
  | 'org:run_cron'

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  'org:owner': [
    'org:manage_settings',
    'org:manage_members',
    'org:create_content',
    'org:edit_content',
    'org:delete_content',
    'org:publish_content',
    'org:review_contributions',
    'org:manage_newsletter',
    'org:run_cron',
  ],
  'org:admin': [
    'org:manage_members',
    'org:create_content',
    'org:edit_content',
    'org:delete_content',
    'org:publish_content',
    'org:review_contributions',
    'org:manage_newsletter',
    'org:run_cron',
  ],
  'org:editor': [
    'org:create_content',
    'org:edit_content',
    'org:delete_content',
    'org:publish_content',
    'org:review_contributions',
  ],
  'org:marketing': [
    'org:create_content',
    'org:edit_content',
    'org:manage_newsletter',
  ],
  'org:viewer': [],
}

export interface SessionContext {
  userId: string
  orgId: string
  orgRole: OrgRole
}

/**
 * Retrieve the current session's org context. Throws if the user is not
 * authenticated or has no active organization membership.
 */
export async function requireSession(): Promise<SessionContext> {
  const session = await auth()
  if (!session.userId) {
    throw new AuthError('unauthenticated', 'You must be signed in.')
  }
  if (!session.orgId) {
    throw new AuthError('no_organization', 'You must belong to an organization.')
  }
  return {
    userId: session.userId,
    orgId: session.orgId,
    orgRole: (session.orgRole ?? 'org:viewer') as OrgRole,
  }
}

/**
 * Assert the current session's role meets or exceeds `minRole`.
 * Returns the session context on success.
 */
export async function requireOrgRole(minRole: OrgRole): Promise<SessionContext> {
  const ctx = await requireSession()
  const current = ROLE_HIERARCHY[ctx.orgRole] ?? 0
  const required = ROLE_HIERARCHY[minRole] ?? 0
  if (current < required) {
    throw new AuthError(
      'insufficient_role',
      `Role "${ctx.orgRole}" does not meet the minimum required role "${minRole}".`
    )
  }
  return ctx
}

/**
 * Assert the current session has a specific permission.
 */
export async function requirePermission(permission: Permission): Promise<SessionContext> {
  const ctx = await requireSession()
  const allowed = ROLE_PERMISSIONS[ctx.orgRole] ?? []
  if (!allowed.includes(permission)) {
    throw new AuthError(
      'insufficient_permission',
      `Role "${ctx.orgRole}" does not have the "${permission}" permission.`
    )
  }
  return ctx
}

/**
 * Check if a role meets or exceeds a minimum role without throwing.
 */
export function hasRole(currentRole: OrgRole, minRole: OrgRole): boolean {
  return (ROLE_HIERARCHY[currentRole] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0)
}

/**
 * Check if a role has a specific permission without throwing.
 */
export function hasPermission(role: OrgRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission)
}

/**
 * Assert the current session user is a platform staff member.
 * Staff is a boolean on the users table, completely separate from org roles.
 * A vendor Admin must never be able to reach the admin panel via this flag.
 */
export async function requireStaff(): Promise<SessionContext> {
  const ctx = await requireSession()
  const rows = await db
    .select({ staff: Users.staff })
    .from(Users)
    .where(eq(Users.id, ctx.userId))
    .limit(1)
  if (rows.length === 0 || !rows[0].staff) {
    throw new AuthError('not_staff', 'Staff access required.')
  }
  return ctx
}

/**
 * Non-throwing staff check. Returns true if the current session user
 * is a platform staff member, false otherwise. Structured so swapping
 * for real Clerk role-checking later is a one-line change.
 */
export async function isStaff(): Promise<boolean> {
  try {
    await requireStaff()
    return true
  } catch {
    return false
  }
}

export class AuthError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}
