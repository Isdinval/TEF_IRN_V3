import { createClient } from "@/lib/supabase-server";
import { getParcours, getParcoursProgress, Parcours, ParcoursProgress } from "@/lib/parcours";
import ParcoursList from "./ParcoursList";

interface ParcoursWithProgress extends Parcours {
  progress?: ParcoursProgress;
}

export default async function ParcoursPage() {
  const supabase = await createClient();

  // Fetch user session
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all parcours
  const allParcours = await getParcours(supabase);

  let parcoursWithProgress: ParcoursWithProgress[] = [];

  if (user) {
    const progressPromises = allParcours.map(async (p) => {
      // Pass p.id to getParcoursProgress to fetch status and started_at
      const prog = await getParcoursProgress(user.id, p.level, p.category, p.id, supabase);
      return { ...p, progress: prog };
    });
    parcoursWithProgress = await Promise.all(progressPromises);
  } else {
    parcoursWithProgress = allParcours.map(p => ({ ...p }));
  }

  return (
    <ParcoursList
      allParcours={parcoursWithProgress}
      user={user}
    />
  );
}
