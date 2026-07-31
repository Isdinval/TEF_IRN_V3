"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CivicActionCardProps {
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconText: string;
  title: string;
  description: string;
  ctaLabel: string;
  // Info contextuelle optionnelle (ex: décompte de révisions dues, meilleur
  // score) affichée sous la description, avant le bouton.
  extra?: React.ReactNode;
}

export function CivicActionCard({ href, icon: Icon, iconBg, iconText, title, description, ctaLabel, extra }: CivicActionCardProps) {
  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8 space-y-6">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconBg} ${iconText}`}>
          <Icon size={28} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-zinc-900 tracking-tight">{title}</h3>
          <p className="text-sm font-medium text-zinc-500 leading-relaxed">{description}</p>
        </div>
        {extra}
        <Link href={href}>
          <Button className="h-14 w-full rounded-2xl bg-zinc-900 font-black text-sm text-white hover:bg-black transition-all flex items-center justify-center gap-2">
            {ctaLabel} <ArrowRight size={18} />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
