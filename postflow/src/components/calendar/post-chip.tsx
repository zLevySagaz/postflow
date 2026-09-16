import { PlatformIcon } from "@/components/shared/platform-icon";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";

const STATUS_DOT: Record<Post["status"], string> = {
  DRAFT: "bg-ink-faint",
  SCHEDULED: "bg-accent",
  PROCESSING: "bg-state-warning",
  PUBLISHED: "bg-state-success",
  FAILED: "bg-state-danger",
  CANCELLED: "bg-ink-faint",
};

export function PostChip({
  post,
  draggable,
  onDragStart,
}: {
  post: Post;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const time = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={cn(
        "flex items-center gap-1.5 truncate rounded border border-surface-border bg-surface-raised px-1.5 py-1 text-[11px] text-ink-muted",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[post.status])} />
      {time && <span className="shrink-0 text-ink-faint">{time}</span>}
      <PlatformIcon platform={post.platformResults[0]?.platform ?? "INSTAGRAM"} size={10} className="shrink-0" />
      <span className="truncate">{post.content}</span>
    </div>
  );
}
