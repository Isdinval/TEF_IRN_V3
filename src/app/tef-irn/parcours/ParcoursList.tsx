"use client";

import { useState } from "react";
import Link from "next/link";
import { AlignLeft, ArrowRight, BookOpen, ChevronRight, Clock, Languages, Sparkles } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Parcours, ParcoursProgress } from "@/lib/parcours";
import { PageTransition } from "@/components/shared/Animations";

export interface ParcoursWithProgress extends Parcours {
  progress?: ParcoursProgress;
  lessonCount?: number;
  nextLesson?: { slug: string; title: string } | null;
}

// Catégorie = icône neutre, jamais une couleur (seul l'indigo porte l'état).
const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  conjugaison: Clock,
  grammaire: BookOpen,
  syntaxe: AlignLeft,
  vocabulaire: Languages,
};

// Un parcours est "commencé" dès qu'il est démarré (status/started_at) ou qu'une leçon est faite,
// même à 0 % : même règle pour le classement en sections et pour les libellés d'action.
const isDone = (p: ParcoursWithProgress) => p.progress?.percent === 100;
const isStarted = (p: ParcoursWithProgress) =>
  p.progress?.status === "in_progress" || p.progress?.started_at != null || (p.progress?.percent ?? 0) > 0;

const titleOf = (p: ParcoursWithProgress) => p.nom_parcours?.trim() || `${p.category} ${p.level}`;
// Titres de leçon SEO "Titre au TEF IRN | accroche" : on garde la partie courte (même règle que Ma progression).
const shortLessonTitle = (title: string) => title.split(" | ")[0].replace(/\s+au TEF IRN$/i, "");
const hrefOf = (p: ParcoursWithProgress) => `/tef-irn/parcours/${p.slug}`;

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      className="h-1.5 w-full rounded-full bg-zinc-100"
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="text-sm font-bold text-zinc-900">
      {title} <span className="font-normal text-zinc-400">· {count}</span>
    </h2>
  );
}

function ParcoursRow({ p, action, detail, recommended }: { p: ParcoursWithProgress; action: string; detail?: string; recommended?: boolean }) {
  const Icon = CATEGORY_ICONS[p.category?.toLowerCase()] ?? BookOpen;
  const count = p.lessonCount ?? 0;

  return (
    <li>
      <Link href={hrefOf(p)} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50">
        <Icon className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 first-letter:uppercase group-hover:text-indigo-600">{titleOf(p)}</p>
          <p className="text-xs text-zinc-500">
            <span className="capitalize">{p.category}</span> · {p.level}
            {detail ? ` · ${detail}` : count > 0 && ` · ${count} leçons`}
          </p>
        </div>
        {recommended && (
          <span className="shrink-0 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">Conseillé</span>
        )}
        <span className="hidden shrink-0 text-xs font-medium text-zinc-500 group-hover:text-indigo-600 sm:inline">{action}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-indigo-600" aria-hidden />
      </Link>
    </li>
  );
}

