"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Profile } from "@/types/database";
import {
  LOGIN_WATERCOLOR_URLS,
  GOOGLE_LOGO_URL,
} from "@/data/login-images";
import { pickRandomImage } from "@/data/grammar-check-images";
import { PERSONAS } from "@/data/personas";
import { cn } from "@/lib/utils";
import { PasswordField } from "@/components/auth/password-field";
import { getAuthErrorMessage } from "@/lib/auth-errors";

// Carousel de témoignages : personas illustratifs partagés avec la landing
// (src/data/personas.ts). Le niveau A2/CSP n'a pas encore de persona dédié,
// donc on n'affiche ici que B1/B2 en attendant.
const LOGIN_PERSONAS = PERSONAS.filter((p) => p.level !== "A2");

// Durée d'affichage de chaque témoignage avant rotation automatique.
const TESTIMONIAL_ROTATION_MS = 6000;

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
  const [formMessage, setFormMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);

    const errorCode = searchParams.get("error_code");
    if (errorCode === "otp_expired") {
      setFormMessage({
        type: "error",
        text: "Ce lien a expiré ou a déjà été utilisé. Redemandez un nouveau lien ci-dessous.",
      });
      setForgotPasswordMode(true);
    } else if (errorCode) {
      setFormMessage({ type: "error", text: "Une erreur est survenue avec ce lien. Réessayez." });
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setFormMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setFormMessage({ type: "error", text: getAuthErrorMessage(error) });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent, mode: "signin" | "signup") => {
    e.preventDefault();
    setLoading(true);
    setFormMessage(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setFormMessage({
          type: "success",
          text: "Vérifiez votre boîte mail pour confirmer votre inscription !",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.refresh(); router.push("/tef-irn/dashboard");
      }
    } catch (error) {
      setFormMessage({ type: "error", text: getAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormMessage(null);
    try {
      // redirectTo pointe directement vers la destination finale
      // (/auth/reset-password) : c'est cette valeur que le template email
      // (Supabase Dashboard > Auth > Email Templates > Reset Password)
      // récupère via {{ .RedirectTo }} pour construire le lien de
      // confirmation vers /auth/confirm?token_hash=...&type=recovery&next=...
      // (voir src/app/auth/confirm/route.ts). On n'utilise plus l'endpoint
      // GoTrue public {{ .ConfirmationURL }} pour éviter qu'il soit consommé
      // par les scanners de liens des clients mail avant le clic réel.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setFormMessage({
        type: "success",
        text: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
      });
    } catch (error) {
      setFormMessage({ type: "error", text: getAuthErrorMessage(error) });
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
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
          {forgotPasswordMode ? "Mot de passe oublié" : "Bienvenue"}
        </h1>
        <p className="text-zinc-500 font-medium italic">
          {forgotPasswordMode
            ? "Recevez un lien par email pour le réinitialiser."
            : "Le succès au TEF IRN commence ici."}
        </p>
      </div>

      {formMessage && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-start gap-2.5 p-4 rounded-2xl text-sm font-bold leading-snug",
            formMessage.type === "error"
              ? "bg-red-50 text-red-700 border border-red-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          )}
        >
          {formMessage.type === "error" ? (
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
          ) : (
            <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
          )}
          <span>{formMessage.text}</span>
        </div>
      )}

      {forgotPasswordMode ? (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="nom@exemple.fr"
              className="h-14 border-zinc-200 focus:border-indigo-600 rounded-2xl font-bold transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg rounded-2xl shadow-xl shadow-zinc-200 transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Envoyer le lien"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setFormMessage(null);
              setForgotPasswordMode(false);
            }}
            className="w-full text-center text-[11px] font-bold text-zinc-500 hover:text-zinc-700"
          >
            ← Retour à la connexion
          </button>
        </form>
      ) : (
        <>
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
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mot de passe</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormMessage(null);
                        setForgotPasswordMode(true);
                      }}
                      className="text-[10px] font-black text-indigo-600 hover:underline"
                    >
                      Oublié ?
                    </button>
                  </div>
                  <PasswordField id="password" value={password} onChange={setPassword} autoComplete="current-password" />
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
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mot de passe</Label>
                  <PasswordField id="signup-password" value={password} onChange={setPassword} autoComplete="new-password" />
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
        </>
      )}

      <p className="text-center text-[10px] text-zinc-400 font-medium px-8 leading-relaxed">
        En continuant, vous acceptez nos{" "}
        <Link href="/tef-irn/conditions-utilisation" target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline font-bold">Conditions</Link>{" "}
        et notre{" "}
        <Link href="/tef-irn/politique-de-confidentialite" target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline font-bold">Politique de confidentialité</Link>.
      </p>
    </motion.div>
  );
}

export default function AuthPage() {
  // Tirée une fois au montage : une aquarelle de fond par chargement de page.
  const [backgroundUrl] = useState(() => pickRandomImage(LOGIN_WATERCOLOR_URLS));

  // Carousel de témoignages : index de départ aléatoire, puis rotation automatique.
  const [testimonialIndex, setTestimonialIndex] = useState(() =>
    Math.floor(Math.random() * LOGIN_PERSONAS.length)
  );

  useEffect(() => {
    if (LOGIN_PERSONAS.length <= 1) return;
    const interval = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % LOGIN_PERSONAS.length);
    }, TESTIMONIAL_ROTATION_MS);
    return () => clearInterval(interval);
  }, []);

  const testimonial = LOGIN_PERSONAS[testimonialIndex];

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
          <span className="font-black text-5xl tracking-tight text-white">LlamaKusi</span>
        </Link>

        <div className="relative z-10 flex flex-col items-center">
          <RadarGraphic />
          <div className="mt-6 text-center max-w-md">
            <h2 className="text-4xl font-black text-white mb-4 leading-[1.1] tracking-tight">
              L'excellence du TEF IRN guidée par l'IA.
            </h2>
            <p className="text-zinc-300 text-lg font-medium leading-relaxed">
              Rejoignez des milliers de candidats qui ont réussi grâce à notre coaching adaptatif.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-[2rem] shadow-2xl flex gap-4"
            >
              <div className="relative w-24 h-24 shrink-0">
                <Image
                  src={testimonial.image}
                  alt={`Portrait aquarelle de ${testimonial.name}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="min-w-0">
                <p className="text-white text-base font-bold leading-relaxed mb-2 italic">
                  "{testimonial.loginQuote}"
                </p>
                <p className="text-white font-bold text-sm">{testimonial.name}</p>
                <p className="text-zinc-400 text-xs font-medium">{testimonial.role}</p>
                <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mt-1">
                  Profil illustratif
                </p>
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
