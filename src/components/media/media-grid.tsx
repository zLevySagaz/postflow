import { ImageIcon, Film, Trash2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { MediaAsset } from "@/lib/types";

export function MediaGrid({
  items,
  onDelete,
}: {
  items: MediaAsset[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-lg border border-surface-border bg-surface"
        >
          <div className="flex aspect-square items-center justify-center bg-surface-raised text-ink-faint">
            {item.type === "IMAGE" ? <ImageIcon size={24} /> : <Film size={24} />}
          </div>
          <button
            onClick={() => onDelete(item.id)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-base/70 text-ink-muted opacity-0 backdrop-blur transition-opacity hover:text-state-danger group-hover:opacity-100"
            aria-label={`Excluir ${item.fileName}`}
          >
            <Trash2 size={14} />
          </button>
          <div className="space-y-1 p-3">
            <p className="truncate text-xs font-medium text-ink">{item.fileName}</p>
            <p className="text-[11px] text-ink-faint">
              {formatBytes(item.sizeBytes)} · {item.folder}
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-ink-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
