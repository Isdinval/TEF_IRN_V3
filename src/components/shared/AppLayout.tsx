"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ParcoursTopBar } from "./ParcoursTopBar";
import React, { Suspense, useEffect, useState } from "react";

// Client-only component for the Coach
const ChatCoach = dynamic(() => import("@/components/features/coach/ChatCoach").then(mod => mod.ChatCoach), {
  ssr: false,
});

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Public routes check
  const publicRoutes = ["/", "/login", "/guides", "/pricing", "/exercice-gratuit", "/placement-test", "/onboarding"];
  const isPublic = pathname ? publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/")) : true;
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
        {/* Only mount Coach on client side and if not on /coach page */}
        {mounted && pathname !== "/coach" && (
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
