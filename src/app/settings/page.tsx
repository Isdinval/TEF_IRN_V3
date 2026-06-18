"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, CreditCard, Bell, Shield, LogOut, Sparkles, CheckCircle, Camera, Trash2, Key, Smartphone, AlertTriangle, Menu, X, ChevronRight, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Profile, UserPreferences } from "@/types/database";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SettingsSection = "profile" | "subscription" | "notifications" | "security";

function SettingsContent() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const section = searchParams.get("section") as SettingsSection;
    if (section && ["profile", "subscription", "notifications", "security"].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Load Profile
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profileData) {
          setProfile({
            ...profileData,
            email: user.email
          } as Profile);
        }

        // Load Preferences
        const { data: prefData } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single();
        if (prefData) {
          setPreferences(prefData as UserPreferences);
        } else {
          // Initialize default preferences if they don't exist
          const defaultPrefs = {
            user_id: user.id,
            email_marketing: true,
            email_reminders: true,
            email_new_courses: true,
            email_results: true,
            email_promotions: false,
            push_enabled: false,
            frequency: 'daily'
          };
          const { data: newPrefs } = await supabase.from('user_preferences').insert(defaultPrefs).select().single();
          if (newPrefs) setPreferences(newPrefs as UserPreferences);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        username: profile.username,
        goal_level: profile.goal_level,
        current_level: profile.current_level,
      }).eq('id', user.id);

      if (error) alert(error.message);
      else showToast("Profil mis à jour !");
    }
    setSaving(false);
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!preferences) return;
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);

    const { error } = await supabase.from('user_preferences').update(updates).eq('user_id', preferences.user_id);
    if (error) alert(error.message);
  };

  const openStripePortal = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center h-screen items-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  const sidebarItems = [
    { id: "profile", label: "Profil", icon: User },
    { id: "subscription", label: "Abonnement", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Sécurité", icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 selection:bg-indigo-100 min-h-screen">
      {/* Breadcrumb Section */}
      <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <Home size={12} />
        </Link>
        <ChevronRight size={12} />
        <span className="text-zinc-500">Paramètres</span>
        <ChevronRight size={12} />
        <span className="text-indigo-600">
          {sidebarItems.find(i => i.id === activeSection)?.label}
        </span>
      </nav>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900">Paramètres</h1>
          <p className="text-muted-foreground font-medium mt-1">Gérez votre compte et vos préférences d&apos;apprentissage.</p>
        </div>
        <Button
          variant="outline"
          className="md:hidden rounded-[1.25rem] h-14 w-14 p-0 border-slate-200 bg-white shadow-sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 relative">
        {/* Sidebar Desktop */}
        <aside className="hidden md:block space-y-2 sticky top-10 h-fit">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-4 h-14 rounded-[1.5rem] font-bold transition-all duration-300",
                activeSection === item.id
                  ? "bg-zinc-900 text-white shadow-xl shadow-zinc-100 hover:bg-zinc-800 hover:text-white scale-[1.02]"
                  : "text-slate-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
              onClick={() => setActiveSection(item.id as SettingsSection)}
            >
              <item.icon size={20} className={activeSection === item.id ? "text-indigo-400" : "text-slate-400"} />
              {item.label}
            </Button>
          ))}
          <div className="pt-6 mt-6 border-t border-slate-100">
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 h-14 rounded-[1.5rem] text-red-500 hover:text-red-700 hover:bg-red-50 font-bold transition-all"
              onClick={handleSignOut}
            >
              <LogOut size={20} /> Déconnexion
            </Button>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute z-50 top-0 left-0 right-0 md:hidden bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 space-y-2 mx-4"
              >
                {sidebarItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-4 h-14 rounded-[1.25rem] font-bold transition-all",
                      activeSection === item.id ? "bg-indigo-50 text-indigo-600" : "text-slate-500"
                    )}
                    onClick={() => {
                      setActiveSection(item.id as SettingsSection);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Button>
                ))}
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-4 h-14 rounded-[1.25rem] text-red-500 font-bold"
                    onClick={handleSignOut}
                  >
                    <LogOut size={20} /> Déconnexion
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="md:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeSection === "profile" && (
                <ProfileSection
                  profile={profile}
                  setProfile={setProfile}
                  updateProfile={updateProfile}
                  saving={saving}
                  message={message}
                />
              )}
              {activeSection === "subscription" && (
                <SubscriptionSection
                  profile={profile}
                  openPortal={openStripePortal}
                  saving={saving}
                />
              )}
              {activeSection === "notifications" && (
                <NotificationsSection
                  preferences={preferences}
                  updatePreferences={updatePreferences}
                />
              )}
              {activeSection === "security" && (
                <SecuritySection
                  supabase={supabase}
                  showToast={showToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center h-screen items-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

// --- SUB-COMPONENTS ---

function ProfileSection({ profile, setProfile, updateProfile, saving, message }: any) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-8 md:p-12">
        <CardTitle className="text-3xl font-black">Informations Personnelles</CardTitle>
        <CardDescription className="font-medium text-lg text-slate-500 mt-1">Mettez à jour vos informations publiques et vos objectifs d&apos;apprentissage.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 md:p-12 pt-0 space-y-12">
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
          <div className="relative group">
            <div className="h-40 w-40 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User size={64} className="text-indigo-200" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center text-white">
                  <Loader2 className="animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 h-12 w-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center cursor-pointer hover:bg-indigo-600 transition-all shadow-xl group-hover:scale-110 duration-300">
              <Camera size={20} />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left pt-4">
            <h3 className="text-2xl font-black text-zinc-900">{profile?.full_name || "Utilisateur"}</h3>
            <p className="text-slate-500 font-bold text-lg">{profile?.email}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
              <Badge className={cn(
                "border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-full",
                profile?.subscription_tier === 'premium' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500'
              )}>
                {profile?.subscription_tier === 'premium' ? 'Membre Premium' : 'Compte Gratuit'}
              </Badge>
              {profile?.current_level && (
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-full">
                  Niveau {profile.current_level}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={updateProfile} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nom complet</Label>
              <Input
                id="name"
                className="h-16 rounded-[1.25rem] border-slate-200 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 transition-all font-bold text-lg px-6"
                value={profile?.full_name || ""}
                onChange={e => setProfile((p: any) => p ? {...p, full_name: e.target.value} : null)}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="username" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nom d&apos;utilisateur</Label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">@</span>
                <Input
                  id="username"
                  className="h-16 rounded-[1.25rem] border-slate-200 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 transition-all font-bold text-lg pl-12 pr-6"
                  value={profile?.username || ""}
                  placeholder="nomutilisateur"
                  onChange={e => setProfile((p: any) => p ? {...p, username: e.target.value} : null)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="level" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Niveau actuel de français</Label>
              <Select
                value={profile?.current_level || ""}
                onValueChange={(val: any) => setProfile((p: any) => p ? {...p, current_level: val} : null)}
              >
                <SelectTrigger className="h-16 rounded-[1.25rem] border-slate-200 font-bold text-lg px-6 focus:ring-8 focus:ring-indigo-50">
                  <SelectValue placeholder="Votre niveau actuel" />
                </SelectTrigger>
                <SelectContent className="bg-white border rounded-[1.5rem] shadow-2xl z-50 p-2">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                    <SelectItem key={lvl} value={lvl} className="font-bold rounded-xl h-12">{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="goal" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Objectif TEF IRN</Label>
              <Select
                value={profile?.goal_level || ""}
                onValueChange={(val: any) => setProfile((p: any) => p ? {...p, goal_level: val} : null)}
              >
                <SelectTrigger className="h-16 rounded-[1.25rem] border-slate-200 font-bold text-lg px-6 focus:ring-8 focus:ring-indigo-50">
                  <SelectValue placeholder="Choisir un objectif" />
                </SelectTrigger>
                <SelectContent className="bg-white border rounded-[1.5rem] shadow-2xl z-50 p-2">
                  <SelectItem value="A2" className="font-bold rounded-xl h-12">Carte de séjour (A2)</SelectItem>
                  <SelectItem value="B1" className="font-bold rounded-xl h-12">Carte de résident (B1)</SelectItem>
                  <SelectItem value="B2" className="font-bold rounded-xl h-12">Nationalité française (B2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6">
            <div className="text-sm text-emerald-600 font-black flex items-center gap-2">
              <AnimatePresence>
                {message && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <CheckCircle size={20} className="inline mr-2" /> {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button type="submit" disabled={saving} className="bg-zinc-900 hover:bg-zinc-800 text-white font-black h-16 px-12 rounded-[1.5rem] shadow-2xl shadow-zinc-200 transition-all hover:scale-[1.03] active:scale-[0.97]">
              {saving ? <Loader2 className="animate-spin mr-2" /> : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SubscriptionSection({ profile, openPortal, saving }: any) {
  const router = useRouter();
  const features = profile?.subscription_tier === 'premium'
    ? ["Accès illimité à l&apos;IA", "Tous les examens blancs", "Correction détaillée 24/7", "Coaching oral illimité", "Support prioritaire"]
    : ["Accès limité à l&apos;IA", "2 examens blancs", "Corrections simples", "Accès partiel aux leçons"];

  return (
    <div className="space-y-8">
      <Card className="border-indigo-100 bg-indigo-50/20 overflow-hidden relative rounded-[3rem] border-2 shadow-sm">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Sparkles size={160} className="text-indigo-600" />
        </div>
        <CardHeader className="p-10 md:p-14">
          <div className="flex justify-between items-start">
            <div>
              <Badge className={cn(
                "px-5 py-2 font-black uppercase tracking-[0.3em] text-[10px] rounded-full mb-6",
                profile?.subscription_tier === 'free' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
              )}>
                {profile?.subscription_tier === 'free' ? 'Plan Gratuit' : 'Plan Premium'}
              </Badge>
              <CardTitle className="text-4xl md:text-5xl font-black text-zinc-900 leading-tight">
                {profile?.subscription_tier === 'free' ? "Explosez vos scores avec le Premium" : "Vous avez le meilleur plan"}
              </CardTitle>
              <CardDescription className="text-indigo-900/60 font-bold mt-4 text-xl leading-relaxed max-w-xl">
                {profile?.subscription_tier === 'free'
                  ? "Rejoignez les milliers de candidats qui ont réussi leur TEF IRN grâce à nos outils IA avancés."
                  : "Profitez de l&apos;intégralité des fonctionnalités pour une réussite garantie."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 md:p-14 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4 font-bold text-zinc-900 text-lg">
                <div className="h-8 w-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                  <CheckCircle size={18} />
                </div>
                {f}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-white/80 backdrop-blur-md border-t border-indigo-100 p-10 md:p-12 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-lg font-black text-zinc-900 uppercase tracking-widest">Statut: <span className="text-emerald-600">ACTIF</span></p>
            </div>
            <p className="text-sm text-slate-400 font-bold italic mt-1">Prochain renouvellement automatique : --/--/----</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center w-full md:w-auto">
            {profile?.subscription_tier !== 'free' && (
              <Button
                variant="outline"
                className="h-16 px-10 rounded-[1.5rem] font-black border-slate-200 hover:bg-slate-50 transition-all text-lg shadow-sm"
                onClick={openPortal}
                disabled={saving}
              >
                {saving ? <Loader2 className="animate-spin mr-2" /> : <CreditCard size={20} className="mr-3" />}
                Gérer mes factures
              </Button>
            )}
            <Button
              className="h-16 px-10 rounded-[1.5rem] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 text-lg"
              onClick={() => router.push('/pricing?ref=settings')}
            >
              {profile?.subscription_tier === 'free' ? "Passer au Premium" : "Comparer les offres"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card className="rounded-[2.5rem] border-slate-100 bg-white">
        <CardHeader className="p-10">
          <CardTitle className="text-2xl font-black">Historique des transactions</CardTitle>
          <CardDescription className="font-medium text-lg">Consultez et téléchargez vos justificatifs de paiement.</CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-0 flex flex-col items-center justify-center py-20 text-slate-300">
          <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
            <CreditCard size={40} className="opacity-20" />
          </div>
          <p className="font-black text-lg">Aucun historique de facturation trouvé.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSection({ preferences, updatePreferences }: any) {
  if (!preferences) return null;

  const notificationOptions = [
    { key: "email_reminders", label: "Rappels d&apos;entraînement", desc: "Soyez motivé à pratiquer si vous n&apos;avez pas ouvert l&apos;app depuis 48h." },
    { key: "email_new_courses", label: "Nouveaux contenus", desc: "Restez à jour avec les dernières leçons et examens ajoutés." },
    { key: "email_results", label: "Résultats d&apos;examens", desc: "Recevez vos bilans de compétences détaillés directement dans votre boîte mail." },
    { key: "email_marketing", label: "Coaching & Astuces", desc: "Des conseils exclusifs chaque semaine pour améliorer votre français." },
    { key: "email_promotions", label: "Promotions & Offres", desc: "Ne manquez aucune opportunité de bénéficier de tarifs préférentiels." },
  ];

  return (
    <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-8 md:p-12">
        <CardTitle className="text-3xl font-black">Préférences de Notification</CardTitle>
        <CardDescription className="font-medium text-lg text-slate-500 mt-1">Personnalisez votre expérience pour rester concentré sur vos objectifs.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 md:p-12 pt-0 space-y-12">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 gap-6">
            <div className="text-center md:text-left">
              <p className="font-black text-xl text-zinc-900">Fréquence du résumé</p>
              <p className="text-slate-500 font-bold mt-1">À quel rythme souhaitez-vous être contacté ?</p>
            </div>
            <Select
              value={preferences.frequency}
              onValueChange={(val) => updatePreferences({ frequency: val })}
            >
              <SelectTrigger className="w-56 h-16 rounded-[1.25rem] border-slate-200 font-black text-lg bg-white px-6 focus:ring-8 focus:ring-indigo-50 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border rounded-[1.5rem] shadow-2xl p-2">
                <SelectItem value="immediate" className="font-bold h-12 rounded-xl">Instantané</SelectItem>
                <SelectItem value="daily" className="font-bold h-12 rounded-xl">Quotidien</SelectItem>
                <SelectItem value="weekly" className="font-bold h-12 rounded-xl">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {notificationOptions.map((opt) => (
              <div key={opt.key} className="flex items-center justify-between p-8 hover:bg-slate-50 transition-all rounded-[2rem] group">
                <div className="space-y-1 pr-10">
                  <p className="font-black text-xl text-zinc-900 group-hover:text-indigo-600 transition-colors">{opt.label}</p>
                  <p className="text-lg text-slate-500 font-medium leading-snug">{opt.desc}</p>
                </div>
                <Switch
                  checked={preferences[opt.key as keyof UserPreferences] as boolean}
                  onCheckedChange={(val) => updatePreferences({ [opt.key]: val })}
                  className="scale-125"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-end">
          <Button
            variant="ghost"
            className="text-red-500 font-black hover:bg-red-50 rounded-2xl h-14 px-8 text-lg"
            onClick={() => updatePreferences({
              email_marketing: false, email_reminders: false, email_new_courses: false,
              email_results: false, email_promotions: false
            })}
          >
            Désactiver toutes les notifications par email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySection({ supabase, showToast }: any) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert(error.message);
    else {
      showToast("Mot de passe mis à jour !");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  const handleSignOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) alert(error.message);
    else showToast("Toutes les autres sessions ont été déconnectées.");
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    // Simulation
    setTimeout(() => {
      alert("Pour des raisons de sécurité, veuillez contacter contact@isdinval.fr pour confirmer la suppression définitive de votre compte.");
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-10">
      {/* Change Password */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white">
        <CardHeader className="p-8 md:p-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Key size={28} />
            </div>
            <CardTitle className="text-3xl font-black">Sécurité du compte</CardTitle>
          </div>
          <CardDescription className="font-medium text-lg text-slate-500">Mettez régulièrement à jour votre mot de passe pour protéger votre accès.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 md:p-12 pt-0">
          <form onSubmit={handlePasswordChange} className="space-y-8 max-w-lg">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nouveau mot de passe</Label>
              <Input
                type="password"
                className="h-16 rounded-[1.25rem] border-slate-200 font-bold text-lg px-6 focus:ring-8 focus:ring-indigo-50 transition-all"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Confirmer le mot de passe</Label>
              <Input
                type="password"
                className="h-16 rounded-[1.25rem] border-slate-200 font-bold text-lg px-6 focus:ring-8 focus:ring-indigo-50 transition-all"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
            <Button disabled={saving} className="bg-zinc-900 hover:bg-zinc-800 text-white font-black h-16 px-12 rounded-[1.5rem] shadow-2xl shadow-zinc-200 transition-all hover:scale-[1.03]">
              {saving ? <Loader2 className="animate-spin mr-2" /> : "Mettre à jour mon mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white">
        <CardHeader className="p-8 md:p-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Smartphone size={28} />
            </div>
            <CardTitle className="text-3xl font-black">Sessions actives</CardTitle>
          </div>
          <CardDescription className="font-medium text-lg text-slate-500">Gérez vos connexions actives sur vos différents appareils.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 md:p-12 pt-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-zinc-50 p-10 rounded-[2.5rem] border border-zinc-100">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-white text-emerald-500 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-zinc-100">
                <Smartphone size={32} />
              </div>
              <div>
                <p className="font-black text-xl text-zinc-900">Appareil actuel</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                  <p className="text-sm text-emerald-600 font-black uppercase tracking-widest">En ligne</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-[1.25rem] font-black border-red-100 text-red-500 hover:bg-red-50 h-14 px-8 text-lg"
              onClick={handleSignOutAll}
            >
              Déconnecter les autres sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-8 md:p-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shadow-inner">
              <Shield size={28} />
            </div>
            <CardTitle className="text-3xl font-black">Authentification à deux facteurs</CardTitle>
          </div>
          <CardDescription className="font-medium text-lg text-slate-500">Ajoutez une couche de protection ultime pour sécuriser votre compte.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 md:p-12 pt-0">
          <div className="flex flex-col md:flex-row items-center justify-between p-10 border-4 border-dashed border-slate-50 rounded-[3rem] bg-slate-50/30 gap-8">
            <div className="flex items-center gap-6 text-center md:text-left">
              <div className="h-12 w-12 bg-white text-slate-300 rounded-full flex items-center justify-center shadow-sm">
                <Shield size={24} />
              </div>
              <p className="font-bold text-xl text-slate-400 italic">La 2FA n&apos;est pas encore activée sur votre compte.</p>
            </div>
            <Button variant="ghost" className="font-black text-indigo-400 bg-white shadow-xl shadow-slate-100 rounded-[1.25rem] h-14 px-8 text-lg cursor-not-allowed" disabled>
              Arrive très bientôt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-[2.5rem] border-red-100 bg-red-50/10 overflow-hidden mt-16">
        <CardHeader className="p-10 md:p-14">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
              <AlertTriangle size={24} />
            </div>
            <CardTitle className="text-3xl font-black text-red-600">Zone de danger</CardTitle>
          </div>
          <CardDescription className="text-red-900/60 font-bold text-xl leading-relaxed">Attention, ces actions sont définitives et entraîneront la perte de toute votre progression.</CardDescription>
        </CardHeader>
        <CardFooter className="p-10 md:p-14 pt-0">
          <Button
            variant="ghost"
            className="bg-red-50 text-red-600 hover:bg-red-100 font-black h-16 px-10 rounded-[1.5rem] w-full md:w-auto text-lg transition-all"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Supprimer mon compte Maitris définitivement
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md"
              onClick={() => setDeleteConfirmOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 bg-white rounded-[3rem] p-10 md:p-12 max-w-xl w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] space-y-10 border border-slate-100"
            >
              <div className="h-24 w-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle size={48} />
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight">Confirmation requise</h3>
                <p className="text-slate-500 font-bold text-xl leading-relaxed">Toutes vos leçons, notes, abonnements et résultats seront effacés de nos serveurs. Cette action est irréversible.</p>
              </div>
              <div className="flex flex-col gap-4">
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white font-black h-18 rounded-[1.5rem] shadow-2xl shadow-red-100 text-xl"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <Loader2 className="animate-spin mr-3" /> : <Trash2 size={22} className="mr-3" />}
                  Confirmer la suppression
                </Button>
                <Button
                  variant="ghost"
                  className="font-black h-16 rounded-[1.5rem] text-lg text-slate-400 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  Je change d&apos;avis
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
