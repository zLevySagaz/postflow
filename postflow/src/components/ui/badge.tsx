import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-raised text-ink-muted border-surface-border",
  success: "bg-state-success/10 text-state-success border-state-success/20",
  warning: "bg-state-warning/10 text-state-warning border-state-warning/20",
  danger: "bg-state-danger/10 text-state-danger border-state-danger/20",
  accent: "bg-accent/10 text-accent-soft border-accent/20",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
