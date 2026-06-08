"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Routes publiques sans Sidebar
  // On utilise startsWith ou une regex pour gérer les sous-pages (ex: /guides/slug)
  const publicRoutes = ["/", "/login", "/guides", "/pricing", "/exercice-gratuit", "/placement-test", "/onboarding"];
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  // Masquer la sidebar pendant l'examen pour immersion totale
  const isExam = pathname === "/exam";

  if (isPublic || isExam) {
    return <main className="h-full">{children}</main>;
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
