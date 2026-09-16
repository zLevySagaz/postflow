import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_META, PLATFORM_LIMITS } from "@/integrations/platform-limits";
import { Avatar } from "@/components/ui/avatar";
import type { SocialAccount } from "@/lib/types";

export function PlatformPreview({
  account,
  content,
  hasMedia,
}: {
  account: SocialAccount;
  content: string;
  hasMedia: boolean;
}) {
  const limits = PLATFORM_LIMITS[account.platform];
  const overLimit = content.length > limits.maxChars;

  return (
    <div className="w-64 shrink-0 rounded-lg border border-surface-border bg-surface-raised p-3">
      <div className="flex items-center gap-2">
        <Avatar name={account.displayName} size={22} />
        <span className="truncate text-xs font-medium text-ink">{account.displayName}</span>
        <PlatformIcon platform={account.platform} size={12} className="ml-auto text-ink-faint" />
      </div>
      <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-ink-muted">
        {content || "Seu texto aparece aqui..."}
      </p>
      {hasMedia && <div className="mt-2 h-20 rounded bg-base" />}
      <p className={`mt-2 text-[11px] ${overLimit ? "text-state-danger" : "text-ink-faint"}`}>
        {content.length}/{limits.maxChars} caracteres
        {overLimit && " · excede o limite"}
      </p>
      {!limits.supportsImage && hasMedia && (
        <p className="mt-1 text-[11px] text-state-warning">
          {PLATFORM_META[account.platform].label} não aceita imagem estática — use vídeo.
        </p>
      )}
    </div>
  );
}
