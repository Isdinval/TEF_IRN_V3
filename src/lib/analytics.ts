import posthog from 'posthog-js'
import { initializePostHog } from '@/components/providers/PostHogProvider'

export const initPostHog = () => {
  initializePostHog()
  return posthog
}

export const captureEvent = (name: string, properties?: Record<string, unknown>) => {
  posthog.capture(name, properties)
}

// Tag internal links rendered inside a guide's content with UTM params so
// PostHog can attribute signups/conversions to the guide (utm_campaign = slug).
// External links are left untouched.
export const withGuideUtm = (href: string, guideSlug: string): string => {
  const isInternal = href.startsWith('/') || href.startsWith('https://llamakusi.com')
  if (!isInternal) return href
  const separator = href.includes('?') ? '&' : '?'
  return `${href}${separator}utm_source=guide&utm_medium=content&utm_campaign=${guideSlug}`
}
