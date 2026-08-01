import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export default function ConditionsUtilisationPage() {
  return (
    <LegalPageShell
      icon={FileText}
      badge="Cadre contractuel"
      title="Conditions d'utilisation"
      lastUpdated="1 août 2026"
      intro="Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme LlamaKusi. En créant un compte ou en utilisant le service, vous acceptez sans réserve les termes ci-dessous."
    >
      <div>
        <h2>1. Objet</h2>
        <p>
          LlamaKusi est une plateforme en ligne d'entraînement à distance destinée aux
          personnes préparant le <strong>TEF IRN</strong> (Test d'Évaluation de Français
          pour l'Intégration, la Résidence et la Nationalité). Le service propose des
          exercices adaptatifs, un coach écrit et oral assisté par intelligence
          artificielle, un système de révision espacée (SRS) du vocabulaire, un tableau
          de bord de progression et des simulations d'examen.
        </p>
      </div>

      <div>
        <h2>2. Absence de lien avec l'organisme officiel du TEF</h2>
        <p>
          LlamaKusi est un outil de préparation indépendant. La plateforme{" "}
          <strong>n'est ni éditée, ni affiliée, ni approuvée</strong> par France
          Éducation international, le Centre international d'études pédagogiques ou tout
          autre organisme habilité à faire passer le TEF IRN. Les scores, retours et
          niveaux CECRL (A2, B1, B2) estimés par LlamaKusi sont des outils pédagogiques
          indicatifs et ne constituent en aucun cas une certification, une inscription à
          l'examen ni une garantie de résultat à l'épreuve officielle.
        </p>
      </div>

      <div>
        <h2>3. Création de compte</h2>
        <p>
          L'accès aux fonctionnalités personnalisées (pratique, écrit, oral, vocabulaire,
          tableau de bord) nécessite la création d'un compte via une adresse email
          valide ou un fournisseur d'authentification tiers. Vous vous engagez à fournir
          des informations exactes et à assurer la confidentialité de vos identifiants.
          L'utilisation du service par des personnes mineures se fait sous la
          responsabilité et avec l'autorisation de leur représentant légal, conformément
          à la réglementation applicable en matière de protection des mineurs en ligne.
        </p>
      </div>

      <div>
        <h2>4. Abonnements et paiement</h2>
        <p>
          Certaines fonctionnalités sont accessibles gratuitement (exercice découverte,
          guides, certains parcours), d'autres nécessitent un abonnement payant dont le
          détail des offres et tarifs figure sur la page{" "}
          <Link href="/tef-irn/pricing">Tarifs</Link>. Les paiements sont traités par
          notre prestataire <strong>Stripe</strong>, qui seul a accès à vos données
          bancaires ; LlamaKusi ne stocke aucune information de carte bancaire.
        </p>
        <p>
          LlamaKusi propose deux modes de facturation, précisés au moment de la
          souscription :
        </p>
        <ul>
          <li>
            <strong>Abonnement mensuel :</strong> sans engagement, renouvelé
            automatiquement chaque mois au tarif en vigueur. Vous pouvez résilier à tout
            moment depuis votre espace « Paramètres » ou le portail de facturation
            Stripe ; la résiliation prend effet à la fin de la période en cours, sans
            remboursement au prorata sauf disposition légale contraire ou garantie
            contractuelle décrite ci-dessous.
          </li>
          <li>
            <strong>Forfait 4 mois :</strong> paiement unique donnant accès au service
            pour une durée de 4 mois, sans reconduction ni renouvellement automatique.
            L'accès prend fin de lui-même à l'issue de cette période, sans action ni
            frais supplémentaire de votre part.
          </li>
        </ul>
        <p>
          <strong>Garantie de remboursement :</strong> indépendamment du droit de
          rétractation légal applicable aux consommateurs, LlamaKusi propose une
          garantie de remboursement sous 14 jours à compter de la souscription, dans les
          conditions suivantes selon l'offre souscrite :
        </p>
        <ul>
          <li>
            <strong>Offre Essentiel :</strong> remboursement sans condition d'usage.
          </li>
          <li>
            <strong>Offres Premium et Super Premium :</strong> remboursement possible
            tant que l'usage cumulé du coach oral n'excède pas 60 minutes (Premium) ou
            90 minutes (Super Premium) sur la période concernée.
          </li>
        </ul>
        <p>
          Pour exercer cette garantie ou votre droit de rétractation légal, contactez{" "}
          <a href="mailto:contact@llamakusi.com">contact@llamakusi.com</a> dans le délai
          imparti.
        </p>
      </div>

      <div>
        <h2>5. Utilisation de l'intelligence artificielle</h2>
        <p>
          Les corrections écrites, le coach oral conversationnel et les recommandations
          d'exercices s'appuient sur des modèles d'intelligence artificielle
          (notamment l'API OpenAI). Ces retours sont générés automatiquement et, bien
          qu'ils s'appuient sur le référentiel officiel du TEF IRN, peuvent
          occasionnellement contenir des imprécisions. Ils ne remplacent pas l'avis d'un
          enseignant certifié et ne préjugent pas du résultat que vous obtiendrez à
          l'examen officiel.
        </p>
      </div>

      <div>
        <h2>6. Propriété intellectuelle</h2>
        <p>
          L'ensemble des éléments de la plateforme (textes, exercices, guides, code
          source, identité visuelle, logo) est protégé par le droit de la propriété
          intellectuelle et demeure la propriété exclusive de LlamaKusi ou de ses
          partenaires. Toute reproduction, extraction ou réutilisation non autorisée,
          notamment à des fins commerciales ou pour l'entraînement d'un autre système
          d'intelligence artificielle, est interdite sans accord écrit préalable.
        </p>
      </div>

      <div>
        <h2>7. Usage loyal du service</h2>
        <p>Vous vous engagez à ne pas :</p>
        <ul>
          <li>Partager votre compte ou vos accès avec des tiers non autorisés ;</li>
          <li>
            Extraire massivement le contenu pédagogique (guides, exercices, questions)
            à des fins de republication ou d'entraînement d'un modèle concurrent ;
          </li>
          <li>
            Utiliser le service à des fins frauduleuses, notamment pour obtenir une
            attestation ou un score falsifié à présenter à un tiers ou une
            administration ;
          </li>
          <li>Perturber le fonctionnement technique de la plateforme.</li>
        </ul>
      </div>

      <div>
        <h2>8. Responsabilité</h2>
        <p>
          LlamaKusi met en œuvre des moyens raisonnables pour assurer la disponibilité
          et la fiabilité du service, sans garantie de continuité absolue (maintenance,
          panne, indisponibilité d'un prestataire tiers). LlamaKusi ne saurait être tenu
          responsable d'un échec à l'examen officiel du TEF IRN, celui-ci dépendant de
          nombreux facteurs propres au candidat et à l'organisme examinateur.
        </p>
      </div>

      <div>
        <h2>9. Résiliation</h2>
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis les{" "}
          <Link href="/tef-irn/settings">Paramètres</Link>. LlamaKusi se réserve le
          droit de suspendre ou clôturer un compte en cas de manquement grave aux
          présentes CGU, après notification lorsque cela est possible.
        </p>
      </div>

      <div>
        <h2>10. Droit applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit français. À défaut de résolution
          amiable, tout litige relève de la compétence des tribunaux français
          territorialement compétents.
        </p>
      </div>

      <div>
        <h2>11. Contact</h2>
        <p>
          Pour toute question relative aux présentes CGU :{" "}
          <a href="mailto:contact@llamakusi.com">contact@llamakusi.com</a>.
        </p>
      </div>
    </LegalPageShell>
  );
}
