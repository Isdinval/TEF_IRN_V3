"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PasswordField } from "@/components/auth/password-field";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setMessage({ type: "success", text: "Mot de passe mis à jour. Redirection..." });
      setTimeout(() => {
        router.push("/tef-irn/dashboard");
      }, 1500);
    } catch (error) {
      setMessage({ type: "error", text: getAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="space-y-1 text-center">
          <Link href="/tef-irn">
            <span className="font-black text-3xl tracking-tight text-zinc-900">LlamaKusi</span>
          </Link>
          <p className="text-zinc-500 font-medium italic">Choisissez votre nouveau mot de passe.</p>
        </div>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "flex items-start gap-2.5 p-4 rounded-2xl text-sm font-bold leading-snug",
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-100"
                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            )}
          >
            {message.type === "error" ? (
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
            ) : (
              <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nouveau mot de passe</Label>
              <PasswordField id="new-password" value={password} onChange={setPassword} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Confirmer le mot de passe</Label>
              <PasswordField id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
            </div>
            <Button
              type="submit"
              className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg rounded-2xl shadow-xl shadow-zinc-200 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        )}

        <p className="text-center text-[11px] text-zinc-400 font-medium">
          <Link href="/tef-irn/login" className="text-zinc-600 underline font-bold">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
