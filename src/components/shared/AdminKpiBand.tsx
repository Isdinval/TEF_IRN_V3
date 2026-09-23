export interface AdminKpiItem {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "danger";
}

const TONE_CLASSES: Record<NonNullable<AdminKpiItem["tone"]>, string> = {
  default: "text-zinc-800",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-rose-600",
};

export function AdminKpiBand({ items }: { items: AdminKpiItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p className="text-[10px] font-black uppercase text-zinc-400">{item.label}</p>
          <p className={`text-2xl font-black ${TONE_CLASSES[item.tone ?? "default"]}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
