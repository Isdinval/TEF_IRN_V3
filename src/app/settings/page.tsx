"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, CreditCard, Bell, Shield, LogOut, Sparkles, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Profile } from "@/types/database";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile({
            ...data,
            email: user.email
          } as Profile);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        goal_level: profile.goal_level,
      }).eq('id', user.id);

      if (error) alert(error.message);
      else {
        setMessage("Profil mis à jour !");
        setTimeout(() => setMessage(""), 3000);
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 flex justify-center h-screen items-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 selection:bg-indigo-100">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Paramètres</h1>
          <p className="text-muted-foreground font-medium">Gérez votre compte et vos préférences d'apprentissage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-2 bg-indigo-50 text-indigo-600 font-bold"><User size={18} /> Profil</Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-slate-500 font-bold"><CreditCard size={18} /> Abonnement</Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-slate-500 font-bold"><Bell size={18} /> Notifications</Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-slate-500 font-bold"><Shield size={18} /> Sécurité</Button>
          <div className="pt-4 mt-4 border-t">
            <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 font-bold" onClick={handleSignOut}>
              <LogOut size={18} /> Déconnexion
            </Button>
          </div>
        </aside>

        <div className="md:col-span-3 space-y-8">
          {/* Subscription Section */}
          <Card className="border-indigo-100 bg-indigo-50/20 overflow-hidden relative rounded-[2rem]">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <Sparkles size={80} className="text-indigo-600" />
             </div>
             <CardHeader className="p-8">
               <div className="flex justify-between items-center">
                 <div>
                   <CardTitle className="text-xl font-bold">Plan Actuel</CardTitle>
                   <CardDescription className="font-medium">
                     {profile?.subscription_tier === 'free' ? "Version gratuite avec accès limité." : "Abonnement Premium Actif."}
                   </CardDescription>
                 </div>
                 <Badge className={`${profile?.subscription_tier === 'free' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white'} px-3 py-1 font-black uppercase tracking-widest text-[10px]`}>
                   {profile?.subscription_tier === 'free' ? 'Gratuit' : 'Premium'}
                 </Badge>
               </div>
             </CardHeader>
             <CardContent className="p-8 pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-500">Utilisation IA</span>
                    <span className="text-indigo-600">{profile?.subscription_tier === 'free' ? 'Limité' : 'Illimité'}</span>
                  </div>
                  {profile?.subscription_tier === 'free' && (
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 w-1/3" />
                    </div>
                  )}
                </div>
             </CardContent>
             <CardFooter className="bg-white/50 border-t border-indigo-100/50 p-6 flex justify-between items-center">
               <p className="text-xs text-indigo-700 font-bold italic">
                 {profile?.subscription_tier === 'free'
                   ? "Débloquez tout le potentiel de l'IA dès maintenant."
                   : "Merci de votre confiance ! Prochain renouvellement automatique."}
               </p>
               {profile?.subscription_tier === 'free' && (
                 <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold rounded-xl" onClick={() => router.push('/pricing')}>
                   Voir les offres
                 </Button>
               )}
             </CardFooter>
          </Card>

          {/* Profile Section */}
          <Card className="rounded-[2rem] border-slate-100">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-bold">Informations Personnelles</CardTitle>
              <CardDescription className="font-medium">Mettez à jour vos informations publiques et vos objectifs.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={updateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nom complet</Label>
                    <Input
                      id="name"
                      className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 transition-all font-bold"
                      value={profile?.full_name || ""}
                      onChange={e => setProfile(p => p ? {...p, full_name: e.target.value} : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                    <Input id="email" value={profile?.email || ""} disabled className="h-12 rounded-xl bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Objectif TEF IRN</Label>
                    <Select
                      value={profile?.goal_level || ""}
                      onValueChange={(val: any) => setProfile(p => p ? {...p, goal_level: val} : null)}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                        <SelectValue placeholder="Choisir un objectif" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-xl shadow-xl z-50">
                        <SelectItem value="A2">Carte de séjour (A2)</SelectItem>
                        <SelectItem value="B1">Carte de résident (B1)</SelectItem>
                        <SelectItem value="B2">Nationalité française (B2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-green-600 font-bold flex items-center gap-2">
                    {message && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><CheckCircle size={18} /> {message}</motion.div>}
                  </div>
                  <Button type="submit" disabled={saving} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-zinc-200">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : "Sauvegarder"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
