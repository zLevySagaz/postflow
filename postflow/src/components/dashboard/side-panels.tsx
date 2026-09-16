import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_META } from "@/integrations/platform-limits";
import type { Post, SocialAccount } from "@/lib/types";

const STATUS_TONE = {
  CONNECTED: { label: "Conectada", tone: "success" as const },
  RECONNECT_REQUIRED: { label: "Reconectar", tone: "warning" as const },
  DISCONNECTED: { label: "Desconectada", tone: "neutral" as const },
  NOT_CONFIGURED: { label: "Não configurada", tone: "neutral" as const },
};

export function ConnectedAccountsPanel({ accounts }: { accounts: SocialAccount[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Redes conectadas</CardTitle>
        <Link href="/accounts" className="text-xs text-accent-soft hover:underline">
          Gerenciar
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map((acc) => {
          const status = STATUS_TONE[acc.status];
          return (
            <div key={acc.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${PLATFORM_META[acc.platform].color}20` }}
                >
                  <PlatformIcon
                    platform={acc.platform}
                    size={14}
                    className="text-ink-muted"
                  />
                </div>
                <span className="text-sm text-ink">{PLATFORM_META[acc.platform].label}</span>
              </div>
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return "agora há pouco";
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.round(hours / 24)}d`;
}

export function RecentActivity({ posts }: { posts: Post[] }) {
  const recent = [...posts]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5);

  const ACTION_LABEL: Record<string, string> = {
    DRAFT: "salvou um rascunho",
    SCHEDULED: "agendou um post",
    PUBLISHED: "publicou um post",
    FAILED: "teve uma falha de publicação",
    CANCELLED: "cancelou um post",
    PROCESSING: "está publicando um post",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recent.map((post) => (
            <li key={post.id} className="flex gap-2.5 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <div>
                <p className="text-ink-muted">
                  Você {ACTION_LABEL[post.status]}
                  <span className="text-ink"> — &ldquo;{post.content.slice(0, 40)}
                  {post.content.length > 40 ? "…" : ""}&rdquo;</span>
                </p>
                <p className="text-xs text-ink-faint">{timeAgo(post.updatedAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
