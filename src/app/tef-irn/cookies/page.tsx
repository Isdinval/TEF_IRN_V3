import React from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const cookieCategories = [
  {
    name: "Cookies essentiels",
    consent: "Toujours actifs",
    description:
      "Nécessaires au fonctionnement du site : maintien de votre session (authentification Supabase), préférences de thème clair/sombre, sécurité (protection CSRF). Sans eux, vous ne pouvez pas vous connecter ni utiliser la plateforme.",
  },
  {
    name: "Cookies de paiement",
    consent: "Toujours actifs lors d'un paiement",
    description:
      "Déposés par Stripe lors de la souscription à un abonnement, pour sécuriser la transaction et prévenir la fraude.",
  },
  {
    name: "Mesure d'audience",
    consent: "Soumis à votre consentement",
    description:
      "PostHog nous permet de comprendre quelles fonctionnalités (exercices, guides, coach oral) sont réellement utiles, afin d'améliorer le parcours pédagogique. Les données sont hébergées dans l'Union européenne.",
  },
];

export default function CookiesPage() {
  return (
    <LegalPageShell
      icon={Cookie}
      badge="Traceurs"
      title="Gestion des cookies"
      lastUpdated="21 juillet 2026"
      intro="LlamaKusi utilise un nombre volontairement limité de cookies : ce qu'il faut pour vous connecter en toute sécurité et comprendre, de façon agrégée, comment améliorer votre préparation au TEF IRN. Nous n'utilisons aucun cookie publicitaire tiers."
    >
      <div>
        <h2>1. Qu'est-ce qu'un cookie ?</h2>
        <p>
          Un cookie est un petit fichier texte déposé sur votre appareil lors de la
          visite d'un site, permettant de le reconnaître lors de vos visites suivantes
          ou de mesurer son audience.
        </p>
      </div>

      <div>
        <h2>2. Les cookies que nous utilisons</h2>
        <div className="not-prose space-y-4">
          {cookieCategories.map((cat) => (
            <div
              key={cat.name}
              className="rounded-2xl border border-slate-200 dark:border-white/10 p-6"
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="font-black text-slate-900 dark:text-white">
                  {cat.name}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-blue dark:text-brand-gold whitespace-nowrap">
                  {cat.consent}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{cat.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2>3. Comment gérer vos cookies</h2>
        <p>
          Vous pouvez à tout moment configurer votre navigateur pour refuser les
          cookies non essentiels ou être averti avant leur dépôt. Le blocage des
          cookies essentiels peut toutefois empêcher la connexion à votre compte et
          l'accès aux fonctionnalités de la plateforme.
        </p>
        <p>
          La plupart des navigateurs permettent de gérer les cookies depuis leurs
          paramètres de confidentialité (Chrome, Firefox, Safari, Edge).
        </p>
      </div>

      <div>
        <h2>4. En savoir plus</h2>
        <p>
          Pour plus de détails sur les données que nous collectons et pourquoi,
          consultez notre{" "}
          <Link href="/tef-irn/politique-de-confidentialite">
            Politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </LegalPageShell>
  );
}
