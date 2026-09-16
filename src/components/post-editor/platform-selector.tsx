import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_META } from "@/integrations/platform-limits";
import { cn } from "@/lib/utils";
import type { SocialAccount } from "@/lib/types";

export function PlatformSelector({
  accounts,
  selected,
  onToggle,
}: {
  accounts: SocialAccount[];
  selected: string[];
  onToggle: (accountId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {accounts.map((acc) => {
        const isSelected = selected.includes(acc.id);
        const disabled = acc.status !== "CONNECTED";
        return (
          <button
            key={acc.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(acc.id)}
            title={disabled ? "Conecte esta rede em Contas conectadas" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
              disabled
                ? "cursor-not-allowed border-surface-border/60 text-ink-faint opacity-50"
                : isSelected
                ? "border-accent bg-accent/10 text-ink"
                : "border-surface-border text-ink-muted hover:border-ink-faint"
            )}
          >
            <PlatformIcon platform={acc.platform} size={16} />
            <span className="flex-1 truncate">{PLATFORM_META[acc.platform].label}</span>
            {isSelected && !disabled && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
