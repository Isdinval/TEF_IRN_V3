"use client";

import { createClient } from "./supabase";

/**
 * Stockage local (localStorage) pour les visiteurs non authentifiés du module Examen Civique.
 * Miroir de user_civic_reviews / civic_exam_attempts (RLS des deux tables exige auth.uid(),
 * un visiteur anonyme ne peut donc pas y écrire) — permet un usage complet sans compte.
 * Utilisé uniquement côté client (examen-civique/page.tsx).
 */

const REVIEWS_KEY = "civic_local_reviews_v1";
const ATTEMPTS_KEY = "civic_local_attempts_v1";
const MAX_LOCAL_ATTEMPTS = 10;

interface LocalReview {
  question_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  consecutive_correct: number;
}

export interface LocalCivicAttempt {
  id: string;
  mention: string;
  score: number;
  total_questions: number;
  passed: boolean;
  duration_seconds: number | null;
  question_ids: string[];
  created_at: string;
}

function readReviews(): Record<string, LocalReview> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(REVIEWS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeReviews(reviews: Record<string, LocalReview>) {
  window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

export function getLocalDueCount(): number {
  const now = Date.now();
  return Object.values(readReviews()).filter((r) => new Date(r.next_review_at).getTime() <= now).length;
}

export function getLocalDueQuestionIds(limit = 20): string[] {
  const now = Date.now();
  return Object.values(readReviews())
    .filter((r) => new Date(r.next_review_at).getTime() <= now)
    .map((r) => r.question_id)
    .slice(0, limit);
}

export function getLocalMasteryMap(): Record<string, "learning" | "mastered"> {
  const map: Record<string, "learning" | "mastered"> = {};
  Object.values(readReviews()).forEach((r) => {
    map[r.question_id] = r.consecutive_correct >= 2 ? "mastered" : "learning";
  });
  return map;
}

// Mirroir exact de l'algorithme SM-2 de updateCivicSRS (civic-srs-engine.ts), sans appel réseau.
export function updateLocalCivicSRS(questionId: string, isCorrect: boolean) {
  const reviews = readReviews();
  const existing = reviews[questionId];

  let interval = 1;
  let ease = existing?.ease_factor ?? 2.5;
  let correctCount = existing?.consecutive_correct ?? 0;

  if (isCorrect) {
    correctCount++;
    if (correctCount === 1) interval = 1;
    else if (correctCount === 2) interval = 6;
    else interval = Math.round((existing?.interval_days || 1) * ease);
    ease = Math.min(3.0, ease + 0.1);
  } else {
    correctCount = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  reviews[questionId] = {
    question_id: questionId,
    next_review_at: nextReview.toISOString(),
    interval_days: interval,
    ease_factor: ease,
    consecutive_correct: correctCount,
  };
  writeReviews(reviews);
}

export function getLocalAttempts(): LocalCivicAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(ATTEMPTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addLocalAttempt(attempt: Omit<LocalCivicAttempt, "id" | "created_at">) {
  const attempts = getLocalAttempts();
  attempts.unshift({ ...attempt, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts.slice(0, MAX_LOCAL_ATTEMPTS)));
}

export function getLastLocalAttemptForMention(mention: string): LocalCivicAttempt | null {
  return getLocalAttempts().find((a) => a.mention === mention) || null;
}

export function hasLocalCivicData(): boolean {
  if (typeof window === "undefined") return false;
  return Object.keys(readReviews()).length > 0 || getLocalAttempts().length > 0;
}

export function clearLocalCivicData() {
  window.localStorage.removeItem(REVIEWS_KEY);
  window.localStorage.removeItem(ATTEMPTS_KEY);
}

/**
 * Migration one-shot : un visiteur anonyme avait de la progression locale (SRS + tentatives
 * d'examen) et vient de se connecter / créer un compte. On bascule tout vers Supabase puis on
 * vide le local storage, pour ne pas perdre sa progression au moment le plus mauvais possible.
 */
export async function migrateLocalCivicDataToSupabase(userId: string) {
  const reviews = readReviews();
  const attempts = getLocalAttempts();
  if (Object.keys(reviews).length === 0 && attempts.length === 0) return;

  const supabase = createClient();

  await Promise.all(
    Object.values(reviews).map((r) =>
      supabase.from("user_civic_reviews").upsert(
        {
          user_id: userId,
          question_id: r.question_id,
          next_review_at: r.next_review_at,
          interval_days: r.interval_days,
          ease_factor: r.ease_factor,
          consecutive_correct: r.consecutive_correct,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,question_id" }
      )
    )
  );

  if (attempts.length > 0) {
    await supabase.from("civic_exam_attempts").insert(
      attempts.map((a) => ({
        user_id: userId,
        mention: a.mention,
        score: a.score,
        total_questions: a.total_questions,
        passed: a.passed,
        duration_seconds: a.duration_seconds,
        question_ids: a.question_ids,
        created_at: a.created_at,
      }))
    );
  }

  clearLocalCivicData();
}

// ─── Streak civique ────────────────────────────────────────────────────────────
// Stocke la date ISO de la dernière session (YYYY-MM-DD) et calcule le nombre
// de jours consécutifs d'activité. Complètement local — fonctionne pour les
// anonymes et les connectés (le streak TEF IRN est dans profiles.streak_count,
// celui-ci est propre au module civique et ne nécessite pas de colonne supplémentaire).

const STREAK_KEY = "civic_streak_v1";

interface CivicStreakData {
  currentStreak: number;
  lastSessionDate: string; // YYYY-MM-DD
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCivicStreakData(): CivicStreakData {
  if (typeof window === "undefined") return { currentStreak: 0, lastSessionDate: "" };
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (!raw) return { currentStreak: 0, lastSessionDate: "" };
    return JSON.parse(raw) as CivicStreakData;
  } catch {
    return { currentStreak: 0, lastSessionDate: "" };
  }
}

/**
 * À appeler en début de session (SRS ou examen blanc).
 * Si la dernière session date d'hier → incrémente le streak.
 * Si c'est aujourd'hui → ne change rien (déjà compté).
 * Sinon → réinitialise à 1.
 */
export function recordCivicSession(): CivicStreakData {
  const today = todayISO();
  const data = getCivicStreakData();

  if (data.lastSessionDate === today) return data; // déjà enregistré aujourd'hui

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().slice(0, 10);

  const newStreak =
    data.lastSessionDate === yesterdayISO ? data.currentStreak + 1 : 1;

  const updated: CivicStreakData = { currentStreak: newStreak, lastSessionDate: today };
  window.localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Métriques locales ─────────────────────────────────────────────────────────

/** Nombre de questions déjà vues (au moins une fois dans le SRS). */
export function getLocalSeenCount(): number {
  if (typeof window === "undefined") return 0;
  return Object.keys(readReviews()).length;
}

/** Nombre de questions maîtrisées (consecutive_correct >= 2). */
export function getLocalMasteredCount(): number {
  if (typeof window === "undefined") return 0;
  return Object.values(readReviews()).filter((r) => r.consecutive_correct >= 2).length;
}

/**
 * Nombre de questions planifiées dans le futur (vues mais pas encore dues).
 * Utile pour expliquer à l'utilisateur que ses révisions arrivent bientôt.
 */
export function getLocalScheduledCount(): number {
  if (typeof window === "undefined") return 0;
  const now = Date.now();
  return Object.values(readReviews()).filter(
    (r) => new Date(r.next_review_at).getTime() > now
  ).length;
}
