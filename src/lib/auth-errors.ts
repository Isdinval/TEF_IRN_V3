// Traduit les erreurs Supabase Auth (en anglais par défaut) en messages
// français compréhensibles par des apprenants A2-B2. Fallback générique si
// le message n'est pas reconnu.
// Partagé entre /tef-irn/login et /auth/reset-password.
export function getAuthErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (message.includes("already registered") || message.includes("user already exists")) {
    return "Un compte existe déjà avec cet email. Essayez de vous connecter.";
  }
  if (message.includes("email not confirmed")) {
    return "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail.";
  }
  if (message.includes("password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (message.includes("unable to validate email address") || message.includes("invalid email")) {
    return "Adresse email invalide.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Problème de connexion. Vérifiez votre connexion internet et réessayez.";
  }
  if (message.includes("auth session missing") || message.includes("session not found")) {
    return "Ce lien de réinitialisation a expiré ou a déjà été utilisé. Demandez-en un nouveau.";
  }
  if (message.includes("should be different from the old password")) {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }

  return "Une erreur est survenue. Réessayez dans un instant.";
}
