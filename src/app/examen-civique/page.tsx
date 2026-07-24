/**
 * page.tsx — Server Component.
 * Injecte du contenu statique indexable par Google dans le HTML initial, récupère les guides
 * civiques et le contenu FAQ, puis délègue le rendu interactif à CivicHub.
 * Le <h1> visible est dans CivicHub — ici on n'utilise que des <h2>/<p> pour éviter le double H1.
 */
import { CivicHub } from "./CivicHub";
import { getCivicGuides } from "@/lib/civic-guides";
import JsonLd from "@/components/shared/JsonLd";
import { siteUrl } from "@/lib/site";

const THEMES_STATIC = [
  { label: "Vivre en société", count: "~20 questions" },
  { label: "Principes & valeurs de la République", count: "~18 questions" },
  { label: "Système politique français", count: "~15 questions" },
  { label: "Droits & devoirs du citoyen", count: "~12 questions" },
  { label: "Histoire, géographie & culture", count: "~15 questions" },
];

const FAQ = [
  {
    q: "Qu'est-ce que l'examen civique ?",
    a: "Depuis le 1er janvier 2026, toute première demande de titre de séjour pluriannuel (CSP), de carte de résident ou de naturalisation est soumise à un examen civique. Il prend la forme d'un QCM de 40 questions sur les valeurs, les institutions et l'histoire de la France.",
  },
  {
    q: "Combien de questions à l'examen civique ?",
    a: "L'examen comporte 40 questions à choix multiple. Le seuil de réussite est de 32 bonnes réponses sur 40 (80 %). La durée est de 45 minutes.",
  },
  {
    q: "Les questions viennent d'où ?",
    a: "Les questions utilisées sur LlamaKusi sont extraites du référentiel officiel publié par le Ministère de l'Intérieur français. Elles couvrent les 5 thématiques du programme officiel.",
  },
  {
    q: "C'est vraiment gratuit ?",
    a: "Oui, entièrement. L'entraînement, la révision adaptative et les examens blancs sont 100 % gratuits et sans inscription. Aucune carte bancaire requise.",
  },
  {
    q: "Combien de temps pour se préparer ?",
    a: "Avec une ou deux sessions de 15 minutes par jour pendant 2 à 3 semaines, la majorité des candidats atteignent le seuil de réussite. Notre algorithme de révision adaptative optimise chaque session pour mémoriser durablement.",
  },
];

export default async function ExamenCiviquePage() {
  const civicGuides = await getCivicGuides();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Examen civique", item: `${siteUrl}/examen-civique` },
    ],
  };

  return (
    <>
      <JsonLd data={faqSchema} id="examen-civique-faq-schema" />
      <JsonLd data={breadcrumbSchema} id="examen-civique-breadcrumb" />

      {/*
        Contenu SEO statique — indexable par Google.
        PAS de <h1> ici : le <h1> visible est dans CivicHub pour éviter le double H1.
      */}
      <div className="sr-only">
        <p>
          Préparez-vous gratuitement à l'examen civique (naturalisation, carte de résident, CSP)
          avec les questions officielles du Ministère de l'Intérieur. Révision adaptative,
          examens blancs chronométrés, sans inscription.
        </p>
        <section aria-label="Thématiques de l'examen civique">
          <h2>Les 5 thématiques de l'examen civique</h2>
          <ul>
            {THEMES_STATIC.map((t) => (
              <li key={t.label}>{t.label} — {t.count}</li>
            ))}
          </ul>
        </section>
        <section aria-label="Exemple de question examen civique">
          <h2>Exemple de question de l'examen civique</h2>
          <p><strong>Question :</strong> Quel est le principe qui sépare les Églises et l'État en France ?</p>
          <p><strong>Réponse :</strong> La laïcité. Ce principe, inscrit dans la loi de 1905, garantit la liberté de conscience et interdit à l'État de reconnaître ou subventionner un culte.</p>
        </section>
      </div>

      {/* Interface interactive : démarche, action recommandée, progression, guides, FAQ visible */}
      <CivicHub civicGuides={civicGuides} faq={FAQ} />
    </>
  );
}
