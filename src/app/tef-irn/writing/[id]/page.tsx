import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { WritingCoachContent } from "../page";

export default function WritingByIdPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <WritingCoachContent />
    </Suspense>
  );
}
