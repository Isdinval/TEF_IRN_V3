import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: "Plateforme",
      links: [
        { name: "Fonctionnalités", href: "#features" },
        { name: "Vocabulaire", href: "#vocab" },
        { name: "Tarifs", href: "#pricing" },
        { name: "Simulateur TEF", href: "/exam" },
      ]
    },
    {
      title: "Ressources",
      links: [
        { name: "Guides TEF IRN", href: "/guides" },
        { name: "Blog FLE", href: "#" },
        { name: "Centre d'aide", href: "#" },
        { name: "Test gratuit", href: "/exercice-gratuit" },
      ]
    },
    {
      title: "Légal",
      links: [
        { name: "Conditions d'utilisation", href: "#" },
        { name: "Politique de confidentialité", href: "#" },
        { name: "Mentions légales", href: "#" },
        { name: "Cookies", href: "#" },
      ]
    }
  ];

  return (
    <footer className="bg-slate-50 dark:bg-slate-900/50 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-6 text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              La plateforme de préparation au TEF IRN la plus avancée.
              Propulsée par l'IA pour garantir votre réussite à l'examen de naturalisation et de résidence.
            </p>
            <div className="flex gap-4 mt-8">
              <Link href="#" className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-brand-blue transition-colors shadow-sm">
                <Twitter size={18} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-brand-blue transition-colors shadow-sm">
                <Instagram size={18} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-brand-blue transition-colors shadow-sm">
                <Linkedin size={18} />
              </Link>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">
                {col.title}
              </h4>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-gold font-medium transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-400 text-sm font-bold">
            © {currentYear} SpeakFrance 2026 • Maitris AI. Tous droits réservés.
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
            <span>Fait avec</span>
            <span className="text-red-500">❤️</span>
            <span>à Paris pour les futurs citoyens</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
