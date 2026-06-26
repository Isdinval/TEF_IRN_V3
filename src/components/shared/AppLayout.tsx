"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ParcoursTopBar } from "./ParcoursTopBar";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { Logo } from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";

// Client-only component for the Coach
const ChatCoach = dynamic(() => import("@/components/features/coach/ChatCoach").then(mod => mod.ChatCoach), {
  ssr: false,
});

export function AppLayout({ children, initialUser }: { children: React.ReactNode, initialUser?: User | null }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const user = initialUser;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Public routes check
  const publicRoutes = [ "/TEF_IRN/login", "/TEF_IRN/guides", "/TEF_IRN/pricing", "/TEF_IRN/exercice-gratuit", "/TEF_IRN/placement-test", "/TEF_IRN/onboarding"];
  const isLandingPage = pathname === "/TEF_IRN" || pathname === "/TEF_IRN/";
  const isPublic = pathname ? (isLandingPage || publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) : true;
  const isExam = pathname === "/TEF_IRN/exam";

  // Public content (Lessons & Parcours hub)
  const isPublicContent = pathname?.startsWith('/TEF_IRN/lessons') || pathname?.startsWith('/TEF_IRN/parcours');

  // Case 1: Pure public landing/auth routes or Exam
  if (isPublic || isExam) {
    return <main className="h-full">{children}</main>;
  }

  // Case 2: Anonymous visitor on public content (Lessons, Parcours hub)
  if (isPublicContent && !user) {
    return (
      <div className="flex flex-col h-full bg-slate-50/30">
        <header className="h-20 border-b bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/TEF_IRN/login">
              <Button variant="ghost" className="font-bold">Connexion</Button>
            </Link>
            <Link href="/TEF_IRN/login?mode=signup">
              <Button className="bg-brand-blue hover:bg-brand-blue/90 text-white font-black px-6 rounded-xl shadow-lg shadow-brand-blue/20">
                Essai Gratuit
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  // Case 3: Logged in user OR internal routes (handled by middleware for auth)
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen relative pb-20 md:pb-0">
        <ParcoursTopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        {/* Only mount Coach on client side, if not on /coach page AND if user is logged in */}
        {mounted && user && pathname !== "/TEF_IRN/coach" && (
           <div className="hidden md:block">
             <Suspense fallback={null}>
               <ChatCoach mode="popup" />
             </Suspense>
           </div>
        )}
        <BottomNav />
      </div>
    </div>
  );
}
