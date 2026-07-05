import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ExerciseView from "../page"; // On va exporter ExerciseView du parent

export default function GrammarCheckByIdPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    }>
      <ExerciseView id="" onBack={() => {}} /> {/* Sera remplacé par props réels */}
    </Suspense>
  );
}
