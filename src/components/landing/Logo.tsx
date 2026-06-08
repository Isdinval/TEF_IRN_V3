import React from "react";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-blue dark:bg-brand-purple rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-blue/20">
        M
      </div>
      <span className="font-black text-xl md:text-2xl tracking-tighter text-slate-900 dark:text-white">
        Maitris
      </span>
    </Link>
  );
}
