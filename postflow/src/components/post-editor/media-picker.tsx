import { ImageIcon, Film, UploadCloud, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/lib/types";

export function MediaPicker({
  media,
  selected,
  onToggle,
}: {
  media: MediaAsset[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      <button
        type="button"
        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-surface-border text-ink-faint hover:border-ink-faint hover:text-ink-muted"
      >
        <UploadCloud size={18} />
        <span className="text-[11px]">Enviar</span>
      </button>
      {media.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={cn(
              "relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border bg-surface-raised text-ink-faint transition-colors",
              isSelected ? "border-accent" : "border-surface-border hover:border-ink-faint"
            )}
          >
            {item.type === "IMAGE" ? <ImageIcon size={18} /> : <Film size={18} />}
            <span className="max-w-[80%] truncate text-[10px]">{item.fileName}</span>
            {isSelected && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                <Check size={10} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
