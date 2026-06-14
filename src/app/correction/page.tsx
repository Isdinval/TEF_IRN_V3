"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseAttempt } from "@/types/writing";
import { CorrectionStats } from "./components/CorrectionStats";
import { CorrectionFilters } from "./components/CorrectionFilters";
import { CorrectionList } from "./components/CorrectionList";
import { CorrectionDetailView } from "./components/CorrectionDetailView";

const ITEMS_PER_PAGE = 10;

export default function CorrectionHistoryPage() {
  const [attempts, setAttempts] = useState<ExerciseAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<ExerciseAttempt | null>(null);
  const [user, setUser] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isExporting, setIsExporting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
  }, [supabase, router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const loadAttempts = useCallback(async (isInitial = false) => {
    if (!user) return;

    if (isInitial) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }

    const start = isInitial ? 0 : (page + 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('exercise_attempts')
      .select('*, exercise:exercises(*)')
      .eq('user_id', user.id)
      .not('answers->feedback', 'is', null);

    // Sorting
    if (sortBy === "newest") query = query.order('created_at', { ascending: false });
    if (sortBy === "oldest") query = query.order('created_at', { ascending: true });
    if (sortBy === "score_desc") query = query.order('score', { ascending: false });
    if (sortBy === "score_asc") query = query.order('score', { ascending: true });

    const { data, error } = await query.range(start, end);

    if (error) {
      console.error("Error loading attempts:", error);
    } else {
      const typedData = data as unknown as ExerciseAttempt[];
      if (isInitial) {
        setAttempts(typedData);
      } else {
        setAttempts(prev => [...prev, ...typedData]);
        setPage(prev => prev + 1);
      }
      setHasMore(typedData.length === ITEMS_PER_PAGE);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [user, page, sortBy, supabase]);

  useEffect(() => {
    if (user) {
      loadAttempts(true);
    }
  }, [user, sortBy]); // Level and search are handled client-side for better UX in this version

  const filteredAttempts = useMemo(() => {
    return attempts.filter(attempt => {
      const feedback = attempt.answers.feedback;
      const attemptLevel = (feedback as any)?.level || "B1";
      const subject = attempt.answers.subject || attempt.exercise?.instructions || "";
      const comment = (feedback as any)?.conseil_general || (feedback as any)?.comment || "";

      const matchesSearch = search === "" ||
        subject.toLowerCase().includes(search.toLowerCase()) ||
        comment.toLowerCase().includes(search.toLowerCase());

      const matchesLevel = level === "all" || attemptLevel === level;

      return matchesSearch && matchesLevel;
    });
  }, [attempts, search, level]);

  const handleRestart = (attempt: ExerciseAttempt) => {
    const subject = attempt.answers.subject || attempt.exercise?.instructions || "";
    const exerciseId = attempt.exercise_id;
    const level = (attempt.answers.feedback as any)?.level || "B1";

    const params = new URLSearchParams();
    if (exerciseId) params.append("id", exerciseId);
    if (subject) params.append("subject", subject);
    if (level) params.append("level", level);

    router.push(`/writing?${params.toString()}`);
  };

  const handleExport = async (attempt: ExerciseAttempt) => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/correction/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id }),
      });
      const { pdf, error } = await response.json();
      if (error) throw new Error(error);

      // Download the PDF
      const link = document.createElement("a");
      link.href = pdf;
      link.download = `Correction_TEF_IRN_${new Date(attempt.created_at).toISOString().split('T')[0]}.pdf`;
      link.click();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/50">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
          <Loader2 className="relative animate-spin text-indigo-600 mb-6" size={48} />
        </div>
        <p className="animate-pulse text-sm font-black uppercase tracking-[0.3em] text-zinc-400">
          Chargement de votre réussite...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/30 selection:bg-indigo-100">
      <div className="mx-auto max-w-6xl p-6 pt-12 lg:p-12">
        <AnimatePresence mode="wait">
          {!selectedAttempt ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div className="space-y-4">
                  <Badge className="rounded-full border-none bg-indigo-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 text-white">
                    Progression
                  </Badge>
                  <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900 leading-tight">
                    HISTORIQUE <br /> DES <span className="text-indigo-600">CORRECTIONS</span>
                  </h1>
                  <p className="max-w-xl text-lg font-medium leading-relaxed text-zinc-500">
                    Analysez vos performances, identifiez vos erreurs récurrentes et progressez vers votre certification TEF IRN.
                  </p>
                </div>
                <Link href="/writing">
                  <Button className="h-16 rounded-[2rem] bg-zinc-900 px-8 font-black text-white shadow-2xl shadow-zinc-200 hover:bg-zinc-800 transition-all active:scale-95 group">
                    Nouvelle rédaction
                    <Sparkles className="ml-3 group-hover:rotate-12 transition-transform" size={20} />
                  </Button>
                </Link>
              </header>

              {attempts.length > 0 && (
                <CorrectionStats attempts={attempts} />
              )}

              <div className="space-y-6">
                <CorrectionFilters
                  search={search}
                  setSearch={setSearch}
                  level={level}
                  setLevel={setLevel}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />

                <CorrectionList
                  attempts={filteredAttempts}
                  onSelect={setSelectedAttempt}
                  isLoading={loadingMore}
                  hasMore={hasMore}
                  onLoadMore={() => loadAttempts(false)}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <CorrectionDetailView
                attempt={selectedAttempt}
                onBack={() => setSelectedAttempt(null)}
                onRestart={handleRestart}
                onExport={handleExport}
                isExporting={isExporting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
