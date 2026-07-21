import React from "react";
import { Scale } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export default function MentionsLegalesPage() {
  return (
    <LegalPageShell
      icon={Scale}
      badge="Informations légales"
      title="Mentions légales"
      lastUpdated="21 juillet 2026"
    >
      <div>
        <h2>1. Éditeur du site</h2>
        <div className="not-prose rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-50 dark:bg-amber-500/10 p-6 mb-4 text-sm">
          <p className="font-bold text-amber-800 dark:text-amber-400 mb-2">
            ⚠️ Champ à compléter avant mise en ligne
          </p>
          <p className="text-amber-900/80 dark:text-amber-300/80">
            La loi française (art. 6-III de la LCEN) impose de faire figurer ici
            l'identité exacte de l'éditeur : raison sociale ou nom du responsable
            (personne physique ou société), forme juridique, capital social le cas
            échéant, adresse du siège social, numéro SIREN/SIRET et de RCS,
            numéro de TVA intracommunautaire si applicable, et nom du directeur de la
            publication.
          </p>
        </div>
        <p>
          Nom / raison sociale : <strong>[À compléter]</strong>
          <br />
          Forme juridique : <strong>[À compléter]</strong>
          <br />
          Siège social : <strong>[À compléter]</strong>
          <br />
          SIREN / SIRET : <strong>[À compléter]</strong>
          <br />
          Directeur de la publication : <strong>[À compléter]</strong>
          <br />
          Contact : <a href="mailto:contact@llamakusi.com">contact@llamakusi.com</a>
        </p>
      </div>

      <div>
        <h2>2. Hébergement</h2>
        <p>
          Le site LlamaKusi est hébergé par :<br />
          <strong>Vercel Inc.</strong>
          <br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
          <br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>
        </p>
        <p>
          La base de données et l'authentification sont opérées par :<br />
          <strong>Supabase Pte Ltd</strong>
          <br />
          970 Toa Payoh North #07-04, Singapour 318992
          <br />
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
            supabase.com
          </a>
        </p>
      </div>

      <div>
        <h2>3. Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu présent sur le site LlamaKusi (guides, leçons,
          exercices, textes, illustrations, logo, charte graphique, code source) est
          protégé par le droit d'auteur et le droit des marques. Toute reproduction ou
          représentation, totale ou partielle, sans autorisation écrite préalable, est
          interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et
          suivants du Code de la propriété intellectuelle.
        </p>
      </div>

      <div>
        <h2>4. Données personnelles</h2>
        <p>
          Le traitement des données personnelles collectées sur LlamaKusi est détaillé
          dans notre{" "}
          <a href="/tef-irn/politique-de-confidentialite">
            Politique de confidentialité
          </a>
          .
        </p>
      </div>

      <div>
        <h2>5. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont régies par le droit français. Tout litige
          relève, à défaut de résolution amiable, de la compétence des tribunaux
          français.
        </p>
      </div>
    </LegalPageShell>
  );
}
