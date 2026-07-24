
import { from } from 'env-var'

export default function getEnv (env: NodeJS.ProcessEnv) {
  const { get } = from(env)

  return {
    CLERK_WEBHOOK_SECRET: get('CLERK_WEBHOOK_SECRET').required().asString(),
    DATABASE_URL: get('DATABASE_URL').required().asString(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: get('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY').required().asString(),
    CLERK_SECRET_KEY: get('CLERK_SECRET_KEY').required().asString(),
    ANTHROPIC_API_KEY: get('ANTHROPIC_API_KEY').optional().asString(),
  }
}
