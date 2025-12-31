import * as Sentry from "@sentry/nextjs";

// Initialize Sentry for error tracking
// Only enabled if NEXT_PUBLIC_SENTRY_DSN is configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

        // Performance Monitoring
        tracesSampleRate: 0.1, // 10% of transactions

        // Session Replay
        replaysOnErrorSampleRate: 1.0, // 100% of errors
        replaysSessionSampleRate: 0.1, // 10% of sessions

        // Environment
        environment: process.env.NODE_ENV,

        integrations: [
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
    });
}
