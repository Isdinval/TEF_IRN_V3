"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  level: string;
  category: string;
  order_index: number;
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLessons() {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, level, category, order_index')
        .order('level', { ascending: true })
        .order('order_index', { ascending: true });

      if (data) setLessons(data);
      setLoading(false);
    }
    fetchLessons();
  }, [supabase]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

  const groupedLessons = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.level]) acc[lesson.level] = [];
    acc[lesson.level].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Catalogue des Leçons</h1>
        <p className="text-muted-foreground">Progressez pas à pas du niveau A1 au niveau B2.</p>
      </header>

      <div className="space-y-12">
        {Object.entries(groupedLessons).map(([level, levelLessons]) => (
          <section key={level}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Badge className="bg-indigo-600">Niveau {level}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {levelLessons.map((lesson) => (
                <Card key={lesson.id} className="hover:border-indigo-300 transition-all group cursor-pointer">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                        {lesson.title}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {lesson.category}
                      </CardDescription>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                      <BookOpen size={18} className="text-slate-400 group-hover:text-indigo-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent group-hover:translate-x-1 transition-transform">
                      Commencer la leçon <ChevronRight size={16} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
