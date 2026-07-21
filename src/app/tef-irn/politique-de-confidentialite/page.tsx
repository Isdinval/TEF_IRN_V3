import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageShell
      icon={ShieldCheck}
      badge="Protection des données"
      title="Politique de confidentialité"
      lastUpdated="21 juillet 2026"
      intro="Cette politique explique quelles données LlamaKusi collecte pour vous accompagner dans votre préparation au TEF IRN, pourquoi, et comment vous pouvez garder le contrôle sur elles, conformément au Règlement Général sur la Protection des Données (RGPD)."
    >
      <div>
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données collectées via LlamaKusi est
          l'éditeur identifié dans nos{" "}
          <Link href="/tef-irn/mentions-legales">Mentions légales</Link>. Pour toute
          question relative à vos données personnelles, vous pouvez nous contacter à
          l'adresse <a href="mailto:contact@llamakusi.com">contact@llamakusi.com</a>.
        </p>
      </div>

      <div>
        <h2>2. Données que nous collectons</h2>
        <h3>Données de compte</h3>
        <p>
          Adresse email, nom (si renseigné), et méthode d'authentification, gérées via
          Supabase Auth. Si vous vous connectez via un fournisseur tiers (Google, etc.),
          nous recevons uniquement les informations de base de profil autorisées par ce
          fournisseur.
        </p>
        <h3>Données pédagogiques</h3>
        <p>
          Niveau initial et objectif renseignés lors de l'onboarding, réponses aux
          exercices (QCM, textes à trous, écrit, oral), scores, historique de révision du
          vocabulaire (système SRS), résultats des simulations d'examen et statistiques
          de progression affichées sur votre tableau de bord.
        </p>
        <h3>Contenus générés lors du coaching IA</h3>
        <p>
          Les textes que vous soumettez au correcteur écrit, ainsi que les transcriptions
          textuelles de vos sessions avec le coach oral, sont transmis à notre
          prestataire d'intelligence artificielle pour générer votre feedback. Les flux
          audio du coach oral en temps réel sont traités pour la durée de la session et
          ne sont pas conservés sous forme de fichier audio par LlamaKusi au-delà de
          cette session.
        </p>
        <h3>Données de paiement</h3>
        <p>
          Gérées directement par Stripe. LlamaKusi ne collecte ni ne stocke vos
          coordonnées bancaires ; nous conservons uniquement le statut de votre
          abonnement et l'historique de facturation nécessaires à la gestion du service.
        </p>
        <h3>Données de navigation et de mesure d'audience</h3>
        <p>
          Voir notre <Link href="/tef-irn/cookies">politique de gestion des cookies</Link>{" "}
          pour le détail des traceurs utilisés (mesure d'audience via PostHog,
          hébergé en Union européenne).
        </p>
      </div>

      <div>
        <h2>3. Finalités et bases légales</h2>
        <ul>
          <li>
            <strong>Exécution du contrat</strong> : création et gestion de votre compte,
            fourniture des exercices, du coaching IA et du suivi de progression,
            traitement des abonnements.
          </li>
          <li>
            <strong>Intérêt légitime</strong> : amélioration du moteur de recommandation
            pédagogique, sécurité de la plateforme, mesure d'audience agrégée.
          </li>
          <li>
            <strong>Consentement</strong> : cookies non essentiels, communications
            marketing le cas échéant (vous pouvez vous désinscrire à tout moment).
          </li>
          <li>
            <strong>Obligation légale</strong> : conservation des données de facturation
            pour les durées légales comptables et fiscales.
          </li>
        </ul>
      </div>

      <div>
        <h2>4. Destinataires et sous-traitants</h2>
        <p>
          Vos données sont partagées uniquement avec les prestataires nécessaires au
          fonctionnement du service, dans le cadre de contrats de sous-traitance
          conformes au RGPD :
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> (base de données et authentification) ;
          </li>
          <li>
            <strong>OpenAI</strong> (génération du feedback écrit et oral par
            intelligence artificielle) ;
          </li>
          <li>
            <strong>Stripe</strong> (traitement des paiements) ;
          </li>
          <li>
            <strong>Vercel</strong> (hébergement de l'application) ;
          </li>
          <li>
            <strong>PostHog</strong> (mesure d'audience, données hébergées dans l'Union
            européenne).
          </li>
        </ul>
        <p>
          Certains de ces prestataires (notamment OpenAI) sont établis hors de l'Union
          européenne. Les transferts de données correspondants s'appuient sur les
          garanties prévues par le RGPD, notamment les clauses contractuelles types.
          Nous ne vendons jamais vos données à des tiers à des fins publicitaires.
        </p>
      </div>

      <div>
        <h2>5. Durée de conservation</h2>
        <p>
          Vos données de compte et de progression sont conservées tant que votre compte
          est actif. En cas de suppression de compte, vos données personnelles sont
          supprimées ou anonymisées dans un délai raisonnable, sous réserve des
          obligations légales de conservation (notamment comptables) qui peuvent imposer
          un archivage limité de certaines données de facturation.
        </p>
      </div>

      <div>
        <h2>6. Vos droits</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants sur vos données :</p>
        <ul>
          <li>Droit d'accès et de rectification ;</li>
          <li>Droit à l'effacement (« droit à l'oubli ») ;</li>
          <li>Droit à la portabilité de vos données ;</li>
          <li>Droit d'opposition et de limitation du traitement ;</li>
          <li>Droit de retirer votre consentement à tout moment.</li>
        </ul>
        <p>
          Vous pouvez exercer ces droits directement depuis votre espace{" "}
          <Link href="/tef-irn/settings">Paramètres</Link>, ou en nous écrivant à{" "}
          <a href="mailto:contact@llamakusi.com">contact@llamakusi.com</a>. Vous disposez
          également du droit d'introduire une réclamation auprès de la Commission
          Nationale de l'Informatique et des Libertés (
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            www.cnil.fr
          </a>
          ).
        </p>
      </div>

      <div>
        <h2>7. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles
          raisonnables (chiffrement des échanges, contrôle d'accès, isolation des
          données par compte) pour protéger vos données contre l'accès non autorisé, la
          perte ou l'altération.
        </p>
      </div>

      <div>
        <h2>8. Mise à jour de cette politique</h2>
        <p>
          Cette politique peut être mise à jour pour refléter une évolution du service
          ou de la réglementation. La date de dernière mise à jour figure en haut de
          cette page.
        </p>
      </div>
    </LegalPageShell>
  );
}
