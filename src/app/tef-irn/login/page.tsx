"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Star, Quote, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Profile } from "@/types/database";
import {
  LOGIN_WATERCOLOR_URLS,
  GOOGLE_LOGO_URL,
} from "@/data/login-images";
import { pickRandomImage } from "@/data/grammar-check-images";

// Témoignages orientés résultat, un par palier CECRL du TEF IRN.
// Barème officiel : chaque épreuve notée sur 0-499. Seuils de niveau global :
// A2 >= 200 (3 épreuves) + >= 167 (4e) | B1 >= 300 + >= 267 | B2 >= 400 + >= 367.
const TESTIMONIALS = [
  {
    initials: "YB",
    name: "Youssef B.",
    role: "Niveau A2 · Carte de séjour pluriannuelle",
    score: "214/499",
    text: "En 6 semaines de coaching avec LlamaKusi, j'ai obtenu mon niveau A2. Ma carte de séjour pluriannuelle est signée.",
  },
  {
    initials: "AD",
    name: "Amina D.",
    role: "Niveau B1 · Carte de résident",
    score: "312/499",
    text: "L'entraînement à l'oral m'a débloquée. J'ai décroché mon B1 du premier coup et ma carte de résident de 10 ans.",
  },
  {
    initials: "CM",
    name: "Carlos M.",
    role: "Niveau B2 · Naturalisation",
    score: "428/499",
    text: "La correction détaillée de mes écrits a fait toute la différence. B2 obtenu, dossier de naturalisation déposé.",
  },
] as const;

const RadarGraphic = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
    {[0, 1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className="absolute border border-indigo-400/30 rounded-full"
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: (i + 1) * 50,
          height: (i + 1) * 50,
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
    {/* Animated scanning line */}
    <motion.div
      className="absolute w-20 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-sm"
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
      className="w-full max-w-[400px] space-y-6"
    >
      <div className="space-y-1 text-center lg:text-left">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Bienvenue</h1>
        <p className="text-zinc-500 font-medium italic">Le succès au TEF IRN commence ici.</p>
      </div>

      <Button
        variant="outline"
        className="w-full h-14 bg-white border border-zinc-300 hover:bg-zinc-50 hover:shadow-md text-zinc-700 font-semibold text-[15px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Image src={GOOGLE_LOGO_URL} alt="" width={18} height={18} unoptimized />
        )}
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
  // Tirés une fois au montage : une aquarelle et un témoignage par chargement de page.
  const [backgroundUrl] = useState(() => pickRandomImage(LOGIN_WATERCOLOR_URLS));
  const [testimonial] = useState(
    () => TESTIMONIALS[Math.floor(Math.random() * TESTIMONIALS.length)]
  );

  return (
    <div className="h-screen grid lg:grid-cols-2 bg-white selection:bg-indigo-100 overflow-hidden">
      {/* Left Side: Brand Visuals */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-[#050505] relative overflow-hidden">
        {/* Rotating watercolor background */}
        {backgroundUrl && (
          <Image
            src={backgroundUrl}
            alt=""
            fill
            priority
            className="object-cover object-top"
          />
        )}
        {/* Dark overlay for text legibility over the illustration */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

        <Link href="/tef-irn" className="relative z-10">
          <span className="font-black text-xl tracking-tighter text-white">LlamaKusi</span>
        </Link>

        <div className="relative z-10 flex flex-col items-center">
          <RadarGraphic />
          <div className="mt-6 text-center max-w-sm">
            <h2 className="text-3xl font-black text-white mb-3 leading-[1.1] tracking-tight">
              L'excellence du TEF IRN guidée par l'IA.
            </h2>
            <p className="text-zinc-300 text-base font-medium leading-relaxed">
              Rejoignez des milliers de candidats qui ont réussi grâce à notre coaching adaptatif.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonial.initials}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl"
            >
              <div className="flex gap-1 text-amber-500 mb-3">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-white text-base font-bold leading-relaxed mb-4 italic">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-sm">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{testimonial.name}</p>
                  <p className="text-zinc-400 text-xs font-medium">
                    {testimonial.role} • Score {testimonial.score}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex flex-col justify-center items-center p-6 lg:p-10 relative overflow-y-auto">
        <Suspense fallback={<Loader2 className="animate-spin text-indigo-600" size={32} />}>
          <AuthForm />
        </Suspense>

        {/* Mobile Logo (texte seul, pas d'icône) */}
        <div className="mt-8 lg:hidden">
          <Link href="/tef-irn">
            <span className="font-black text-lg tracking-tighter text-zinc-400">LlamaKusi</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
