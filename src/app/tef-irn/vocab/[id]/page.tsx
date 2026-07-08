import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { VocabCoachContent } from "../page";

export default function VocabByIdPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>}>
      <VocabCoachContent />
    </Suspense>
  );
}
