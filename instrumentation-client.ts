import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://759dc0a7cae6074a046fa76d73dc18b5@o4511485507993600.ingest.us.sentry.io/4511774641422336",

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: "system",
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
