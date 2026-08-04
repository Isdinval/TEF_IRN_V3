'use client';

import posthog from 'posthog-js';

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let initialized = false;

export function initializePostHog() {
  if (initialized || posthog.__loaded) return;

  if (!projectToken || !host) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        !projectToken
          ? 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured'
          : 'NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured'
      );
    }
    return;
  }

  posthog.init(projectToken, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_exceptions: true,
  });
  initialized = true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  initializePostHog();

  return children;
}
