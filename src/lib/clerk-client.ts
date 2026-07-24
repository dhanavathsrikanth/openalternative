import { clerkClient } from '@clerk/nextjs/server'

/**
 * Shared Clerk Backend client. Re-uses the CLERK_SECRET_KEY already
 * configured for the project.
 */
export function getClerkClient() {
  return clerkClient()
}
