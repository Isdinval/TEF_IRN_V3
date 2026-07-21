import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  /** Utiliser sur un fond sombre (ex: panneau gauche de /login) */
  dark?: boolean;
}

export function Logo({ dark = false }: LogoProps) {
  return (
    <Link href="/tef-irn" className="flex items-center gap-2">
      <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-lg">
        <Image
          src="/logo.png"
          alt="LlamaKusi Logo"
          fill
          className="object-cover"
        />
      </div>
      <span
        className={`font-black text-xl md:text-2xl tracking-tighter ${
          dark ? "text-white" : "text-slate-900 dark:text-white"
        }`}
      >
        LlamaKusi
      </span>
    </Link>
  );
}
