import { PostHog } from 'posthog-node';

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let posthogClient: PostHog | null | undefined;

function getPostHogClient() {
  if (posthogClient !== undefined) return posthogClient;

  if (!projectToken || !host) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        !projectToken
          ? 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured'
          : 'NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured'
      );
    }
    posthogClient = null;
    return posthogClient;
  }

  posthogClient = new PostHog(projectToken, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });

  return posthogClient;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const posthog = getPostHogClient();
  if (!posthog) return;

  try {
    posthog.capture({ distinctId, event, properties });
    await posthog.flush();
  } catch (error) {
    console.error('PostHog server capture failed:', error);
  }
}
