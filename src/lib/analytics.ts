import posthog from 'posthog-js'
import { initializePostHog } from '@/components/providers/PostHogProvider'

export const initPostHog = () => {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  // Garde-fou : tant que la clé n'est pas configurée (Vercel env vars),
  // on ne tente pas l'init plutôt que de planter/logger une erreur.
  if (typeof window === 'undefined' || !key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
  })
}

export const captureEvent = (name: string, properties?: Record<string, unknown>) => {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(name, properties)
}
