import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé service_role — bypass RLS.
 *
 * ⚠️ Server-only, jamais importé dans un composant client ni exposé au
 * navigateur. Réservé aux jobs de confiance (cron, tâches admin) qui doivent
 * agir sur tous les utilisateurs, contrairement à `supabase-server.ts` /
 * `supabase.ts` qui respectent RLS pour l'utilisateur courant.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
