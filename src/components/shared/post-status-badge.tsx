import { Badge } from "@/components/ui/badge";
import type { PostStatus } from "@/lib/types";

const CONFIG: Record<PostStatus, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "accent" }> = {
  DRAFT: { label: "Rascunho", tone: "neutral" },
  SCHEDULED: { label: "Agendado", tone: "accent" },
  PROCESSING: { label: "Processando", tone: "warning" },
  PUBLISHED: { label: "Publicado", tone: "success" },
  FAILED: { label: "Falhou", tone: "danger" },
  CANCELLED: { label: "Cancelado", tone: "neutral" },
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const cfg = CONFIG[status];
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
