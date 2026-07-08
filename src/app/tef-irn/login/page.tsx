"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Chrome, Star, Quote, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Profile } from "@/types/database";

const RadarGraphic = () => (
  <div className="relative w-64 h-64 flex items-center justify-center">
    {[0, 1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className="absolute border border-indigo-500/20 rounded-full"
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: (i + 1) * 80,
          height: (i + 1) * 80,
          opacity: [0, 0.3, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: i * 0.8,
          ease: "linear"
        }}
      />
    ))}
    <div className="relative z-10 w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-500/50">
      M
    </div>
    {/* Animated scanning line */}
    <motion.div
      className="absolute w-32 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-sm"
      animate={{ rotate: 360 }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      style={{ originX: "50%", originY: "0" }}
    />
  </div>
);

function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent, mode: "signin" | "signup") => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        alert("Vérifiez votre boîte mail pour confirmer votre inscription !");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.refresh(); router.push("/tef-irn/dashboard");
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[400px] space-y-8"
    >
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Bienvenue</h1>
        <p className="text-zinc-500 font-medium italic">Le succès au TEF IRN commence ici.</p>
      </div>

      <Button
        variant="outline"
        className="w-full h-14 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
      >
        {googleLoading ? <Loader2 className="animate-spin" size={20} /> : <Chrome size={20} className="text-indigo-600" />}
        Continuer avec Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-100"></span>
        </div>
        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
          <span className="bg-white px-4">OU</span>
        </div>
      </div>

      <Tabs defaultValue="login" className="w-full flex flex-col gap-6">
        <TabsList className="grid w-full grid-cols-2 p-1.5 bg-zinc-100 rounded-2xl h-14">
          <TabsTrigger value="login" className="rounded-xl font-bold data-[active]:bg-white data-[active]:shadow-sm">Connexion</TabsTrigger>
          <TabsTrigger value="signup" className="rounded-xl font-bold data-[active]:bg-white data-[active]:shadow-sm">Inscription</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4">
          <form onSubmit={(e) => handleAuth(e, "signin")} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.fr"
                className="h-14 border-zinc-200 focus:border-indigo-600 rounded-2xl font-bold transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mot de passe</Label>
                <button type="button" className="text-[10px] font-black text-indigo-600 hover:underline">Oublié ?</button>
              </div>
              <Input
                id="password"
                type="password"
                className="h-14 border-zinc-200 focus:border-indigo-600 rounded-2xl font-bold transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg rounded-2xl shadow-xl shadow-zinc-200 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Se connecter"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <form onSubmit={(e) => handleAuth(e, "signup")} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="votre@email.fr"
                className="h-14 border-zinc-200 focus:border-indigo-600 rounded-2xl font-bold transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mot de passe</Label>
              <Input
                id="signup-password"
                type="password"
                className="h-14 border-zinc-200 focus:border-indigo-600 rounded-2xl font-bold transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
              <ShieldCheck className="text-indigo-600 shrink-0" size={20} />
              <p className="text-[11px] text-indigo-700 font-bold leading-tight">
                Accès immédiat à votre première session de coaching IA gratuite après inscription.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Créer mon compte"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-[10px] text-zinc-400 font-medium px-8 leading-relaxed">
        En continuant, vous acceptez nos{" "}
        <Link href="#" className="text-zinc-600 underline font-bold">Conditions</Link>{" "}
        et notre{" "}
        <Link href="#" className="text-zinc-600 underline font-bold">Politique de confidentialité</Link>.
      </p>
    </motion.div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white selection:bg-indigo-100">
      {/* Left Side: Brand Visuals */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-[#050505] relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3" />

        <Link href="/tef-irn" className="relative z-10 flex items-center gap-3 text-white">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black">M</div>
          <span className="font-bold text-xl tracking-tighter">LlamaKusi</span>
        </Link>

        <div className="relative z-10 flex flex-col items-center">
          <RadarGraphic />
          <div className="mt-16 text-center max-w-sm">
            <h2 className="text-4xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              L'excellence du TEF IRN guidée par l'IA.
            </h2>
            <p className="text-zinc-500 text-lg font-medium leading-relaxed">
              Rejoignez des milliers de candidats qui ont réussi grâce à notre coaching adaptatif.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
            <div className="flex gap-1 text-amber-500 mb-6">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <p className="text-white text-xl font-bold leading-relaxed mb-6 italic">
              "LlamaKusi a été la clé de mon succès. L'expression orale m'inquiétait, mais l'IA m'a coaché jusqu'au niveau B2 en quelques semaines seulement."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-lg">JD</div>
              <div>
                <p className="text-white font-bold">Jean D.</p>
                <p className="text-zinc-500 text-xs font-medium">Candidat Naturalisation • Score 580/600</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-12 relative">
        <Suspense fallback={<Loader2 className="animate-spin text-indigo-600" size={32} />}>
          <AuthForm />
        </Suspense>

        {/* Mobile Logo */}
        <div className="mt-12 lg:hidden">
          <Link href="/tef-irn" className="flex items-center gap-2 text-zinc-300 font-bold opacity-50 grayscale hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 bg-zinc-200 rounded-md flex items-center justify-center text-zinc-900 text-[10px]">M</div>
            <span className="text-sm">LlamaKusi</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
