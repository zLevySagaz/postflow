import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/platform-icon";
import type { Post } from "@/lib/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UpcomingPosts({ posts }: { posts: Post[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Próximas publicações</CardTitle>
        <Link href="/calendar" className="text-xs text-accent-soft hover:underline">
          Ver calendário
        </Link>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="Nada agendado ainda"
            description="Crie seu primeiro post e escolha uma data para ele aparecer aqui."
            action={
              <Link href="/posts/new">
                <Button size="sm">Criar post</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-surface-border">
            {posts.map((post) => (
              <li key={post.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex -space-x-1">
                  {post.platformResults.slice(0, 3).map((pr) => (
                    <div
                      key={pr.accountId}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-surface-raised text-ink-muted"
                    >
                      <PlatformIcon platform={pr.platform} size={12} />
                    </div>
                  ))}
                </div>
                <p className="flex-1 truncate text-sm text-ink">{post.content}</p>
                <span className="shrink-0 text-xs text-ink-faint">
                  {post.scheduledAt ? formatDateTime(post.scheduledAt) : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