function ResumeCard({ p }: { p: ParcoursWithProgress }) {
  const prog = p.progress;
  // timeZone fixé : rendu identique serveur/client (pas d'erreur d'hydratation).
  const startedLabel = prog?.started_at
    ? new Date(prog.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })
    : null;

  return (
    <section aria-labelledby="reprendre-title" className="mb-10 rounded-2xl border-2 border-indigo-600 bg-white p-6">
      <p id="reprendre-title" className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
        Reprendre
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs text-zinc-500">
            {p.level} · <span className="capitalize">{p.category}</span>
            {startedLabel && ` · commencé le ${startedLabel}`}
          </p>
          <h3 className="text-lg font-bold text-zinc-900 first-letter:uppercase">{titleOf(p)}</h3>
          {p.nextLesson && (
            <p className="text-sm text-zinc-600">
              Prochaine leçon : <span className="font-semibold text-zinc-900">{shortLessonTitle(p.nextLesson.title)}</span>
            </p>
          )}
          {prog && (
            <div className="flex max-w-sm items-center gap-3 pt-2">
              <ProgressBar percent={prog.percent} label={`Progression du parcours ${titleOf(p)}`} />
              <span className="shrink-0 text-xs text-zinc-500">{prog.completed}/{prog.total} leçons</span>
            </div>
          )}
        </div>
        <Link
          href={hrefOf(p)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
        >
          Continuer <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

export default function ParcoursList({
  allParcours,
  user
}: {
  allParcours: ParcoursWithProgress[];
  user: User | null;
}) {
  // Le plus récemment démarré en tête : c'est lui que "Reprendre" met en avant.
  const enCours = allParcours
    .filter(p => !isDone(p) && isStarted(p))
    .sort((a, b) => (b.progress?.started_at ?? "").localeCompare(a.progress?.started_at ?? ""));
  const termines = allParcours.filter(isDone);
  const aDecouvrir = allParcours.filter(p => !isDone(p) && !isStarted(p));
  const [current, ...otherEnCours] = enCours;

  const levels = [...new Set(allParcours.map(p => p.level))].sort();
  // Niveau par défaut : celui du parcours en cours, sinon le premier niveau non terminé.
  const focusLevel =
    current?.level ?? levels.find(l => allParcours.some(p => p.level === l && !isDone(p))) ?? levels[0];
  const [activeLevel, setActiveLevel] = useState(focusLevel);

  // Prochain parcours logique : premier non commencé du niveau de travail.
  const recommended = user ? (aDecouvrir.find(p => p.level === focusLevel) ?? aDecouvrir[0]) : undefined;

  const ofActiveLevel = allParcours.filter(p => p.level === activeLevel);
  const doneInLevel = ofActiveLevel.filter(isDone).length;
  const toDiscover = aDecouvrir.filter(p => p.level === activeLevel);

  return (
    <PageTransition>
      <article className="min-h-screen bg-zinc-50/50 p-6 pt-10 lg:p-12" aria-label="Liste des parcours TEF IRN">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10">
            <Badge className="mb-3 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
              {user ? "Mes Parcours" : "Parcours de formation"}
            </Badge>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter mb-2 uppercase">
              {user ? (
                <>Votre <span className="text-indigo-600">apprentissage</span> sur mesure</>
              ) : (
                <>Des parcours <span className="text-indigo-600">d&apos;apprentissage</span> optimisés</>
              )}
            </h1>
            <p className="max-w-2xl text-sm font-medium text-slate-500 leading-relaxed">
              Suivez votre progression étape par étape à travers nos modules spécialisés pour réussir le TEF IRN.
            </p>
            {user && (
              <Link href="/tef-irn/progression" className="mt-2 inline-block text-sm font-medium text-indigo-600 underline-offset-2 hover:underline">
                Voir le détail dans Ma progression
              </Link>
            )}
          </header>

          {current && <ResumeCard p={current} />}

          {otherEnCours.length > 0 && (
            <section className="mb-10 space-y-3">
              <SectionTitle title="Autres parcours en cours" count={otherEnCours.length} />
              <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                {otherEnCours.map(p => (
                  <ParcoursRow
                    key={p.id}
                    p={p}
                    action="Continuer"
                    detail={p.progress ? `${p.progress.completed}/${p.progress.total} leçons` : undefined}
                  />
                ))}
              </ul>
            </section>
          )}

          {allParcours.length > 0 && (
            <section className="space-y-3">
              <SectionTitle title={user ? "À découvrir" : "Tous les parcours"} count={user ? aDecouvrir.length : allParcours.length} />

              <Tabs value={activeLevel} onValueChange={(value) => setActiveLevel(String(value))}>
                <TabsList className="w-full h-10!">
                  {levels.map(l => {
                    const ofLevel = allParcours.filter(p => p.level === l);
                    return (
                      <TabsTrigger key={l} value={l}>
                        {l}
                        {user && (
                          <span className="text-xs font-normal text-zinc-400">
                            {ofLevel.filter(isDone).length}/{ofLevel.length}
                          </span>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {user && ofActiveLevel.length > 0 && (
                <div className="flex items-center gap-3">
                  <p className="shrink-0 text-xs text-zinc-500">
                    Niveau {activeLevel} · {doneInLevel}/{ofActiveLevel.length} parcours terminés
                  </p>
                  <div className="max-w-xs flex-1">
                    <ProgressBar
                      percent={Math.round((doneInLevel / ofActiveLevel.length) * 100)}
                      label={`Parcours terminés du niveau ${activeLevel}`}
                    />
                  </div>
                </div>
              )}

              {toDiscover.length > 0 ? (
                <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  {toDiscover.map(p => (
                    <ParcoursRow key={p.id} p={p} action="Commencer" recommended={p.id === recommended?.id} />
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
                  Tous les parcours du niveau {activeLevel} sont commencés ou terminés.
                </p>
              )}
            </section>
          )}

          {termines.length > 0 && (
            <details className="group/done mt-10">
              <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-zinc-400 transition-transform group-open/done:rotate-90" aria-hidden />
                <SectionTitle title="Terminés" count={termines.length} />
              </summary>
              <ul className="mt-3 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                {termines.map(p => (
                  <ParcoursRow key={p.id} p={p} action="Revoir" />
                ))}
              </ul>
            </details>
          )}

          {allParcours.length === 0 && (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-zinc-200">
              <Sparkles className="mx-auto text-zinc-200 mb-6" size={48} />
              <h2 className="text-lg font-black text-zinc-900 mb-2">Aucun parcours disponible</h2>
              <p className="text-zinc-400 font-bold">Les leçons arrivent bientôt !</p>
            </div>
          )}
        </div>
      </article>
    </PageTransition>
  );
}
