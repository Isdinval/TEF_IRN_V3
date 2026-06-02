"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowRight, GraduationCap, FileText, Landmark, Target } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleFinish = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        goal_level: goal,
        current_level: level as any,
      }).eq('id', user.id);
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        {step === 1 && (
          <>
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Target size={24} />
              </div>
              <CardTitle className="text-2xl">Quel est votre objectif ?</CardTitle>
              <CardDescription>Maitris adaptera votre parcours en fonction de vos besoins.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={goal} onValueChange={setGoal} className="grid grid-cols-1 gap-4">
                {[
                  { id: "A2", label: "Carte de séjour", icon: FileText, desc: "Niveau A2 requis" },
                  { id: "B1", label: "Carte de résident", icon: Landmark, desc: "Niveau B1 requis" },
                  { id: "B2", label: "Nationalité française", icon: GraduationCap, desc: "Niveau B2 requis" },
                ].map((item) => (
                  <Label
                    key={item.id}
                    htmlFor={item.id}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${goal === item.id ? 'border-indigo-600 bg-indigo-50/50' : ''}`}
                  >
                    <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                    <div className="p-2 bg-white rounded-lg border shadow-sm text-indigo-600">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button disabled={!goal} onClick={() => setStep(2)} className="w-full bg-indigo-600">
                Continuer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <GraduationCap size={24} />
              </div>
              <CardTitle className="text-2xl">Quel est votre niveau actuel ?</CardTitle>
              <CardDescription>Estimation rapide pour débuter votre préparation.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={level} onValueChange={setLevel} className="grid grid-cols-1 gap-4">
                {[
                  { id: "A1", label: "Débutant (A1)", desc: "Je connais quelques mots et phrases simples." },
                  { id: "A2", label: "Élémentaire (A2)", desc: "Je peux échanger sur des sujets familiers." },
                  { id: "B1", label: "Intermédiaire (B1)", desc: "Je me débrouille dans la plupart des situations." },
                ].map((item) => (
                  <Label
                    key={item.id}
                    htmlFor={item.id}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${level === item.id ? 'border-indigo-600 bg-indigo-50/50' : ''}`}
                  >
                    <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                    <div>
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button disabled={!level || loading} onClick={handleFinish} className="w-full bg-indigo-600">
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Commencer l'aventure"}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
