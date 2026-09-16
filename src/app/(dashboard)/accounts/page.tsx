"use client";
export const dynamic = 'force-dynamic';
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/context/app-store";
import { useToast } from "@/components/ui/toast";
import { AccountCard } from "@/components/accounts/account-card";
import { PLATFORM_META } from "@/integrations/platform-limits";
import type { SocialPlatform } from "@/lib/types";

export default function AccountsPage() {
  const { accounts, reconnectAccount, disconnectAccount } = useAppStore();
  const { show } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Depois do redirect de volta do /api/oauth/[platform]/callback (ver
  // src/integrations/oauth-route-handlers.ts), mostramos o resultado e
  // limpamos a URL.
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      show(`${PLATFORM_META[connected as SocialPlatform]?.label ?? connected} conectada com sucesso.`, "success");
      router.replace("/accounts");
    } else if (error) {
      show(error, "error");
      router.replace("/accounts");
    }
  }, [searchParams, show, router]);

  function handleConnect(platform: SocialPlatform) {
    // Dispara o fluxo OAuth real da plataforma — ver
    // src/app/api/oauth/[platform]/authorize/route.ts. Se as credenciais
    // (ex. INSTAGRAM_CLIENT_ID) não estiverem em .env, a rota redireciona
    // de volta com um erro claro em vez de travar.
    window.location.href = `/api/oauth/${platform.toLowerCase()}/authorize`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Contas conectadas</h1>
        <p className="text-sm text-ink-muted">
          Gerencie as redes sociais conectadas ao seu workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onReconnect={() => {
              reconnectAccount(account.id);
              show(`${account.displayName} reconectada.`, "success");
            }}
            onDisconnect={() => {
              disconnectAccount(account.id);
              show(`${account.displayName} desconectada.`, "info");
            }}
            onConnect={() => handleConnect(account.platform)}
          />
        ))}
      </div>
    </div>
  );
}
