import React from "react";
import { LucideIcon } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

interface LegalPageShellProps {
  icon: LucideIcon;
  badge: string;
  title: string;
  lastUpdated: string;
  intro?: string;
  children: React.ReactNode;
}

export function LegalPageShell({
  icon: Icon,
  badge,
  title,
  lastUpdated,
  intro,
  children,
}: LegalPageShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-dark">
      <Header />

      <main className="flex-1 pt-20">
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue/10 dark:bg-white/10 text-brand-blue dark:text-brand-gold text-sm font-bold uppercase tracking-widest mb-6">
              <Icon size={14} />
              {badge}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              {title}
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Dernière mise à jour : {lastUpdated}
            </p>
            {intro && (
              <p className="mt-6 text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                {intro}
              </p>
            )}
          </div>
        </section>

        <section className="pb-24 px-6">
          <div className="max-w-3xl mx-auto space-y-12 text-slate-600 dark:text-slate-300 leading-relaxed [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:dark:text-white [&_h3]:mb-2 [&_h3]:mt-6 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-4 [&_a]:text-brand-blue [&_a]:dark:text-brand-gold [&_a]:font-medium [&_a]:hover:underline [&_strong]:text-slate-900 [&_strong]:dark:text-white">
            {children}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
