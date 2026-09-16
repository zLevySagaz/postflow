import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: "neutral" | "accent" | "danger";
}) {
  const toneClass =
    tone === "accent" ? "text-accent-soft" : tone === "danger" ? "text-state-danger" : "text-ink-muted";
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-muted">{label}</span>
          <Icon size={16} className={toneClass} />
        </div>
        <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      </CardContent>
    </Card>
  );
}
