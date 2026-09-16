import { RefreshCw, Unlink, Plug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_META } from "@/integrations/platform-limits";
import type { SocialAccount } from "@/lib/types";

const STATUS_CONFIG = {
  CONNECTED: { label: "Conectada", tone: "success" as const },
  RECONNECT_REQUIRED: { label: "Reconexão necessária", tone: "warning" as const },
  DISCONNECTED: { label: "Desconectada", tone: "neutral" as const },
  NOT_CONFIGURED: { label: "Integração não configurada", tone: "neutral" as const },
};

function formatDate(iso: string | null) {
  if (!iso) return "Nunca sincronizada";
  return `Sincronizada em ${new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function AccountCard({
  account,
  onReconnect,
  onDisconnect,
  onConnect,
}: {
  account: SocialAccount;
  onReconnect: () => void;
  onDisconnect: () => void;
  onConnect: () => void;
}) {
  const status = STATUS_CONFIG[account.status];
  const notConfigured = account.status === "NOT_CONFIGURED";

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar name={account.displayName} size={40} />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-surface-raised">
                <PlatformIcon platform={account.platform} size={11} className="text-ink-muted" />
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{PLATFORM_META[account.platform].label}</p>
              <p className="text-xs text-ink-muted">{notConfigured ? "—" : account.displayName}</p>
            </div>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>

        <p className="mt-4 text-xs text-ink-faint">{formatDate(account.lastSyncedAt)}</p>

        <div className="mt-4 flex gap-2">
          {notConfigured ? (
            <Button size="sm" variant="secondary" className="w-full" onClick={onConnect}>
              <Plug size={14} />
              Conectar
            </Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" className="flex-1" onClick={onReconnect}>
                <RefreshCw size={14} />
                Reconectar
              </Button>
              <Button size="sm" variant="ghost" className="flex-1" onClick={onDisconnect}>
                <Unlink size={14} />
                Desconectar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
