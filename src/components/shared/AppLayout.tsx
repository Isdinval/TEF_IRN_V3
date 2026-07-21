"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ParcoursTopBar } from "./ParcoursTopBar";
import { StudyHeartbeat } from "./StudyHeartbeat";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";

// Client-only component for the Coach
const ChatCoach = dynamic(() => import("@/components/features/coach/ChatCoach").then(mod => mod.ChatCoach), {
  ssr: false,
});

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Public routes check
  const publicRoutes = [ "/tef-irn/login", "/tef-irn/guides", "/tef-irn/pricing", "/tef-irn/exercice-gratuit", "/tef-irn/placement-test", "/tef-irn/onboarding", "/tef-irn/notre-histoire"];
  const isLandingPage = pathname === "/tef-irn" || pathname === "/tef-irn/";
  const isPublic = pathname ? (isLandingPage || publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) : true;
  const isExam = pathname === "/tef-irn/exam";

  // Case 1: Pure public landing/auth routes or Exam
  if (isPublic || isExam) {
    return (
      <main className="h-full">
        {mounted && user && <StudyHeartbeat />}
        {children}
      </main>
    );
  }

  // Case 2: Anonymous visitor on any non-public route (includes 404 / unmatched URLs)
  if (!user) {
    return (
      <div className="flex flex-col h-full bg-slate-50/30">
        <header className="h-20 border-b bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/tef-irn/login">
              <Button variant="ghost" className="font-bold">Connexion</Button>
            </Link>
            <Link href="/tef-irn/login?mode=signup">
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

  // Case 3: Logged in user (guaranteed by the !user check above)
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen relative pb-20 md:pb-0">
        <ParcoursTopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        {/* Only mount Coach on client side, if not on /coach page AND if user is logged in */}
        {mounted && user && pathname !== "/tef-irn/coach" && (
           <div className="hidden md:block">
             <Suspense fallback={null}>
               <ChatCoach mode="popup" />
             </Suspense>
           </div>
        )}
        {mounted && user && <StudyHeartbeat />}
        <BottomNav />
      </div>
    </div>
  );
}
