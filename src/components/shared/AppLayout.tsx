"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ParcoursTopBar } from "./ParcoursTopBar";
import { ChatCoach } from "@/components/features/coach/ChatCoach";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Routes publiques sans Sidebar
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
      <div className="flex-1 flex flex-col min-h-screen relative pb-20 md:pb-0">
        <ParcoursTopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        {/* Popup Coach IA (désactivé sur la page coach complète) */}
        {pathname !== "/coach" && (
           <div className="hidden md:block">
             <ChatCoach mode="popup" />
           </div>
        )}
        <BottomNav />
      </div>
    </div>
  );
}
