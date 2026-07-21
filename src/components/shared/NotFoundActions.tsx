"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";

export function NotFoundActions() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />;
  }

  if (user) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/tef-irn/dashboard">Retour au tableau de bord</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/tef-irn/guides">Voir les guides TEF IRN</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg">
        <Link href="/tef-irn/">Découvrir LlamaKusi</Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href="/tef-irn/guides">Voir les guides gratuits</Link>
      </Button>
    </div>
  );
}
