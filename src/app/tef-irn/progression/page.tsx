import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { getLevelProgression } from "@/lib/progression";
import ProgressionInteractive from "./ProgressionInteractive";

export const metadata = {
  title: "Ma progression | LlamaKusi",
  description: "Votre progression complète vers le TEF IRN, niveau par niveau : parcours, expression écrite, expression orale et examens blancs.",
};

export default async function ProgressionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/tef-irn/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_level")
    .eq("id", user.id)
    .maybeSingle();

  const [levels] = await Promise.all([
    getLevelProgression(user.id, supabase),
  ]);

  return (
    <ProgressionInteractive
      levels={levels}
      currentLevel={(profile?.current_level as string) || "A1"}
    />
  );
}
