import React from "react";
import Link from "next/link";
import { Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { contactEmail, socialLinks } from "@/lib/site";
import { Logo } from "./Logo";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<(typeof socialLinks)[number]["id"], React.ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  linkedin: Linkedin,
  instagram: Instagram,
  tiktok: TikTokIcon,
};

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
            <ul className="mt-6 flex items-center gap-2" aria-label="Réseaux sociaux LlamaKusi">
              {socialLinks.map((link) => {
                const Icon = SOCIAL_ICONS[link.id];
                return (
                  <li key={link.id}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`LlamaKusi sur ${link.name} (nouvel onglet)`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  </li>
                );
              })}
            </ul>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-indigo-600"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {contactEmail}
            </a>
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
