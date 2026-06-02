"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from "next/navigation";

export default function LessonDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchLesson() {
      const { data } = await supabase.from('lessons').select('*').eq('id', id).single();
      if (data) setLesson(data);

      // Vérifier si déjà complétée
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progress } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', id)
          .single();
        if (progress) setCompleted(true);
      }
      setLoading(false);
    }
    fetchLesson();
  }, [id, supabase]);

  const handleComplete = async () => {
    setCompleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: id });

      // Créditer des XP (ex: 50 XP par leçon)
      const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single();
      await supabase.from('profiles').update({ total_xp: (profile?.total_xp || 0) + 50 }).eq('id', user.id);

      setCompleted(true);
      setTimeout(() => router.push('/lessons'), 1500);
    }
    setCompleting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  if (!lesson) return <div className="p-8 text-center">Leçon non trouvée.</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link href="/lessons" className="flex items-center gap-2 text-muted-foreground hover:text-indigo-600 transition-colors mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour au catalogue
      </Link>

      <article className="space-y-8">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-600">Niveau {lesson.level}</Badge>
            <Badge variant="outline" className="capitalize">{lesson.category}</Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">{lesson.title}</h1>
        </header>

        <Card className="border-none shadow-none bg-white p-8 rounded-2xl border border-slate-100">
          <div className="prose prose-indigo max-w-none prose-headings:font-black prose-p:text-slate-600 prose-li:text-slate-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lesson.content}
            </ReactMarkdown>
          </div>
        </Card>

        <footer className="pt-8">
          <Button
            size="lg"
            className={`w-full h-16 text-lg font-bold rounded-2xl transition-all ${completed ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100'}`}
            onClick={handleComplete}
            disabled={completing || completed}
          >
            {completing ? <Loader2 className="animate-spin mr-2" /> : completed ? <><CheckCircle2 className="mr-2" /> Leçon terminée ! (+50 XP)</> : "J'ai bien compris cette leçon"}
          </Button>
        </footer>
      </article>
    </div>
  );
}
