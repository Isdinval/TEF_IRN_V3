"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ChevronRight, GraduationCap, MapPin, Scale } from "lucide-react";

export default function GuidesPage() {
  const guides = [
    {
      title: "Tout comprendre au TEF IRN 2025",
      desc: "Niveaux, épreuves et critères de notation pour la nationalité et le séjour.",
      icon: GraduationCap,
      tag: "Officiel",
      read: "5 min"
    },
    {
      title: "Réussir l'Expression Orale Section A",
      desc: "Comment poser des questions pertinentes et garder son calme face à l'examinateur.",
      icon: BookOpen,
      tag: "Pédagogie",
      read: "8 min"
    },
    {
      title: "Préparer sa naturalisation française",
      desc: "Le guide complet des démarches administratives et du niveau de langue requis.",
      icon: Scale,
      tag: "Démarches",
      read: "12 min"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-8 pt-20">
      <header className="mb-16 text-center">
        <h1 className="text-5xl font-black tracking-tight mb-4">Guides & Ressources TEF IRN</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tout ce dont vous avez besoin pour comprendre l'examen et réussir vos démarches administratives en France.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {guides.map((guide, i) => (
          <Card key={i} className="group hover:border-indigo-600 transition-all cursor-pointer overflow-hidden border-2 border-slate-100 shadow-none rounded-3xl">
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <guide.icon size={28} />
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-500">{guide.tag}</Badge>
              </div>
              <CardTitle className="text-2xl font-black group-hover:text-indigo-600 transition-colors">{guide.title}</CardTitle>
              <CardDescription className="text-lg leading-relaxed mt-2">{guide.desc}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex justify-between items-center text-sm font-bold text-slate-400">
               <div className="flex items-center gap-2">
                 <Clock size={16} /> {guide.read} de lecture
               </div>
               <div className="flex items-center gap-1 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                 Lire le guide <ChevronRight size={16} />
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-24 p-12 bg-indigo-600 rounded-[3rem] text-white text-center">
        <h2 className="text-3xl font-black mb-4">Prêt à passer à l'action ?</h2>
        <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">
          Ne vous contentez pas de lire. Entraînez-vous avec notre Coach IA et obtenez votre certificat TEF IRN du premier coup.
        </p>
        <Link href="/login">
          <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-black rounded-2xl">
            Commencer l'entraînement gratuit
          </Button>
        </Link>
      </section>
    </div>
  );
}
