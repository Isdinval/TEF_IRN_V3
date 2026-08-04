import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Route de confirmation pour les liens email à usage unique (recovery,
// signup, magiclink, email_change...), utilisée à la place du endpoint
// GoTrue public {{ .ConfirmationURL }} (.../auth/v1/verify auto-généré par
// Supabase). Ce dernier est parfois visité automatiquement par des
// scanners de liens email (Outlook Safe Links, antivirus d'entreprise...),
// ce qui consomme le token à usage unique avant que l'utilisateur ne
// clique réellement — cause la plus fréquente d'un lien "expiré" alors
// qu'il vient d'être reçu. En passant par notre propre domaine avec
// {{ .TokenHash }} plutôt que {{ .ConfirmationURL }}, la vérification se
// fait ici, sous notre contrôle.
//
// Contrairement à /auth/callback (flow PKCE, exchangeCodeForSession), cette
// route vérifie un token_hash côté serveur avec verifyOtp() : elle ne
// dépend d'aucun code_verifier stocké dans le navigateur qui a initié la
// demande — indispensable pour un lien de réinitialisation de mot de passe,
// très souvent ouvert depuis un client mail plutôt que l'onglet d'origine.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/tef-irn/dashboard";
  // "next" peut arriver soit en chemin relatif ("/auth/reset-password"),
  // soit en URL absolue complète ("https://llamakusi.com/auth/reset-password")
  // -- c'est le cas ici puisque resetPasswordForEmail() est appelé avec un
  // redirectTo déjà absolu (window.location.origin + chemin), qui devient
  // {{ .RedirectTo }} tel quel dans le template email. Concaténer
  // aveuglément origin + next produisait un domaine dupliqué
  // ("https://llamakusi.comhttps://llamakusi.com/...").
  const next = nextParam.startsWith("http") ? nextParam : `${origin}${nextParam}`;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(next);
    }
  }

  // Lien invalide, expiré ou déjà utilisé : retour au login avec un code
  // d'erreur lisible par la bannière inline plutôt que la page d'erreur
  // brute de Supabase (Site URL + query/hash params bruts).
  return NextResponse.redirect(`${origin}/tef-irn/login?error_code=otp_expired`);
}
