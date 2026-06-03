"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Chrome } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
    setGoogleLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
    else alert("Vérifiez votre boîte mail !");
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else router.push("/dashboard");
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px]"
      >
        <div className="flex items-center justify-center gap-2 font-black text-3xl text-primary mb-12">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">M</div>
          Maitris
        </div>

        <Card className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 p-4">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-black font-heading tracking-tight">Content de vous revoir</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Prêt pour votre séance de coaching ?</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-2xl h-14">
                <TabsTrigger value="login" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Connexion</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                    <Input id="email" type="email" placeholder="nom@exemple.fr" className="h-14 rounded-xl border-slate-200 focus:border-primary transition-all font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mot de passe</Label>
                      <button type="button" className="text-[10px] font-black text-primary hover:underline">Oublié ?</button>
                    </div>
                    <Input id="password" type="password" className="h-14 rounded-xl border-slate-200 focus:border-primary transition-all font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-black rounded-xl shadow-xl shadow-primary/20" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                    <Input id="signup-email" type="email" placeholder="nom@exemple.fr" className="h-14 rounded-xl border-slate-200 focus:border-primary transition-all font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mot de passe</Label>
                    <Input id="signup-password" type="password" className="h-14 rounded-xl border-slate-200 focus:border-primary transition-all font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-black rounded-xl shadow-xl shadow-primary/20" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : "Créer mon compte"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                <span className="bg-white px-4">OU</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-14 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Chrome className="mr-2" size={20} />}
              Continuer avec Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 text-center pb-8 pt-4">
             <p className="text-xs text-slate-400 font-medium px-8">
               En continuant, vous acceptez nos <span className="text-primary hover:underline cursor-pointer">Conditions d'utilisation</span> et notre <span className="text-primary hover:underline cursor-pointer">Politique de confidentialité</span>.
             </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
