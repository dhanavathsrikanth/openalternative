import * as Sentry from "@sentry/nextjs";
export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET() {
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || "development";
  Sentry.logger.info(`Sentry example API called [environment=${environment}]`);
  throw new SentryExampleAPIError(
    `[${environment}] This error is raised on the backend called by the example page.`,
  );
}
