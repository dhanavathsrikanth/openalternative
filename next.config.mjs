import { dirname } from "path";
import { fileURLToPath } from "url";

import { withSentryConfig } from "@sentry/nextjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
    ],
  },
  headers: async () => [
    {
      source: '/products/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
      ],
    },
    {
      source: '/categories/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
      ],
    },
    {
      source: '/compare/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
      ],
    },
  ],
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "pivoturl",

  project: "openalternative",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/sentry-tunnel",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
