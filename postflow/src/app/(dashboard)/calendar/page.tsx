"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { MonthGrid } from "@/components/calendar/month-grid";
import { WeekView, DayView } from "@/components/calendar/agenda-views";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

export default function CalendarPage() {
  const { posts, updatePost } = useAppStore();
  const { show } = useToast();
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");

  const scheduledPosts = useMemo(
    () => posts.filter((p) => p.scheduledAt && p.status !== "CANCELLED"),
    [posts]
  );

  function step(delta: number) {
    const next = new Date(cursor);
    if (view === "month") next.setMonth(next.getMonth() + delta);
    else if (view === "week") next.setDate(next.getDate() + delta * 7);
    else next.setDate(next.getDate() + delta);
    setCursor(next);
  }

  function handleReschedule(postId: string, newDay: Date) {
    const post = posts.find((p) => p.id === postId);
    if (!post || !post.scheduledAt) return;
    const original = new Date(post.scheduledAt);
    const updated = new Date(newDay);
    updated.setHours(original.getHours(), original.getMinutes());
    updatePost(postId, { scheduledAt: updated.toISOString() });
    show("Publicação reagendada.", "success");
  }

  const title =
    view === "day"
      ? cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      : cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Calendário</h1>
          <p className="text-sm text-ink-muted">
            Arraste um post para outro dia para reagendar.
          </p>
        </div>
        <Link href="/posts/new">
          <Button size="sm"><Plus size={15} />Novo post</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => step(-1)} className="text-ink-muted hover:text-ink" aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <span className="w-40 text-sm font-medium capitalize text-ink">{title}</span>
          <button onClick={() => step(1)} className="text-ink-muted hover:text-ink" aria-label="Próximo">
            <ChevronRight size={18} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Hoje</Button>
        </div>
        <div className="flex gap-1 rounded-md border border-surface-border bg-surface p-1">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium",
                view === v ? "bg-surface-raised text-ink" : "text-ink-muted hover:text-ink"
              )}
            >
              {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && (
        <MonthGrid
          cursor={cursor}
          posts={scheduledPosts}
          onReschedule={handleReschedule}
          onDayClick={(d) => {
            setCursor(d);
            setView("day");
          }}
        />
      )}
      {view === "week" && (
        <WeekView cursor={cursor} posts={scheduledPosts} onReschedule={handleReschedule} />
      )}
      {view === "day" && <DayView cursor={cursor} posts={scheduledPosts} />}
    </div>
  );
}
