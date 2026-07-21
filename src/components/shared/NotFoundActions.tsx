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
        <Link href="/tef-irn/dashboard">
          <Button size="lg">Retour au tableau de bord</Button>
        </Link>
        <Link href="/tef-irn/guides">
          <Button variant="outline" size="lg">Voir les guides TEF IRN</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link href="/tef-irn/">
        <Button size="lg">Découvrir LlamaKusi</Button>
      </Link>
      <Link href="/tef-irn/guides">
        <Button variant="outline" size="lg">Voir les guides gratuits</Button>
      </Link>
    </div>
  );
}
