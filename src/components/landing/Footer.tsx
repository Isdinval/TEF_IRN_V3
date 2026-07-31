import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: "Plateforme",
      links: [
        { name: "Fonctionnalités", href: "#features" },
        { name: "Vocabulaire", href: "#vocab" },
        { name: "Tarifs", href: "#pricing" },
        { name: "Simulateur TEF", href: "/tef-irn/exam" },
      ]
    },
    {
      title: "Ressources",
      links: [
        { name: "Guides TEF IRN", href: "/tef-irn/guides" },
        { name: "Guides Examen Civique", href: "/examen-civique/guides" },
        { name: "Notre histoire", href: "/tef-irn/notre-histoire" },
        { name: "Test gratuit", href: "/tef-irn/exercice-gratuit" },
      ]
    },
    {
      title: "Légal",
      links: [
        { name: "Conditions d'utilisation", href: "/tef-irn/conditions-utilisation" },
        { name: "Politique de confidentialité", href: "/tef-irn/politique-de-confidentialite" },
        { name: "Mentions légales", href: "/tef-irn/mentions-legales" },
        { name: "Cookies", href: "/tef-irn/cookies" },
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
              La plateforme de préparation à la naturalisation la plus avancée.
              Un coach IA pour l'Examen Civique et les 4 épreuves du TEF IRN.
            </p>
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
            © {currentYear} LlamaKusi. Tous droits réservés.
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
            <span>Fait avec</span>
            <span className="text-red-500">❤️</span>
            <span>à Marseille pour votre nouvelle vie en France</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
