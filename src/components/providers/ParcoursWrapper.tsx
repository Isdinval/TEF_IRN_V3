"use client";

import { Suspense } from "react";
import { ParcoursProvider } from "@/contexts/ParcoursContext";

export function ParcoursWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ParcoursProvider>{children}</ParcoursProvider>
    </Suspense>
  );
}
