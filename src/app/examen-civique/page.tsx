/**
 * page.tsx — Server Component.
 * Injecte du contenu statique indexable par Google dans le HTML initial.
 * Le <h1> visible est dans CivicExamApp — ici on n'utilise que des <h2>/<p>
 * pour éviter le double H1.
 */
import { CivicExamApp } from "./CivicExamApp";

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

export default function ExamenCiviquePage() {
  return (
    <>
      {/*
        Contenu SEO statique — indexable par Google.
        PAS de <h1> ici : le <h1> visible est dans CivicExamApp pour éviter le double H1.
        Les <section> et <h2> ci-dessous sont en sr-only pour ne pas doubler l'affichage.
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
        <section aria-label="Questions fréquentes sur l'examen civique">
          <h2>Questions fréquentes sur l'examen civique</h2>
          {FAQ.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </section>
      </div>

      {/* Interface interactive */}
      <CivicExamApp />
    </>
  );
}
