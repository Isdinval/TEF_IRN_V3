'use client';

import * as React from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Continuer',
  cancelLabel = 'Annuler',
  onConfirm,
}: ConfirmDialogProps) {
  // Empêche un double-clic (ou double-tap mobile) sur "Confirmer" de
  // déclencher onConfirm plusieurs fois pendant que la modale se ferme :
  // le bouton est désactivé dès le premier clic, et réarmé à chaque
  // réouverture de la modale.
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setIsSubmitting(false);
  }, [open]);

  const handleConfirm = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Popup className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-3xl bg-white p-6 shadow-2xl shadow-zinc-300/50 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <AlertTriangle size={22} />
          </div>
          <AlertDialog.Title className="text-lg font-black text-zinc-900 mb-1.5">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-zinc-500 font-medium mb-6">
            {description}
          </AlertDialog.Description>
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-2xl border border-zinc-200 text-zinc-600 font-bold text-sm hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {confirmLabel}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
