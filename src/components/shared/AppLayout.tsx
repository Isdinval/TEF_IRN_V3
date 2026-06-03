"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Routes publiques sans Sidebar
  const publicRoutes = ["/", "/login", "/guides", "/pricing", "/exercice-gratuit", "/placement-test", "/onboarding"];
  const isPublic = publicRoutes.includes(pathname);

  if (isPublic) {
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
