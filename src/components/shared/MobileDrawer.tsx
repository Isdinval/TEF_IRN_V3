"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { SidebarContent } from "./Sidebar";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Tiroir de navigation mobile/tablette (< md) : réutilise SidebarContent
// telle quelle (mêmes groupes/accordéons/thèmes que la sidebar desktop),
// affichée en panneau glissant depuis la gauche plutôt qu'en colonne fixe.
// État contrôlé depuis l'extérieur : le bouton "Menu" qui l'ouvre vit dans
// MobileBottomNav, pas ici.
export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[110] bg-black/50 md:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-[120] w-[85vw] max-w-xs h-full shadow-2xl md:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full duration-200">
          <DialogPrimitive.Close
            aria-label="Fermer le menu"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-zinc-400 shadow-sm hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
          <SidebarContent variant="mobile" />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
