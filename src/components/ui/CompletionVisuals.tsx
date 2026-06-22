import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const completionCardStyles = (isCompleted: boolean) =>
  isCompleted
    ? "bg-gradient-to-br from-indigo-50 to-white border-indigo-100/50 shadow-indigo-100/50"
    : "bg-white";

export const CompletionBadge = () => (
  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] h-5 px-2 rounded-full border-none font-bold uppercase tracking-wider flex items-center gap-1">
    <Check size={10} />
    Terminé
  </Badge>
);
