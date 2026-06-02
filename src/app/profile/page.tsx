"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";
import { Profile } from "@/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      goal_level: profile.goal_level,
    }).eq('id', profile.id);

    if (error) alert(error.message);
    else setMessage("Profil mis à jour !");

    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>Configurez votre identité et vos objectifs TEF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom Complet</Label>
              <Input
                id="full_name"
                value={profile?.full_name || ""}
                onChange={(e) => setProfile(p => p ? {...p, full_name: e.target.value} : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal_level">Objectif TEF IRN</Label>
              <Select
                value={profile?.goal_level || ""}
                onValueChange={(val) => setProfile(p => p ? {...p, goal_level: val as any} : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre objectif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A2">Carte de séjour (A2)</SelectItem>
                  <SelectItem value="B1">Carte de résident (B1)</SelectItem>
                  <SelectItem value="B2">Nationalité française (B2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t p-6">
            <div className="text-sm text-green-600 flex items-center gap-1">
              {message && <><CheckCircle size={16} /> {message}</>}
            </div>
            <Button type="submit" className="bg-indigo-600" disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : "Enregistrer les modifications"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
