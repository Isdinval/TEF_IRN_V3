import posthog from 'posthog-js'
import { initializePostHog } from '@/components/providers/PostHogProvider'

export const initPostHog = () => {
  initializePostHog()
  return posthog
}

export const captureEvent = (name: string, properties?: Record<string, unknown>) => {
  posthog.capture(name, properties)
}
