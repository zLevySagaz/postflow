"use client";

import { PostChip } from "./post-chip";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

const WEEKDAY_LABEL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function WeekView({
  cursor,
  posts,
  onReschedule,
}: {
  cursor: Date;
  posts: Post[];
  onReschedule: (postId: string, newDate: Date) => void;
}) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const today = new Date();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayPosts = posts.filter((p) => p.scheduledAt && sameDay(new Date(p.scheduledAt), day));
        return (
          <div
            key={day.toISOString()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const postId = e.dataTransfer.getData("text/post-id");
              if (postId) onReschedule(postId, day);
            }}
            className="min-h-[140px] rounded-lg border border-surface-border p-2"
          >
            <p className={cn("text-xs font-medium", sameDay(day, today) ? "text-accent-soft" : "text-ink-muted")}>
              {WEEKDAY_LABEL[day.getDay()].slice(0, 3)} {day.getDate()}
            </p>
            <div className="mt-2 space-y-1">
              {dayPosts.map((post) => (
                <PostChip
                  key={post.id}
                  post={post}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/post-id", post.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DayView({ cursor, posts }: { cursor: Date; posts: Post[] }) {
  const dayPosts = posts
    .filter((p) => p.scheduledAt && sameDay(new Date(p.scheduledAt), cursor))
    .sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1));

  return (
    <div className="rounded-lg border border-surface-border p-4">
      <p className="text-sm font-medium text-ink">
        {WEEKDAY_LABEL[cursor.getDay()]}, {cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
      </p>
      {dayPosts.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ink-faint">Nada agendado para este dia.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {dayPosts.map((post) => (
            <PostChip key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
