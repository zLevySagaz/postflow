"use client";

import { useMemo, useState } from "react";
import { UploadCloud, Search, ImageOff } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaGrid } from "@/components/media/media-grid";
import { cn } from "@/lib/utils";

type FolderFilter = "all" | "IMAGE" | "VIDEO";

export default function MediaLibraryPage() {
  const { media } = useAppStore();
  const [items, setItems] = useState(media);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FolderFilter>("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery =
        item.fileName.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [items, query, typeFilter]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Biblioteca de mídia</h1>
          <p className="text-sm text-ink-muted">Imagens e vídeos disponíveis para seus posts.</p>
        </div>
        <Button size="sm">
          <UploadCloud size={15} />
          Enviar arquivo
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Buscar por nome ou tag..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-md border border-surface-border bg-surface p-1">
          {(["all", "IMAGE", "VIDEO"] as FolderFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium",
                typeFilter === f ? "bg-surface-raised text-ink" : "text-ink-muted hover:text-ink"
              )}
            >
              {f === "all" ? "Todos" : f === "IMAGE" ? "Imagens" : "Vídeos"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="Nenhum arquivo encontrado"
          description="Envie imagens ou vídeos para usá-los nos seus posts."
          action={<Button size="sm"><UploadCloud size={14} />Enviar arquivo</Button>}
        />
      ) : (
        <MediaGrid
          items={filtered}
          onDelete={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
      )}
    </div>
  );
}
